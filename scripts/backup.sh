#!/bin/bash

# Backup script for dashboard data

BACKUP_DIR="/tmp/azure-ai-dashboard-backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 Starting backup process..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup Redis data
echo "💾 Backing up Redis data..."
if docker ps | grep -q dashboard-redis; then
    docker exec dashboard-redis redis-cli --rdb /data/backup.rdb 2>/dev/null || echo "⚠️ Redis backup failed"
    docker cp dashboard-redis:/data/backup.rdb "$BACKUP_DIR/$DATE/redis-backup.rdb" 2>/dev/null || echo "⚠️ Could not copy Redis backup"
else
    echo "⚠️ Redis container not running, skipping Redis backup"
fi

# Backup Grafana data
echo "📈 Backing up Grafana data..."
if docker ps | grep -q dashboard-grafana; then
    docker exec dashboard-grafana tar czf /tmp/grafana-backup.tar.gz /var/lib/grafana 2>/dev/null || echo "⚠️ Grafana backup failed"
    docker cp dashboard-grafana:/tmp/grafana-backup.tar.gz "$BACKUP_DIR/$DATE/" 2>/dev/null || echo "⚠️ Could not copy Grafana backup"
else
    echo "⚠️ Grafana container not running, skipping Grafana backup"
fi

# Backup configuration files
echo "⚙️ Backing up configuration files..."
cp .env "$BACKUP_DIR/$DATE/.env.backup" 2>/dev/null || echo "⚠️ No .env file found"
cp docker-compose.yml "$BACKUP_DIR/$DATE/" 2>/dev/null || echo "⚠️ No docker-compose.yml found"
cp -r monitoring "$BACKUP_DIR/$DATE/" 2>/dev/null || echo "⚠️ No monitoring directory found"

# Create backup metadata
cat > "$BACKUP_DIR/$DATE/metadata.json" <<EOF
{
  "timestamp": "$DATE",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
  "services": $(docker-compose ps --services 2>/dev/null | jq -R -s -c 'split("\n")[:-1]' || echo '[]')
}
EOF

# Compress backup
echo "🗜️ Compressing backup..."
tar czf "$BACKUP_DIR/dashboard-backup-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "dashboard-backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || true

echo "✅ Backup completed: $BACKUP_DIR/dashboard-backup-$DATE.tar.gz"
echo "📊 Backup size: $(du -h "$BACKUP_DIR/dashboard-backup-$DATE.tar.gz" | cut -f1)"