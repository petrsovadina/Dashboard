// Main type exports for the Azure AI Dashboard

// Dashboard-specific types
export * from './dashboard';

// Additional utility types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: any;
}

// Environment configuration type
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  
  // Azure
  AZURE_SUBSCRIPTION_ID: string;
  AZURE_TENANT_ID: string;
  AZURE_CLIENT_ID: string;
  AZURE_CLIENT_SECRET: string;
  AZURE_RESOURCE_GROUP_NAME: string;
  AZURE_REGION: string;
  
  // Optional
  API_SECRET_KEY?: string;
  REDIS_PASSWORD?: string;
  CORS_ORIGINS?: string;
  DATABASE_URL?: string;
}