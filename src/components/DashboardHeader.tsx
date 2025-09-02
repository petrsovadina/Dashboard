import React from 'react';
import { RefreshCw, Settings, Globe, Activity } from 'lucide-react';
import { DashboardData, ConnectionStatus, Currency } from '../types/dashboard';
import { formatDateTime, formatRelativeTime, formatCost } from '../utils/formatters';

interface DashboardHeaderProps {
  dashboardData: DashboardData | null;
  lastUpdate: Date | null;
  connectionStatus: ConnectionStatus;
  showCZK: boolean;
  setShowCZK: (show: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (refresh: boolean) => void;
  onRefresh: () => void;
  onShowConfig: () => void;
  loading: boolean;
  exchangeRate: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dashboardData,
  lastUpdate,
  connectionStatus,
  showCZK,
  setShowCZK,
  autoRefresh,
  setAutoRefresh,
  onRefresh,
  onShowConfig,
  loading,
  exchangeRate
}) => {
  const getConnectionStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'reconnecting': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConnectionStatusText = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected': return 'Připojeno';
      case 'connecting': return 'Připojování...';
      case 'reconnecting': return 'Obnovuje se připojení...';
      case 'error': return 'Chyba připojení';
      case 'disconnected': return 'Odpojeno';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Title and Status */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Azure AI Dashboard
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time monitoring nákladů AI modelů
            </p>
          </div>

          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor(connectionStatus)}`}>
            <Activity className="w-3 h-3" />
            <span>{getConnectionStatusText(connectionStatus)}</span>
          </div>
        </div>

        {/* Summary Stats */}
        {dashboardData && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {formatCost(dashboardData.summary.totalCost, showCZK ? 'CZK' : 'USD', exchangeRate)}
              </div>
              <div className="text-gray-600">Celkové náklady</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {dashboardData.summary.totalRequests.toLocaleString()}
              </div>
              <div className="text-gray-600">Požadavky</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {(dashboardData.summary.totalTokens / 1000000).toFixed(1)}M
              </div>
              <div className="text-gray-600">Tokeny</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center space-x-3">
          {/* Currency Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowCZK(false)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                !showCZK 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD
            </button>
            <button
              onClick={() => setShowCZK(true)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                showCZK 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              CZK
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Auto-refresh</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs font-medium">Obnovit</span>
          </button>

          {/* Settings */}
          <button
            onClick={onShowConfig}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Nastavení</span>
          </button>
        </div>
      </div>

      {/* Last Update Info */}
      {lastUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-600">
            <div>
              <span>Poslední aktualizace: </span>
              <span className="font-medium">{formatDateTime(lastUpdate)}</span>
              <span className="ml-2">({formatRelativeTime(lastUpdate)})</span>
            </div>
            {dashboardData && (
              <div className="flex items-center space-x-4">
                <span>Region: {dashboardData.region}</span>
                {showCZK && (
                  <span>Kurz: {exchangeRate.toFixed(2)} CZK/USD</span>
                )}
                <span>Obnovování: {autoRefresh ? 'zapnuto' : 'vypnuto'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};