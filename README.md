# Azure AI Real-time Dashboard 🚀

> Kompletní real-time dashboard pro monitoring nákladů a využití Azure AI modelů s podporou CZK konverze, autentifikace a WebSocket aktualizací.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![Security](https://img.shields.io/badge/Security-Enterprise_Grade-green?style=flat-square)](https://github.com/petrsovadina/Dashboard)

## 🎯 Funkce dashboardu

### ✨ **Hlavní funkce**
- 📊 **Real-time monitoring** cen tokenů pro všechny Azure AI modely
- 💱 **CZK konverze** s live exchange rates  
- 📈 **Interactive grafy** s trendy usage a nákladů
- 🔒 **Zabezpečená autentifikace** pomocí Azure Service Principal
- ⚡ **WebSocket** pro okamžité aktualizace bez refresh stránky
- 📱 **Responsive design** fungující na mobilu i desktpu
- 🌍 **West Europe region** optimalizované (podporuje všechny regiony)

### 📋 **Podporované modely**
- GPT-4o / GPT-4o-mini
- GPT-4 / GPT-4 Turbo  
- GPT-3.5 Turbo
- Text Embedding modely
- DALL-E image generation
- Všechny budoucí modely automaticky

### 🔧 **Technické funkce**
- **Auto-refresh** každých 30 sekund (konfigurovatelné)
- **Error handling** s fallback daty
- **Caching systém** pro optimální performance
- **Docker deployment** s monitoring stackem
- **Health checks** a alerting
- **Backup & recovery** skripty

---

## 🚀 Rychlá instalace (5 minut)

### **Předpoklady**
- Node.js 18+
- Azure AI Foundry subscription
- Docker (volitelné, pro production)

### **1. Stažení a setup**
```bash
# Clone nebo vytvoř projekt
mkdir azure-ai-dashboard && cd azure-ai-dashboard

# Inicializace
npm init -y

# Instalace dependencies
npm install express cors ws node-cron dotenv nodemon
```

### **2. Konfigurace Azure klíčů**
```bash
# Vytvoř Service Principal
az ad sp create-for-rbac \
  --name "AzureAIPricingDashboard" \
  --role "Cost Management Reader" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)"

# Vytvoř .env soubor
cat > .env << 'EOF'
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id  
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_REGION=westeurope
PORT=3001
EOF
```

### **3. Spuštění**
```bash
# Development mode
npm run dev

# Production mode  
npm start

# S Docker
docker-compose up -d
```

**Dashboard bude dostupný na: http://localhost:3001** 🎉

---

## 📖 Podrobná instalace

### **Krok 1: Azure Service Principal**

Potřebujete vytvořit Service Principal s potřebnými oprávněními:

```bash
# 1. Přihlášení do Azure
az login

# 2. Zobrazení dostupných subscriptions
az account list --output table

# 3. Nastavení správné subscription
az account set --subscription "your-subscription-id"

# 4. Vytvoření Service Principal
az ad sp create-for-rbac \
  --name "AzureAIPricingDashboard" \
  --role "Cost Management Reader" \
  --scopes "/subscriptions/your-subscription-id"
```

**Výstup si uložte - obsahuje všechny potřebné klíče:**
```json
{
  "appId": "11223344-5566-7788-9900-112233445566",      // AZURE_CLIENT_ID
  "displayName": "AzureAIPricingDashboard",
  "password": "super-secret-password-here",             // AZURE_CLIENT_SECRET  
  "tenant": "87654321-4321-4321-4321-210987654321"     // AZURE_TENANT_ID
}
```

### **Krok 2: Struktura projektu**

Vytvořte tuto strukturu:
```
azure-ai-dashboard/
├── package.json              # Dependencies
├── .env                      # Azure klíče (SECRET!)
├── .gitignore               # Git ignore file
├── server.js                # Hlavní server
├── azure-realtime-backend.js # Backend logika  
├── test-auth.js             # Test utility
├── public/
│   ├── index.html           # Dashboard UI
│   ├── dashboard.js         # Frontend JS
│   └── style.css            # CSS styly
├── monitoring/              # Prometheus + Grafana
├── nginx/                   # Reverse proxy config
└── scripts/                 # Utility skripty
```

### **Krok 3: Konfigurace souborů**

**package.json:**
```json
{
  "name": "azure-ai-realtime-dashboard",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test-auth.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5", 
    "ws": "^8.14.2",
    "node-cron": "^3.0.2",
    "dotenv": "^16.3.1"
  }
}
```

**.env soubor (NIKDY necommitujte!):**
```env
# Azure Authentication (POVINNÉ)
AZURE_SUBSCRIPTION_ID=12345678-1234-1234-1234-123456789012
AZURE_TENANT_ID=87654321-4321-4321-4321-210987654321
AZURE_CLIENT_ID=11223344-5566-7788-9900-112233445566
AZURE_CLIENT_SECRET=your-super-secret-password

# Konfigurace
AZURE_RESOURCE_GROUP_NAME=my-ai-foundry-rg
AZURE_REGION=westeurope
PORT=3001
AUTO_REFRESH_SECONDS=30
```

### **Krok 4: Test konfigurace**
```bash
# Test Azure autentifikace
node test-auth.js

# Očekávaný výstup:
# ✅ AZURE_SUBSCRIPTION_ID: 12345678...
# ✅ AZURE_TENANT_ID: 87654321...  
# ✅ AZURE_CLIENT_ID: 11223344...
# ✅ AZURE_CLIENT_SECRET: ********...
# ✅ Azure authentication successful!
# 🎉 ALL TESTS PASSED!
```

---

## 🐳 Docker Deployment

Pro production nasazení s monitoringem:

```bash
# 1. Clone kompletní konfiguraci
git clone <repository> azure-ai-dashboard
cd azure-ai-dashboard

# 2. Nastavení environment variables
cp .env.example .env
# Edituj .env s vašimi Azure klíči

# 3. Deployment
make deploy

# nebo manuálně:
./scripts/deploy.sh
```

**Služby po deployment:**
- 📊 **Dashboard**: http://localhost:3001
- 📈 **Grafana monitoring**: http://localhost:3000 (admin/dashboard123)  
- 🔍 **Prometheus metrics**: http://localhost:9090
- 🔧 **Redis cache**: localhost:6379

---

## 📊 API Endpoints

Dashboard poskytuje REST API pro integraci:

### **Základní endpoints**
```bash
# Health check
GET /api/health

# Kompletní dashboard data
GET /api/dashboard

# Pouze pricing data
GET /api/pricing

# Pouze usage data  
GET /api/usage

# Exchange rates
GET /api/exchange-rates
```

### **Příklad API response**
```json
{
  "success": true,
  "models": [
    {
      "name": "gpt-4o",
      "inputPrice": 0.0000025,
      "outputPrice": 0.00001,
      "usage": {
        "totalCost": 15.85,
        "inputTokens": 2450000,
        "outputTokens": 980000,
        "requests": 3420
      },
      "trend": "+12%",
      "status": "active"
    }
  ],
  "summary": {
    "totalCost": 34.71,
    "totalTokens": 34620000,
    "totalRequests": 47550
  },
  "exchangeRates": {
    "USD_CZK": 24.5
  },
  "region": "West Europe",
  "lastUpdate": "2025-09-01T15:30:00.000Z"
}
```

### **WebSocket real-time updates**
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

---

## ⚙️ Konfigurace

### **Environment Variables**

| Proměnná | Povinná | Default | Popis |
|----------|---------|---------|-------|
| `AZURE_SUBSCRIPTION_ID` | ✅ | - | ID Azure subscription |
| `AZURE_TENANT_ID` | ✅ | - | Azure tenant ID |
| `AZURE_CLIENT_ID` | ✅ | - | Service Principal client ID |
| `AZURE_CLIENT_SECRET` | ✅ | - | Service Principal secret |
| `AZURE_REGION` | ❌ | westeurope | Azure region |
| `PORT` | ❌ | 3001 | Server port |
| `AUTO_REFRESH_SECONDS` | ❌ | 30 | Auto-refresh interval |
| `CACHE_DURATION_MINUTES` | ❌ | 5 | Cache expiration |
| `LOG_LEVEL` | ❌ | info | Log level |

### **Podporované regiony**
- 🇪🇺 **West Europe** (doporučené)
- 🇪🇺 **North Europe** 
- 🇺🇸 **East US**
- 🇺🇸 **West US**
- 🇬🇧 **UK South**

---

## 🔧 Customizace

### **Změna refresh intervalu**
```javascript
// V dashboard.js
const REFRESH_INTERVAL = 15; // 15 sekund

// Nebo v .env
AUTO_REFRESH_SECONDS=15
```

### **Přidání vlastních metrik**
```javascript
// V azure-realtime-backend.js
calculateCustomMetrics(models) {
  return {
    averageCostPerModel: models.reduce((sum, m) => sum + m.usage.totalCost, 0) / models.length,
    mostExpensiveModel: models.reduce((max, m) => m.usage.totalCost > max.usage.totalCost ? m : max),
    // Vaše custom metriky...
  };
}
```

### **Přidání alertů**
```javascript
// Slack/Teams notifikace při překročení budgetu
if (totalCost > BUDGET_LIMIT) {
  await sendSlackAlert(`Budget exceeded: $${totalCost}`);
}
```

---

## 🔍 Troubleshooting

### **Častые problémy**

**1. Authentication failed**
```bash
# Ověření Service Principal
az ad sp show --id $AZURE_CLIENT_ID

# Reset client secret
az ad sp credential reset --id $AZURE_CLIENT_ID
```

**2. Cost Management API error 403**
```bash
# Přidělení Cost Management Reader role
az role assignment create \
  --assignee $AZURE_CLIENT_ID \
  --role "Cost Management Reader" \
  --scope /subscriptions/$AZURE_SUBSCRIPTION_ID
```

**3. WebSocket connection failed**
```bash
# Kontrola portů
netstat -tulpn | grep :3001

# Kontrola firewall
sudo ufw allow 3001
```

**4. No pricing data**
```bash
# Test Retail Prices API
curl "https://prices.azure.com/api/retail/prices?api-version=2023-01-01-preview&\$filter=serviceName eq 'Cognitive Services'"
```

### **Debug mode**
```bash
# Zapnutí debug logů
LOG_LEVEL=debug npm start

# Detailní logy
docker-compose logs -f azure-ai-dashboard
```

### **Performance tuning**
```env
# Optimalizace pro velké množství dat
CACHE_DURATION_MINUTES=15
AUTO_REFRESH_SECONDS=60
ENABLE_WEBSOCKET=false
```

---

## 📈 Monitoring & Alerting

Dashboard obsahuje kompletní monitoring stack:

### **Metriky**
- Response time API calls
- Azure API error rate  
- WebSocket connections
- Memory & CPU usage
- Cache hit ratio

### **Alerting pravidla**
- Dashboard down > 1 minute
- Error rate > 10%
- API latency > 500ms
- Azure API failures > 5

### **Grafana dashboards**
- Real-time metrics overview
- Azure API performance
- Cost trends analysis
- System resource usage

---

### **Production security**
```bash
# SSL certifikáty
./scripts/setup-ssl.sh

# Firewall pravidla
sudo ufw allow 80,443/tcp
sudo ufw deny 3001

# Regular security updates
./scripts/security-update.sh
```
## ⚡ Rychlé spuštění (5 minut)

```bash
# 1. Vytvoření Service Principal
az ad sp create-for-rbac \
  --name "AzureAIPricingDashboard" \
  --role "Cost Management Reader" \
  --scopes "/subscriptions/$(az account show --query id -o tsv)"

# 2. Nastavení .env s vašimi klíči
cat > .env << 'EOF'
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
AZURE_REGION=westeurope
EOF

# 3. Spuštění
npm install && npm start
```

Dashboard bude dostupný na: http://localhost:3001 🎯

🔧 Pokročilé funkce:
- Auto-refresh každých 30 sekund
- Error handling s fallback daty
- Caching systém pro rychlé odpovědi
- Health monitoring & alerting
- Backup & recovery skripty
- API endpoints pro integrace
