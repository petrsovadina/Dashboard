import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Settings, Eye, EyeOff, RefreshCw, DollarSign, Activity, TrendingUp, Zap, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import {
  AzureConfig,
  DashboardData,
  ConnectionStatus,
  Currency,
  ModelData,
  HourlyDataPoint
} from './src/types/dashboard';

const AzureAIRealtimeDashboard: React.FC = () => {
  // State pro autentifikaci a konfiguraci
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showSecrets, setShowSecrets] = useState<boolean>(false);
  const [config, setConfig] = useState<AzureConfig>({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    resourceGroup: '',
    region: 'westeurope'
  });

  // State pro dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  // State pro CZK konverzi
  const [exchangeRate, setExchangeRate] = useState<number>(24.5); // USD to CZK
  const [showCZK, setShowCZK] = useState<boolean>(true);

  // Auto-refresh interval
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds

  // Mock data pro demonstraci (real implementace by používala Azure APIs)
  const mockRealTimeData: DashboardData = {
    models: [
      {
        name: 'gpt-4o',
        inputPrice: 0.0000025,
        outputPrice: 0.00001,
        usage: {
          inputTokens: 2450000,
          outputTokens: 980000,
          totalCost: 15.85,
          requests: 3420
        },
        trend: '+12%',
        status: 'active',
        lastHour: [
          { time: '14:00', cost: 2.1, tokens: 45000 },
          { time: '14:15', cost: 2.8, tokens: 52000 },
          { time: '14:30', cost: 3.2, tokens: 48000 },
          { time: '14:45', cost: 2.9, tokens: 51000 },
          { time: '15:00', cost: 3.5, tokens: 55000 }
        ]
      },
      {
        name: 'gpt-4o-mini',
        inputPrice: 0.000000150,
        outputPrice: 0.000000600,
        usage: {
          inputTokens: 8950000,
          outputTokens: 3200000,
          totalCost: 3.26,
          requests: 15680
        },
        trend: '+8%',
        status: 'active',
        lastHour: [
          { time: '14:00', cost: 0.6, tokens: 180000 },
          { time: '14:15', cost: 0.8, tokens: 195000 },
          { time: '14:30', cost: 0.7, tokens: 175000 },
          { time: '14:45', cost: 0.9, tokens: 205000 },
          { time: '15:00', cost: 0.8, tokens: 190000 }
        ]
      },
      {
        name: 'gpt-3.5-turbo',
        inputPrice: 0.0000005,
        outputPrice: 0.0000015,
        usage: {
          inputTokens: 15600000,
          outputTokens: 5200000,
          totalCost: 15.60,
          requests: 28450
        },
        trend: '-3%',
        status: 'active',
        lastHour: [
          { time: '14:00', cost: 2.8, tokens: 320000 },
          { time: '14:15', cost: 3.1, tokens: 340000 },
          { time: '14:30', cost: 2.9, tokens: 315000 },
          { time: '14:45', cost: 3.3, tokens: 350000 },
          { time: '15:00', cost: 3.0, tokens: 325000 }
        ]
      }
    ],
    summary: {
      totalCost: 34.71,
      totalTokens: 34620000,
      totalRequests: 47550,
      avgCostPerRequest: 0.73,
      topModel: 'gpt-4o',
      peakHour: '14:45'
    },
    region: 'West Europe',
    currency: 'USD'
  };

  // Simulace získání exchange rate
  const fetchExchangeRate = useCallback(async () => {
    try {
      // V reálné aplikaci by to byl externí API
      const mockRate = 24.5 + (Math.random() - 0.5) * 0.5;
      setExchangeRate(mockRate);
    } catch (err) {
      console.error('Exchange rate fetch error:', err);
    }
  }, []);

  // Simulace získání real-time dat z Azure
  const fetchDashboardData = useCallback(async () => {
    if (!isConfigured) return;

    setLoading(true);
    setError(null);

    try {
      setConnectionStatus('connecting');
      
      // Simulace API volání - v reálné implementaci by používalo Azure APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulace real-time změn
      const updatedData = {
        ...mockRealTimeData,
        models: mockRealTimeData.models.map(model => ({
          ...model,
          usage: {
            ...model.usage,
            totalCost: model.usage.totalCost * (0.95 + Math.random() * 0.1),
            inputTokens: Math.floor(model.usage.inputTokens * (0.98 + Math.random() * 0.04)),
            outputTokens: Math.floor(model.usage.outputTokens * (0.98 + Math.random() * 0.04)),
            requests: Math.floor(model.usage.requests * (0.98 + Math.random() * 0.04))
          }
        }))
      };

      setDashboardData(updatedData);
      setLastUpdate(new Date());
      setConnectionStatus('connected');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba při načítání dat';
      setError(errorMessage);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }, [isConfigured]);

  // Auto-refresh mechanismus
  useEffect(() => {
    if (autoRefresh && isConfigured && refreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isConfigured, refreshInterval, fetchDashboardData]);

  // Exchange rate refresh
  useEffect(() => {
    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000); // každých 5 minut
    return () => clearInterval(interval);
  }, [fetchExchangeRate]);

  // Initial data fetch
  useEffect(() => {
    if (isConfigured) {
      fetchDashboardData();
    }
  }, [isConfigured, fetchDashboardData]);

  // Konfigurace dashboard
  const handleConfigSave = (): void => {
    const requiredFields = ['subscriptionId', 'tenantId', 'clientId', 'clientSecret'] as const;
    const hasAllRequired = requiredFields.every(field => config[field].trim());

    if (!hasAllRequired) {
      setError('Všechna povinná pole musí být vyplněna');
      return;
    }

    setIsConfigured(true);
    setShowConfig(false);
    setError(null);
  };

  // Utility funkce
  const formatPrice = (price: number, toCZK: boolean = false): string => {
    const value = toCZK ? price * exchangeRate : price;
    const currency = toCZK ? 'CZK' : 'USD';
    
    if (value < 0.01) {
      return `${(value * 1000000).toFixed(2)} ${currency}/1M tokens`;
    }
    return `${value.toFixed(4)} ${currency}`;
  };

  const formatCost = (cost: number, toCZK: boolean = false): string => {
    const value = toCZK ? cost * exchangeRate : cost;
    const currency = toCZK ? 'CZK' : 'USD';
    return `${value.toFixed(2)} ${currency}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Konfigurace modal
  if (showConfig || !isConfigured) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
          <div className="flex items-center mb-6">
            <Settings className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Azure AI Dashboard - Konfigurace
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure Subscription ID *
              </label>
              <input
                type="text"
                placeholder="12345678-1234-1234-1234-123456789012"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.subscriptionId}
                onChange={(e) => setConfig({...config, subscriptionId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure Tenant ID *
              </label>
              <input
                type="text"
                placeholder="87654321-4321-4321-4321-210987654321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.tenantId}
                onChange={(e) => setConfig({...config, tenantId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure Client ID *
              </label>
              <input
                type="text"
                placeholder="11223344-5566-7788-9900-112233445566"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={config.clientId}
                onChange={(e) => setConfig({...config, clientId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure Client Secret *
              </label>
              <div className="relative">
                <input
                  type={showSecrets ? "text" : "password"}
                  placeholder="super-secret-password"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resource Group
                </label>
                <input
                  type="text"
                  placeholder="my-ai-foundry-rg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.resourceGroup}
                  onChange={(e) => setConfig({...config, resourceGroup: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={config.region}
                  onChange={(e) => setConfig({...config, region: e.target.value})}
                >
                  <option value="westeurope">West Europe</option>
                  <option value="northeurope">North Europe</option>
                  <option value="eastus">East US</option>
                  <option value="westus">West US</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <p className="text-sm text-gray-600">
              * Povinná pole
            </p>
            <button
              onClick={handleConfigSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Uložit konfiguraci
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hlavní dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Azure AI Real-time Dashboard
                </h1>
                <p className="text-gray-600">
                  {dashboardData?.region} • {lastUpdate?.toLocaleString('cs-CZ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                {connectionStatus === 'connected' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                {connectionStatus === 'connecting' && <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" />}
                {connectionStatus === 'error' && <AlertCircle className="w-4 h-4 inline mr-1" />}
                {connectionStatus === 'connected' ? 'Online' : 
                 connectionStatus === 'connecting' ? 'Připojování...' : 'Chyba'}
              </div>

              {/* Currency Toggle */}
              <button
                onClick={() => setShowCZK(!showCZK)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  showCZK ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                {showCZK ? 'CZK' : 'USD'}
              </button>

              {/* Auto-refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>

              {/* Manual Refresh */}
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Aktualizovat
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowConfig(true)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {showCZK && (
            <div className="mt-2 text-sm text-gray-600">
              Kurz: 1 USD = {exchangeRate.toFixed(2)} CZK
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {!dashboardData ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Načítání dat...</span>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Celkové náklady</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCost(dashboardData.summary.totalCost, showCZK)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Celkem tokenů</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(dashboardData.summary.totalTokens)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Požadavků</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(dashboardData.summary.totalRequests)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Zap className="w-8 h-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Průměr/požadavek</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCost(dashboardData.summary.avgCostPerRequest, showCZK)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Models Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {dashboardData.models.map((model: ModelData) => (
                <div key={model.name} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      model.trend.startsWith('+') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {model.trend}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Input:</span>
                      <span className="text-sm font-medium">
                        {formatPrice(model.inputPrice, showCZK)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Output:</span>
                      <span className="text-sm font-medium">
                        {formatPrice(model.outputPrice, showCZK)}
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Náklady dnes:</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCost(model.usage.totalCost, showCZK)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tokeny:</span>
                        <span className="text-sm font-medium">
                          {formatNumber(model.usage.inputTokens + model.usage.outputTokens)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Požadavků:</span>
                        <span className="text-sm font-medium">
                          {formatNumber(model.usage.requests)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini trend chart */}
                  <div className="mt-4 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={model.lastHour}>
                        <Area
                          type="monotone"
                          dataKey="cost"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.1}
                        />
                        <Tooltip
                          formatter={(value) => [formatCost(value, showCZK), 'Náklady']}
                          labelFormatter={(label) => `Čas: ${label}`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Hourly Usage Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Hodinové náklady - GPT-4o
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.models[0].lastHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'cost' ? formatCost(value, showCZK) : formatNumber(value),
                        name === 'cost' ? 'Náklady' : 'Tokeny'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Model Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuce nákladů dle modelů
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dashboardData.models.map(model => ({
                        name: model.name,
                        value: model.usage.totalCost,
                        percentage: ((model.usage.totalCost / dashboardData.summary.totalCost) * 100).toFixed(1)
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.models.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCost(value, showCZK)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AzureAIRealtimeDashboard;