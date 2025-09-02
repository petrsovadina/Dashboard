# CLAUDE.md

Tento soubor poskytuje pokyny pro Claude Code (claude.ai/code) při práci s kódem v tomto úložišti.

## Architektura projektu

Tento projekt je Azure AI Real-time Pricing Dashboard – aplikace pro monitorování nákladů modelů Azure AI v reálném čase.

### Struktura aplikace

- **azure_ai_realtime_dashboard.tsx** - React frontend komponenta s dashboardem
- **azure_realtime_backend.js** - Node.js backend service s Azure API integrací
- **dashboard_frontend_js.js** - Vanilla JavaScript frontend alternativa
- **dashboard_styles_css.css** - CSS styly pro dashboard
- **docker_compose.yml** - Docker orchestrace s monitoringem (Prometheus, Grafana, Redis)
- **realtime_dashboard_setup.md** - Podrobný setup guide

### Hlavní komponenty

1. **Frontend Dashboard** - Real-time UI s grafy a metrikami
2. **Backend API Service** - Azure API integrace, WebSocket server, caching
3. **Monitoring Stack** - Prometheus metriky, Grafana dashboardy, alerting
4. **Reverse Proxy** - Nginx load balancer a SSL termination

## Běžně používané příkazy

### Vývoj
```bash
npm install           # Instalace dependencies
npm run dev          # Development mode s nodemon
npm start            # Production mode
npm test             # Testování Azure autentifikace
```

### Nasazení Dockeru  
```bash
docker-compose build  # Sestavení kontejnerů
docker-compose up -d  # Spuštění všech služeb
docker-compose logs -f azure-ai-dashboard  # Sledování logů
make deploy          # Kompletní skript nasazení
```

### Monitoring
```bash
make status          # Status všech služeb
make logs           # Zobrazení logů
make backup         # Zálohování dat
```

## Klíčové proměnné prostředí

**Povinné klíče Azure:**
- `AZURE_SUBSCRIPTION_ID` - ID předplatného Azure
- `AZURE_TENANT_ID` - ID nájemce Azure  
- `AZURE_CLIENT_ID` - ID klienta služby Principal
- `AZURE_CLIENT_SECRET` - Tajný klíč služby Principal

**Konfigurace:**
- `AZURE_REGION` - Region Azure (výchozí: westeurope)
- `PORT` - Port serveru (výchozí: 3001)
- `AUTO_REFRESH_SECONDS` - Interval obnovování dashboardu
- `ENABLE_WEBSOCKET` - Aktualizace v reálném čase přes WebSocket

## Integrace Azure API

Backend používá tyto Azure API:
- **Azure Retail Prices API** – cenová data v reálném čase
- **Azure Cost Management API** – statistiky využití  
- **Azure Resource Manager API** – metadata zdrojů

Autentifikace probíhá pomocí Azure Service Principal s rolí „Cost Management Reader“.

## Docker služby

- **azure-ai-dashboard:3001** - Hlavní aplikace
- **grafana:3000** - Monitorovací dashboardy (admin/dashboard123)
- **prometheus:9090** - Metriky a alerting
- **redis:6379** - Cache layer
- **nginx:80/443** – reverzní proxy

## Testování

```bash
node test-auth.js    # Testování autentizace Azure
curl http://localhost:3001/api/health  # Kontrola stavu
curl http://localhost:3001/api/dashboard  # Data dashboardu
```

## Bezpečnostní poznámky

- Všechny klíče Azure musí být v souboru `.env` (NIKDY v git)
- Service Principal vyžaduje minimální oprávnění „Cost Management Reader“
- SSL certifikáty pro produkci jsou v `nginx/ssl/`
- Omezení rychlosti je nakonfigurováno v Nginx (10 req/s dashboard, 5 req/s API)