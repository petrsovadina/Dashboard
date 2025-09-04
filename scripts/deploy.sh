#!/bin/bash

# Azure AI Dashboard Deployment Script

set -e

echo "🚀 Starting Azure AI Dashboard deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Please copy .env.example to .env and configure it.${NC}"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=(
    "AZURE_SUBSCRIPTION_ID"
    "AZURE_TENANT_ID" 
    "AZURE_CLIENT_ID"
    "AZURE_CLIENT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p logs cache monitoring/grafana/dashboards monitoring/grafana/datasources nginx/ssl

# Stop existing containers
echo -e "${YELLOW}🛑 Stopping existing services...${NC}"
docker-compose down || true

# Pull latest images
echo -e "${YELLOW}📥 Pulling latest Docker images...${NC}"
docker-compose pull

# Build application image
echo -e "${YELLOW}🔨 Building application...${NC}"
docker-compose build

# Start services
echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Check health
echo -e "${YELLOW}🔍 Checking service health...${NC}"
docker-compose ps

# Test endpoints
echo -e "${YELLOW}🧪 Testing endpoints...${NC}"
for i in {1..5}; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        break
    elif [ $i -eq 5 ]; then
        echo -e "${RED}❌ Health check failed after 5 attempts${NC}"
        echo -e "${YELLOW}📋 Application logs:${NC}"
        docker-compose logs azure-ai-dashboard
        exit 1
    else
        echo -e "${YELLOW}⏳ Waiting for application to start (attempt $i/5)...${NC}"
        sleep 10
    fi
done

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${GREEN}📊 Dashboard: http://localhost:3001${NC}"
echo -e "${GREEN}📈 Monitoring: http://localhost:3000 (admin/dashboard123)${NC}"
echo -e "${GREEN}📋 Logs: docker-compose logs -f azure-ai-dashboard${NC}"
echo -e "${GREEN}🔧 Prometheus: http://localhost:9090${NC}"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "  docker-compose logs -f azure-ai-dashboard    # View logs"
echo "  docker-compose restart azure-ai-dashboard    # Restart app"
echo "  docker-compose down                          # Stop all services"
echo "  docker-compose up -d                         # Start all services"
echo ""