// Constants for Azure AI Dashboard

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  DASHBOARD: '/api/dashboard',
  MODELS: '/api/models',
  USAGE: '/api/usage',
  CONFIG: '/api/config',
  TEST_AUTH: '/api/test-auth',
} as const;

// Azure API URLs
export const AZURE_API = {
  RETAIL_PRICES: 'https://prices.azure.com/api/retail/prices',
  COST_MANAGEMENT: 'https://management.azure.com',
  RESOURCE_MANAGER: 'https://management.azure.com',
  LOGIN: 'https://login.microsoftonline.com',
} as const;

// Default configuration values
export const DEFAULT_CONFIG = {
  PORT: 3001,
  REGION: 'westeurope',
  AUTO_REFRESH_SECONDS: 30,
  CACHE_DURATION_MINUTES: 5,
  LOG_LEVEL: 'info',
  ENABLE_WEBSOCKET: true,
  ENABLE_METRICS: true,
} as const;

// Azure regions with display names
export const AZURE_REGIONS = [
  { value: 'westeurope', label: 'West Europe', location: 'Netherlands' },
  { value: 'northeurope', label: 'North Europe', location: 'Ireland' },
  { value: 'eastus', label: 'East US', location: 'Virginia' },
  { value: 'westus', label: 'West US', location: 'California' },
  { value: 'eastus2', label: 'East US 2', location: 'Virginia' },
  { value: 'westus2', label: 'West US 2', location: 'Washington' },
  { value: 'centralus', label: 'Central US', location: 'Iowa' },
  { value: 'southcentralus', label: 'South Central US', location: 'Texas' },
  { value: 'westcentralus', label: 'West Central US', location: 'Wyoming' },
  { value: 'northcentralus', label: 'North Central US', location: 'Illinois' },
  { value: 'canadacentral', label: 'Canada Central', location: 'Toronto' },
  { value: 'canadaeast', label: 'Canada East', location: 'Quebec City' },
  { value: 'brazilsouth', label: 'Brazil South', location: 'Sao Paulo' },
  { value: 'southafricanorth', label: 'South Africa North', location: 'Johannesburg' },
  { value: 'eastasia', label: 'East Asia', location: 'Hong Kong' },
  { value: 'southeastasia', label: 'Southeast Asia', location: 'Singapore' },
  { value: 'japaneast', label: 'Japan East', location: 'Tokyo' },
  { value: 'japanwest', label: 'Japan West', location: 'Osaka' },
  { value: 'australiaeast', label: 'Australia East', location: 'Sydney' },
  { value: 'australiasoutheast', label: 'Australia Southeast', location: 'Melbourne' },
  { value: 'centralindia', label: 'Central India', location: 'Pune' },
  { value: 'southindia', label: 'South India', location: 'Chennai' },
  { value: 'westindia', label: 'West India', location: 'Mumbai' },
  { value: 'koreacentral', label: 'Korea Central', location: 'Seoul' },
  { value: 'koreasouth', label: 'Korea South', location: 'Busan' },
] as const;

// Currency options
export const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'CZK', label: 'Czech Koruna (Kč)', symbol: 'Kč' },
] as const;

// Chart color palette
export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#84CC16', // Lime
] as const;

// Status colors
export const STATUS_COLORS = {
  active: '#10B981',    // Green
  inactive: '#6B7280',  // Gray
  error: '#EF4444',     // Red
  warning: '#F59E0B',   // Amber
  success: '#10B981',   // Green
  pending: '#3B82F6',   // Blue
  deprecated: '#F97316', // Orange
  preview: '#8B5CF6',   // Violet
} as const;

// OpenAI model pricing (fallback data)
export const OPENAI_MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4 Omni',
    inputPrice: 0.000005,   // $5 per 1M tokens
    outputPrice: 0.000015,  // $15 per 1M tokens
    contextWindow: 128000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4 Omni Mini',
    inputPrice: 0.00000015, // $0.15 per 1M tokens
    outputPrice: 0.0000006, // $0.6 per 1M tokens
    contextWindow: 128000,
  },
  {
    id: 'gpt-35-turbo',
    name: 'GPT-3.5 Turbo',
    inputPrice: 0.0000005,  // $0.5 per 1M tokens
    outputPrice: 0.0000015, // $1.5 per 1M tokens
    contextWindow: 16384,
  },
  {
    id: 'text-embedding-ada-002',
    name: 'Text Embedding Ada 002',
    inputPrice: 0.0000001,  // $0.1 per 1M tokens
    outputPrice: 0,
    contextWindow: 8192,
  },
] as const;

// Refresh intervals (in seconds)
export const REFRESH_INTERVALS = [
  { value: 10, label: '10 sekund' },
  { value: 30, label: '30 sekund' },
  { value: 60, label: '1 minuta' },
  { value: 300, label: '5 minut' },
  { value: 600, label: '10 minut' },
] as const;

// Cache durations (in minutes)
export const CACHE_DURATIONS = [
  { value: 1, label: '1 minuta' },
  { value: 5, label: '5 minut' },
  { value: 10, label: '10 minut' },
  { value: 30, label: '30 minut' },
  { value: 60, label: '1 hodina' },
] as const;

// Log levels
export const LOG_LEVELS = [
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
] as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  UPDATE: 'update',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AZURE_CONFIG: 'azure_ai_dashboard_config',
  THEME: 'azure_ai_dashboard_theme',
  LANGUAGE: 'azure_ai_dashboard_language',
  CURRENCY: 'azure_ai_dashboard_currency',
  REFRESH_INTERVAL: 'azure_ai_dashboard_refresh_interval',
  LAST_UPDATE: 'azure_ai_dashboard_last_update',
} as const;

// Error codes
export const ERROR_CODES = {
  AZURE_AUTH_FAILED: 'AZURE_AUTH_FAILED',
  AZURE_API_ERROR: 'AZURE_API_ERROR',
  INVALID_CONFIG: 'INVALID_CONFIG',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Time constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// File size limits
export const FILE_SIZE_LIMITS = {
  AVATAR: 5 * 1024 * 1024,      // 5MB
  DOCUMENT: 50 * 1024 * 1024,   // 50MB
  BACKUP: 500 * 1024 * 1024,    // 500MB
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/,
  API_KEY: /^[a-zA-Z0-9_-]{32,255}$/,
  RESOURCE_GROUP: /^[a-zA-Z0-9._()-]+$/,
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  RESPONSE_TIME_WARNING: 1000,    // 1 second
  RESPONSE_TIME_CRITICAL: 5000,   // 5 seconds
  ERROR_RATE_WARNING: 0.05,       // 5%
  ERROR_RATE_CRITICAL: 0.1,       // 10%
  MEMORY_WARNING: 0.8,            // 80%
  MEMORY_CRITICAL: 0.9,           // 90%
  CPU_WARNING: 0.7,               // 70%
  CPU_CRITICAL: 0.9,              // 90%
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_DARK_MODE: true,
  ENABLE_EXPORT: true,
  ENABLE_ALERTS: true,
  ENABLE_ADVANCED_METRICS: true,
  ENABLE_MULTI_CURRENCY: true,
  ENABLE_CUSTOM_DASHBOARDS: false,
  ENABLE_USER_MANAGEMENT: false,
  ENABLE_API_WEBHOOKS: false,
} as const;