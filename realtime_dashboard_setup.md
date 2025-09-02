# 🚀 Azure AI Real-time Dashboard - Kompletní Setup

## 📦 1. Package.json

```json
{
  "name": "azure-ai-realtime-dashboard",
  "version": "1.0.0",
  "description": "Real-time dashboard pro monitoring Azure AI modelů s CZK konverzí",
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
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["azure", "openai", "pricing", "dashboard", "realtime"],
  "author": "Your Name",
  "license": "MIT"
}
```

## 📁 2. Struktura projektu

```
azure-ai-dashboard/
├── package.json
├── .env                    # Vaše Azure klíče
├── .gitignore
├── server.js              # Hlavní server
├── test-auth.js           # Test skript
├── public/
│   ├── index.html         # Dashboard UI
│   ├── dashboard.js       # Frontend logika
│   └── style.css          # Styly
└── README.md
```

## 🔐 3. .env soubor

```env
# Azure Authentication (POVINNÉ)
AZURE_SUBSCRIPTION_ID=12345678-1234-1234-1234-123456789012
AZURE_TENANT_ID=87654321-4321-4321-4321-210987654321
AZURE_CLIENT_ID=11223344-5566-7788-9900-112233445566
AZURE_CLIENT_SECRET=your-super-secret-password

# Konfigurace (VOLITELNÉ)
AZURE_RESOURCE_GROUP_NAME=my-ai-foundry-rg
AZURE_REGION=westeurope
PORT=3001
NODE_ENV=production

# Dashboard nastavení
AUTO_REFRESH_SECONDS=30
ENABLE_WEBSOCKET=true
CACHE_DURATION_MINUTES=5
```

## 🖥️ 4. server.js - Hlavní server

```javascript
#!/usr/bin/env node

require('dotenv').config();
const { AzureAIRealtimeServer } = require('./azure-realtime-backend');

// Validace environment variables
const requiredVars = [
  'AZURE_SUBSCRIPTION_ID',
  'AZURE_TENANT_ID', 
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET'
];

const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please check your .env file');
  process.exit(1);
}

// Konfigurace serveru
const config = {
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  tenantId: process.env.AZURE_TENANT_ID,
  clientId: process.env.AZURE_CLIENT_ID,
  clientSecret: process.env.AZURE_CLIENT_SECRET,
  resourceGroup: process.env.AZURE_RESOURCE_GROUP_NAME || '',
  region: process.env.AZURE_REGION || 'westeurope'
};

const port = process.env.PORT || 3001;

console.log('🚀 Starting Azure AI Real-time Dashboard...');
console.log(`📍 Region: ${config.region}`);
console.log(`🔗 Port: ${port}`);

// Spuštění serveru
const server = new AzureAIRealtimeServer(config);

try {
  server.start(port);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    server.stop();
    process.exit(0);
  });
  
} catch (error) {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
}
```

## 🌐 5. public/index.html - Dashboard UI

```html
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Azure AI Real-time Dashboard</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-gray-50">
    <div id="app">
        <!-- Loading Screen -->
        <div id="loading" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Připojování k Azure...</h3>
                    <p class="text-gray-600" id="loading-status">Inicializace dashboardu</p>
                </div>
            </div>
        </div>

        <!-- Main Dashboard -->
        <div id="dashboard" class="hidden">
            <!-- Header -->
            <header class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-4">
                        <div class="flex items-center">
                            <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900">Azure AI Dashboard</h1>
                                <p class="text-sm text-gray-600" id="last-update">Načítání...</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <!-- Connection Status -->
                            <div id="connection-status" class="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                Připojování...
                            </div>
                            
                            <!-- Currency Toggle -->
                            <button id="currency-toggle" class="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                                CZK
                            </button>
                            
                            <!-- Settings -->
                            <button id="settings-btn" class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Celkové náklady</p>
                                <p class="text-2xl font-bold text-gray-900" id="total-cost">$0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Celkem tokenů</p>
                                <p class="text-2xl font-bold text-gray-900" id="total-tokens">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Požadavků</p>
                                <p class="text-2xl font-bold text-gray-900" id="total-requests">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Nejpoužívanější</p>
                                <p class="text-2xl font-bold text-gray-900" id="top-model">-</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Models Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div id="models-container">
                        <!-- Models will be dynamically inserted here -->
                    </div>
                </div>

                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Hodinový trend nákladů</h3>
                        <canvas id="hourlyChart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Distribuce nákladů</h3>
                        <canvas id="distributionChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>
```

## 📱 6. Rychlá instalace a spuštění

```bash
# 1. Stažení nebo vytvoření projektu
mkdir azure-ai-dashboard
cd azure-ai-dashboard

# 2. Inicializace npm projektu
npm init -y

# 3. Instalace dependencies
npm install express cors ws node-cron dotenv
npm install -D nodemon

# 4. Vytvoření .env souboru s vašimi Azure klíči
cat > .env << 'EOF'
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_REGION=westeurope
PORT=3001
EOF

# 5. Vytvoření public složky
mkdir public

# 6. Spuštění serveru
npm start
```

## ⚡ 7. Rychlé testování

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test dashboard data  
curl http://localhost:3001/api/dashboard

# Test pricing data
curl http://localhost:3001/api/pricing

# Open dashboard v browseru
open http://localhost:3001
```

## 🔧 8. Konfigurace pro produkci

### Docker Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose:
```yaml
version: '3.8'
services:
  azure-ai-dashboard:
    build: .
    ports:
      - "3001:3001"
    environment:
      - AZURE_SUBSCRIPTION_ID=${AZURE_SUBSCRIPTION_ID}
      - AZURE_TENANT_ID=${AZURE_TENANT_ID}
      - AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
      - AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}
      - AZURE_REGION=westeurope
    restart: unless-stopped
```

## 🚀 9. Spuštění:

```bash
# Development mode
npm run dev

# Production mode  
npm start

# S Docker
docker-compose up -d
```

Dashboard bude dostupný na: **http://localhost:3001** 🎉

## 🎯 10. Features dashboardu:

✅ **Real-time updates** každých 30 sekund  
✅ **WebSocket** pro okamžité aktualizace  
✅ **CZK konverze** s live exchange rates  
✅ **Přehledné grafy** s trendy  
✅ **Autentifikace** pomocí Azure klíčů  
✅ **Mobile responsive** design  
✅ **Error handling** a fallback data  
✅ **Konfigurovatelné** refresh intervaly  

Stačí vyplnit vaše Azure klíče do .env souboru a dashboard je připraven k použití! 🚀