// dashboard.js - Frontend JavaScript pro Azure AI Real-time Dashboard

class AzureAIDashboardClient {
  constructor() {
    this.ws = null;
    this.data = null;
    this.showCZK = localStorage.getItem('showCZK') === 'true';
    this.exchangeRate = 24.5;
    this.charts = {};
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.connectWebSocket();
    this.fetchInitialData();
  }

  // 1. WEBSOCKET CONNECTION
  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('📡 WebSocket connected');
        this.updateConnectionStatus('connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.updateConnectionStatus('error');
      };
      
      this.ws.onclose = () => {
        console.log('📡 WebSocket disconnected');
        this.updateConnectionStatus('disconnected');
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.connectWebSocket();
        }, 5000);
      };
      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.updateConnectionStatus('error');
    }
  }

  // 2. INITIAL DATA FETCH
  async fetchInitialData() {
    try {
      this.updateLoadingStatus('Načítání dashboard dat...');
      
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        this.handleDataUpdate(result);
        this.hideLoading();
      } else {
        throw new Error(result.error || 'Unknown API error');
      }
      
    } catch (error) {
      console.error('❌ Initial data fetch error:', error);
      this.showError(`Chyba při načítání dat: ${error.message}`);
      this.hideLoading();
    }
  }

  // 3. DATA UPDATE HANDLERS
  handleRealtimeUpdate(data) {
    console.log('📊 Received real-time update');
    this.handleDataUpdate(data);
  }

  handleDataUpdate(data) {
    this.data = data;
    
    if (data.exchangeRates) {
      this.exchangeRate = data.exchangeRates.USD_CZK || 24.5;
    }
    
    this.updateSummaryCards();
    this.updateModelsGrid();
    this.updateCharts();
    this.updateLastUpdateTime();
  }

  // 4. UI UPDATE METHODS
  updateSummaryCards() {
    if (!this.data?.summary) return;
    
    const summary = this.data.summary;
    
    document.getElementById('total-cost').textContent = 
      this.formatCost(summary.totalCost);
    
    document.getElementById('total-tokens').textContent = 
      this.formatNumber(summary.totalTokens);
    
    document.getElementById('total-requests').textContent = 
      this.formatNumber(summary.totalRequests);
    
    document.getElementById('top-model').textContent = 
      summary.topModel || '-';
  }

  updateModelsGrid() {
    if (!this.data?.models) return;
    
    const container = document.getElementById('models-container');
    container.innerHTML = '';
    
    this.data.models.forEach(model => {
      const modelCard = this.createModelCard(model);
      container.appendChild(modelCard);
    });
  }

  createModelCard(model) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow p-6';
    
    const trendColor = model.trend?.startsWith('+') ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
    
    card.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">${model.name}</h3>
        <span class="px-2 py-1 rounded text-xs font-medium ${trendColor}">
          ${model.trend || '+0%'}
        </span>
      </div>
      
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Input:</span>
          <span class="text-sm font-medium">${this.formatPrice(model.inputPrice)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Output:</span>
          <span class="text-sm font-medium">${this.formatPrice(model.outputPrice)}</span>
        </div>
        <div class="border-t pt-3">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Náklady dnes:</span>
            <span class="text-sm font-bold text-green-600">${this.formatCost(model.usage?.totalCost || 0)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Tokeny:</span>
            <span class="text-sm font-medium">${this.formatNumber((model.usage?.inputTokens || 0) + (model.usage?.outputTokens || 0))}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600">Požadavků:</span>
            <span class="text-sm font-medium">${this.formatNumber(model.usage?.requests || 0)}</span>
          </div>
        </div>
      </div>
      
      <div class="mt-4">
        <canvas id="mini-chart-${model.name}" width="300" height="80"></canvas>
      </div>
    `;
    
    // Create mini chart for this model
    setTimeout(() => {
      this.createMiniChart(model);
    }, 100);
    
    return card;
  }

  updateCharts() {
    if (!this.data?.models?.length) return;
    
    this.updateHourlyChart();
    this.updateDistributionChart();
  }

  updateHourlyChart() {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;
    
    // Use data from the first model for hourly trend
    const model = this.data.models[0];
    if (!model?.lastHour) return;
    
    if (this.charts.hourly) {
      this.charts.hourly.destroy();
    }
    
    this.charts.hourly = new Chart(ctx, {
      type: 'line',
      data: {
        labels: model.lastHour.map(item => item.time),
        datasets: [{
          label: 'Náklady',
          data: model.lastHour.map(item => this.showCZK ? item.cost * this.exchangeRate : item.cost),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCost(value)
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `Náklady: ${this.formatCost(context.parsed.y)}`
            }
          }
        }
      }
    });
  }

  updateDistributionChart() {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;
    
    if (this.charts.distribution) {
      this.charts.distribution.destroy();
    }
    
    const data = this.data.models.map(model => ({
      label: model.name,
      value: model.usage?.totalCost || 0
    }));
    
    this.charts.distribution = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(item => item.label),
        datasets: [{
          data: data.map(item => this.showCZK ? item.value * this.exchangeRate : item.value),
          backgroundColor: [
            '#3b82f6',
            '#10b981', 
            '#f59e0b',
            '#8b5cf6',
            '#ef4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label;
                const value = context.parsed;
                const percentage = ((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                return `${label}: ${this.formatCost(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  createMiniChart(model) {
    const canvasId = `mini-chart-${model.name}`;
    const ctx = document.getElementById(canvasId);
    if (!ctx || !model.lastHour) return;
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: model.lastHour.map(item => item.time),
        datasets: [{
          data: model.lastHour.map(item => this.showCZK ? item.cost * this.exchangeRate : item.cost),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: true,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { display: false },
          y: { display: false }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  // 5. UI UTILITY METHODS
  formatCost(cost) {
    if (!cost) return this.showCZK ? '0 CZK' : '$0.00';
    
    const value = this.showCZK ? cost * this.exchangeRate : cost;
    const currency = this.showCZK ? 'CZK' : 'USD';
    const symbol = this.showCZK ? '' : '$';
    
    return `${symbol}${value.toFixed(2)} ${this.showCZK ? currency : ''}`.trim();
  }

  formatPrice(price) {
    if (!price) return this.showCZK ? '0 CZK/1M' : '$0.00/1M';
    
    const value = this.showCZK ? price * this.exchangeRate : price;
    const currency = this.showCZK ? 'CZK' : 'USD';
    
    if (value < 0.01) {
      return `${(value * 1000000).toFixed(2)} ${currency}/1M tokens`;
    }
    return `${value.toFixed(4)} ${currency}/1k tokens`;
  }

  formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('cs-CZ');
  }

  updateConnectionStatus(status) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;
    
    const statusConfig = {
      connected: { text: 'Online', class: 'bg-green-100 text-green-700' },
      connecting: { text: 'Připojování...', class: 'bg-yellow-100 text-yellow-700' },
      disconnected: { text: 'Offline', class: 'bg-red-100 text-red-700' },
      error: { text: 'Chyba', class: 'bg-red-100 text-red-700' }
    };
    
    const config = statusConfig[status] || statusConfig.error;
    statusEl.textContent = config.text;
    statusEl.className = `px-3 py-1 rounded-full text-sm font-medium ${config.class}`;
  }

  updateLastUpdateTime() {
    const timeEl = document.getElementById('last-update');
    if (timeEl && this.data?.lastUpdate) {
      const date = new Date(this.data.lastUpdate);
      timeEl.textContent = `Poslední aktualizace: ${date.toLocaleString('cs-CZ')}`;
    }
  }

  updateLoadingStatus(message) {
    const statusEl = document.getElementById('loading-status');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  hideLoading() {
    document.getElementById('loading')?.classList.add('hidden');
    document.getElementById('dashboard')?.classList.remove('hidden');
  }

  showError(message) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Chyba připojení</h3>
            <p class="text-gray-600 mb-4">${message}</p>
            <button onclick="location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Zkusit znovu
            </button>
          </div>
        </div>
      `;
    }
  }

  // 6. EVENT LISTENERS
  setupEventListeners() {
    // Currency toggle
    const currencyToggle = document.getElementById('currency-toggle');
    if (currencyToggle) {
      currencyToggle.addEventListener('click', () => {
        this.toggleCurrency();
      });
    }

    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    // Update currency toggle text
    this.updateCurrencyToggle();
  }

  toggleCurrency() {
    this.showCZK = !this.showCZK;
    localStorage.setItem('showCZK', this.showCZK.toString());
    
    this.updateCurrencyToggle();
    
    if (this.data) {
      this.updateSummaryCards();
      this.updateModelsGrid();
      this.updateCharts();
    }
  }

  updateCurrencyToggle() {
    const toggle = document.getElementById('currency-toggle');
    if (toggle) {
      toggle.textContent = this.showCZK ? 'CZK' : 'USD';
      toggle.className = this.showCZK 
        ? 'px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors'
        : 'px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors';
    }
  }

  openSettings() {
    // Simple settings modal - můžete rozšířit
    const settings = prompt('Nastavení\n\nZadejte refresh interval v sekundách:', '30');
    if (settings && !isNaN(settings)) {
      console.log(`Refresh interval nastaven na ${settings} sekund`);
      // Zde byste mohli poslat nastavení na server
    }
  }

  // 7. PERIODIC REFRESH (fallback když WebSocket nefunguje)
  startPeriodicRefresh(intervalSeconds = 60) {
    setInterval(async () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.log('🔄 Periodic refresh (WebSocket not available)');
        await this.fetchInitialData();
      }
    }, intervalSeconds * 1000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Azure AI Dashboard...');
  
  const dashboard = new AzureAIDashboardClient();
  
  // Start periodic refresh as fallback
  dashboard.startPeriodicRefresh(60);
  
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('💥 Global error:', event.error);
  });
  
  // Handle visibility change (pause when tab not visible)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ Tab became visible, refreshing data...');
      dashboard.fetchInitialData();
    }
  });
});