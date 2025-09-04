import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, DollarSign } from 'lucide-react';
import { ModelData, Currency } from '../types/dashboard';
import { formatPrice, formatCost, formatTokens, formatTrend, getStatusColor } from '../utils/formatters';

interface ModelCardProps {
  model: ModelData;
  currency: Currency;
  exchangeRate: number;
  onModelSelect?: (modelId: string) => void;
  showDetails?: boolean;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  currency,
  exchangeRate,
  onModelSelect,
  showDetails = false
}) => {
  const trendData = formatTrend(model.trend);
  const isClickable = !!onModelSelect;

  const handleClick = () => {
    if (onModelSelect) {
      onModelSelect(model.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{model.displayName}</h3>
            <p className="text-sm text-gray-600">{model.name}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div 
          className="px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
          style={{ 
            backgroundColor: getStatusColor(model.status) + '20',
            color: getStatusColor(model.status)
          }}
        >
          <Activity className="w-3 h-3" />
          <span className="capitalize">{model.status}</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Input</div>
          <div className="font-semibold text-gray-900">
            {formatPrice(model.inputPrice, currency, exchangeRate)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Output</div>
          <div className="font-semibold text-gray-900">
            {formatPrice(model.outputPrice, currency, exchangeRate)}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Celkové náklady</span>
          <span className="font-semibold text-gray-900">
            {formatCost(model.usage.totalCost, currency, exchangeRate)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Tokeny</span>
          <span className="font-medium text-gray-700">
            {formatTokens(model.usage.totalTokens)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Požadavky</span>
          <span className="font-medium text-gray-700">
            {model.usage.totalRequests.toLocaleString()}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Průměr/požadavek</span>
              <span className="font-medium text-gray-700">
                {formatCost(model.usage.avgCostPerRequest, currency, exchangeRate)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Chybovost</span>
              <span className={`font-medium ${
                model.usage.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'
              }`}>
                {(model.usage.errorRate * 100).toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Trend */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-sm text-gray-600">Trend</span>
        <div className={`flex items-center space-x-1 font-medium ${
          trendData.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trendData.isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{trendData.value}</span>
        </div>
      </div>

      {/* Availability Info (if showDetails) */}
      {showDetails && model.availability && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Dostupnost</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Quota použitá</span>
              <span className="font-medium">
                {model.availability.quotaUsed?.toLocaleString() || 'N/A'} / {model.availability.quotaLimit?.toLocaleString() || 'Unlimited'}
              </span>
            </div>
            {model.availability.quotaLimit && model.availability.quotaUsed && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ 
                    width: `${Math.min((model.availability.quotaUsed / model.availability.quotaLimit) * 100, 100)}%` 
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata (if showDetails) */}
      {showDetails && model.metadata && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Detaily modelu</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {model.metadata.version && (
              <div>
                <span className="text-gray-600">Verze:</span>
                <span className="ml-1 font-medium">{model.metadata.version}</span>
              </div>
            )}
            {model.metadata.maxTokens && (
              <div>
                <span className="text-gray-600">Max tokeny:</span>
                <span className="ml-1 font-medium">{model.metadata.maxTokens.toLocaleString()}</span>
              </div>
            )}
            {model.metadata.contextWindow && (
              <div className="col-span-2">
                <span className="text-gray-600">Context window:</span>
                <span className="ml-1 font-medium">{model.metadata.contextWindow.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};