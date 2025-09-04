// Azure AI Dashboard Type Definitions

export type AzureRegion = 
  | 'westeurope' 
  | 'northeurope' 
  | 'eastus' 
  | 'westus' 
  | 'eastus2' 
  | 'westus2' 
  | 'centralus'
  | 'southcentralus';

export type ConnectionStatus = 
  | 'connected' 
  | 'connecting' 
  | 'disconnected' 
  | 'error'
  | 'reconnecting';

export type Currency = 'USD' | 'CZK';

export type ModelStatus = 'active' | 'inactive' | 'deprecated' | 'preview';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Azure Configuration Interface
export interface AzureConfig {
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  resourceGroup: string;
  region: AzureRegion;
}

// Application Configuration Interface
export interface AppConfig extends AzureConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: LogLevel;
  apiKey?: string;
  corsOrigins: string[];
  enableWebSocket: boolean;
  autoRefreshSeconds: number;
  cacheDurationMinutes: number;
  redisUrl?: string;
}

// Time-series data point
export interface HourlyDataPoint {
  time: string;
  cost: number;
  tokens: number;
  requests: number;
  errors: number;
}

// Model usage statistics
export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  avgCostPerRequest: number;
  avgTokensPerRequest: number;
  errorRate: number;
}

// Individual AI model data
export interface ModelData {
  id: string;
  name: string;
  displayName: string;
  inputPrice: number;
  outputPrice: number;
  usage: ModelUsage;
  trend: string; // e.g., "+12%", "-5%"
  status: ModelStatus;
  lastHour: HourlyDataPoint[];
  availability: {
    region: AzureRegion;
    quotaLimit?: number;
    quotaUsed?: number;
  };
  metadata: {
    version?: string;
    description?: string;
    maxTokens?: number;
    contextWindow?: number;
  };
}

// Dashboard summary statistics
export interface DashboardSummary {
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  avgCostPerRequest: number;
  topModel: string;
  peakHour: string;
  errorRate: number;
  costTrend: string;
  tokenTrend: string;
  requestTrend: string;
}

// Complete dashboard data
export interface DashboardData {
  models: ModelData[];
  summary: DashboardSummary;
  region: AzureRegion;
  currency: Currency;
  exchangeRate: number;
  lastUpdated: string;
  updateFrequency: number;
  healthStatus: {
    api: boolean;
    cache: boolean;
    websocket: boolean;
  };
}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'update' | 'error' | 'ping' | 'pong' | 'connect' | 'disconnect';
  payload?: any;
  timestamp: string;
}

// Cache entry interface
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database?: 'healthy' | 'unhealthy';
    redis?: 'healthy' | 'unhealthy';
    azure_api?: 'healthy' | 'unhealthy';
    websocket?: 'healthy' | 'unhealthy';
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    totalRequests: number;
    errorRate: number;
  };
}

// Chart data interfaces for visualization
export interface ChartDataPoint {
  name: string;
  value: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface PieChartData extends ChartDataPoint {
  percentage: number;
  color?: string;
}

export interface LineChartData {
  name: string;
  data: Array<{
    x: string | number;
    y: number;
  }>;
  color?: string;
}

// Component prop interfaces
export interface DashboardProps {
  config: AzureConfig;
  onConfigChange: (config: AzureConfig) => void;
  theme?: 'light' | 'dark';
}

export interface ModelCardProps {
  model: ModelData;
  currency: Currency;
  exchangeRate: number;
  onModelSelect?: (modelId: string) => void;
}

export interface ChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  title?: string;
  showLegend?: boolean;
}

// Form validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'checkbox';
  required: boolean;
  validation?: (value: any) => string | null;
  options?: Array<{ value: string; label: string }>;
}

// Export all types for easy import
export type {
  // Re-export commonly used types
  AzureConfig as Config,
  DashboardData as Dashboard,
  ModelData as Model,
  ApiResponse as Response,
};