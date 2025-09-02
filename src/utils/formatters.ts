// Utility functions for formatting data in Azure AI Dashboard

import { Currency } from '../types/dashboard';

/**
 * Format price with proper currency and scaling
 */
export const formatPrice = (
  price: number, 
  currency: Currency = 'USD', 
  exchangeRate: number = 1
): string => {
  const value = currency === 'CZK' ? price * exchangeRate : price;
  const currencySymbol = currency === 'CZK' ? 'Kč' : '$';
  
  // For very small values, show per million tokens
  if (value < 0.01 && value > 0) {
    const perMillionTokens = value * 1_000_000;
    return `${perMillionTokens.toFixed(2)} ${currencySymbol}/1M tokens`;
  }
  
  // For normal values
  if (value < 1) {
    return `${value.toFixed(4)} ${currencySymbol}`;
  }
  
  return `${value.toFixed(2)} ${currencySymbol}`;
};

/**
 * Format cost with currency conversion
 */
export const formatCost = (
  cost: number, 
  currency: Currency = 'USD', 
  exchangeRate: number = 1
): string => {
  const value = currency === 'CZK' ? cost * exchangeRate : cost;
  const currencySymbol = currency === 'CZK' ? 'Kč' : '$';
  
  if (value < 0.01) {
    return `<0.01 ${currencySymbol}`;
  }
  
  return `${value.toFixed(2)} ${currencySymbol}`;
};

/**
 * Format token count with appropriate scaling
 */
export const formatTokens = (tokens: number): string => {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  
  return tokens.toLocaleString();
};

/**
 * Format percentage with proper sign
 */
export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Format trend with color indication
 */
export const formatTrend = (trend: string): { 
  value: string; 
  color: 'green' | 'red' | 'gray';
  isPositive: boolean;
} => {
  const numericValue = parseFloat(trend.replace(/[^\d.-]/g, ''));
  const isPositive = numericValue >= 0;
  
  return {
    value: trend,
    color: isPositive ? 'green' : 'red',
    isPositive
  };
};

/**
 * Format date and time for display
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(dateObj);
};

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  
  if (diffInMinutes < 1) {
    return 'právě teď';
  }
  
  if (diffInMinutes < 60) {
    return `před ${diffInMinutes} min`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `před ${diffInHours} h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `před ${diffInDays} dny`;
};

/**
 * Format duration in human readable format
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
};

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes === 0) {
    return '0 B';
  }
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(1)} ${sizes[i]}`;
};

/**
 * Format error rate as percentage
 */
export const formatErrorRate = (errorRate: number): string => {
  if (errorRate === 0) {
    return '0%';
  }
  
  if (errorRate < 0.01) {
    return '<0.01%';
  }
  
  return `${(errorRate * 100).toFixed(2)}%`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Format API key for display (mask sensitive parts)
 */
export const formatApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }
  
  const visible = 4;
  const start = apiKey.substring(0, visible);
  const end = apiKey.substring(apiKey.length - visible);
  const middle = '*'.repeat(apiKey.length - (visible * 2));
  
  return `${start}${middle}${end}`;
};

/**
 * Color palette for charts
 */
export const getChartColors = (index: number): string => {
  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  
  return colors[index % colors.length];
};

/**
 * Status color mapping
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: '#10B981',    // Green
    inactive: '#6B7280',  // Gray
    error: '#EF4444',     // Red
    warning: '#F59E0B',   // Yellow
    success: '#10B981',   // Green
    pending: '#3B82F6',   // Blue
  };
  
  return statusColors[status.toLowerCase()] ?? '#6B7280';
};