import { useState, useEffect, useCallback } from 'react';
import { DashboardData, ConnectionStatus, ApiResponse } from '../types/dashboard';
import { API_ENDPOINTS } from '../utils/constants';

interface UseDashboardDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  apiKey?: string;
}

interface UseDashboardDataReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  connectionStatus: ConnectionStatus;
  fetchDashboardData: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard data fetching and state
 */
export const useDashboardData = (
  isConfigured: boolean,
  options: UseDashboardDataOptions = {}
): UseDashboardDataReturn => {
  const { 
    autoRefresh = true, 
    refreshInterval = 30000, // 30 seconds
    apiKey 
  } = options;

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  /**
   * Fetch dashboard data from API
   */
  const fetchDashboardData = useCallback(async (): Promise<void> => {
    if (!isConfigured) {
      setError('Dashboard není nakonfigurován');
      setConnectionStatus('error');
      return;
    }

    setLoading(true);
    setError(null);
    setConnectionStatus('connecting');

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add API key if provided
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(API_ENDPOINTS.DASHBOARD, {
        method: 'GET',
        headers,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Use default error message
        }

        throw new Error(errorMessage);
      }

      const result: ApiResponse<DashboardData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Neplatná odpověď ze serveru');
      }

      // Validate data structure
      if (!result.data.models || !Array.isArray(result.data.models)) {
        throw new Error('Neplatná struktura dat');
      }

      setDashboardData(result.data);
      setLastUpdate(new Date());
      setConnectionStatus('connected');
      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Neznámá chyba při načítání dat';
      console.error('Dashboard data fetch error:', err);
      
      setError(errorMessage);
      setConnectionStatus('error');
      
      // Don't clear existing data on error, just show error message
      // This allows users to still see last known good data
    } finally {
      setLoading(false);
    }
  }, [isConfigured, apiKey]);

  /**
   * Refetch data (alias for fetchDashboardData for convenience)
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh || !isConfigured) {
      return;
    }

    // Initial fetch
    fetchDashboardData();

    // Set up interval
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, isConfigured, fetchDashboardData]);

  /**
   * Handle connection status changes
   */
  useEffect(() => {
    if (!isConfigured) {
      setConnectionStatus('disconnected');
      setDashboardData(null);
      setError(null);
    }
  }, [isConfigured]);

  /**
   * Handle window focus for automatic refresh
   */
  useEffect(() => {
    const handleFocus = () => {
      if (isConfigured && autoRefresh && connectionStatus !== 'connecting') {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isConfigured, autoRefresh, connectionStatus, fetchDashboardData]);

  /**
   * Handle network status changes
   */
  useEffect(() => {
    const handleOnline = () => {
      if (isConfigured && autoRefresh) {
        setConnectionStatus('reconnecting');
        fetchDashboardData();
      }
    };

    const handleOffline = () => {
      setConnectionStatus('error');
      setError('Žádné internetové připojení');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConfigured, autoRefresh, fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    lastUpdate,
    connectionStatus,
    fetchDashboardData,
    refetch,
  };
};