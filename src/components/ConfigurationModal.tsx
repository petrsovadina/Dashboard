import React, { useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { AzureConfig, ValidationResult } from '../types/dashboard';
import { validateAzureConfig, sanitizeInput } from '../utils/validation';
import { AZURE_REGIONS } from '../utils/constants';

interface ConfigurationModalProps {
  config: AzureConfig;
  setConfig: (config: AzureConfig) => void;
  onSave: () => void;
  onClose: () => void;
  error: string | null;
  isVisible: boolean;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  config,
  setConfig,
  onSave,
  onClose,
  error,
  isVisible
}) => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleConfigChange = (field: keyof AzureConfig, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setConfig({
      ...config,
      [field]: sanitizedValue
    });

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    const validation: ValidationResult = validateAzureConfig(config);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});
    onSave();
  };

  const isFormValid = () => {
    const validation = validateAzureConfig(config);
    return validation.isValid && Object.keys(validationErrors).length === 0;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Azure Konfigurace</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Subscription ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subscription ID *
            </label>
            <input
              type="text"
              value={config.subscriptionId}
              onChange={(e) => handleConfigChange('subscriptionId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.subscriptionId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="12345678-1234-1234-1234-123456789012"
            />
            {validationErrors.subscriptionId && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.subscriptionId}</p>
            )}
          </div>

          {/* Tenant ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant ID *
            </label>
            <input
              type="text"
              value={config.tenantId}
              onChange={(e) => handleConfigChange('tenantId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.tenantId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="87654321-4321-4321-4321-210987654321"
            />
            {validationErrors.tenantId && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.tenantId}</p>
            )}
          </div>

          {/* Client ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID *
            </label>
            <input
              type="text"
              value={config.clientId}
              onChange={(e) => handleConfigChange('clientId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.clientId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="11223344-5566-7788-9900-112233445566"
            />
            {validationErrors.clientId && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.clientId}</p>
            )}
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret *
            </label>
            <div className="relative">
              <input
                type={showSecrets ? 'text' : 'password'}
                value={config.clientSecret}
                onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.clientSecret ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your-super-secret-password"
              />
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.clientSecret && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.clientSecret}</p>
            )}
          </div>

          {/* Resource Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Group *
            </label>
            <input
              type="text"
              value={config.resourceGroup}
              onChange={(e) => handleConfigChange('resourceGroup', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.resourceGroup ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="my-ai-foundry-rg"
            />
            {validationErrors.resourceGroup && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.resourceGroup}</p>
            )}
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Region *
            </label>
            <select
              value={config.region}
              onChange={(e) => handleConfigChange('region', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.region ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {AZURE_REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label} ({region.location})
                </option>
              ))}
            </select>
            {validationErrors.region && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.region}</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid()}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isFormValid()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Uložit konfiguraci
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};