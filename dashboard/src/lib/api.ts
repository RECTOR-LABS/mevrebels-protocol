/**
 * MEVrebels API Client
 *
 * Handles all HTTP requests to the production backend API
 * Base URL: https://api.mevrebels.rectorspace.com
 */

import { Strategy } from '@/types/strategy';
import { Proposal } from '@/types/proposal';

// Production API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mevrebels.rectorspace.com';

/**
 * Generic API request handler with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Strategy API endpoints
 */
export const strategiesApi = {
  /**
   * Get all strategies
   */
  async getAll(): Promise<Strategy[]> {
    return apiRequest<Strategy[]>('/api/strategies');
  },

  /**
   * Get strategy by ID
   */
  async getById(id: string): Promise<Strategy> {
    return apiRequest<Strategy>(`/api/strategies/${id}`);
  },

  /**
   * Get strategy performance stats
   */
  async getStats(id: string): Promise<{
    totalProfit: number;
    executionCount: number;
    successRate: number;
    avgProfitPerExecution: number;
  }> {
    return apiRequest(`/api/strategies/${id}/stats`);
  },

  /**
   * Create new strategy (requires wallet signature)
   */
  async create(strategy: Partial<Strategy>): Promise<Strategy> {
    return apiRequest<Strategy>('/api/strategies', {
      method: 'POST',
      body: JSON.stringify(strategy),
    });
  },
};

/**
 * Executions API endpoints
 */
export const executionsApi = {
  /**
   * Get all executions
   */
  async getAll(): Promise<any[]> {
    return apiRequest<any[]>('/api/executions');
  },

  /**
   * Get execution by ID
   */
  async getById(id: string): Promise<any> {
    return apiRequest(`/api/executions/${id}`);
  },

  /**
   * Get executions for a specific strategy
   */
  async getByStrategy(strategyId: string): Promise<any[]> {
    return apiRequest<any[]>(`/api/executions?strategyId=${strategyId}`);
  },
};

/**
 * Proposals (DAO Governance) API endpoints
 */
export const proposalsApi = {
  /**
   * Get all proposals
   */
  async getAll(): Promise<Proposal[]> {
    return apiRequest<Proposal[]>('/api/proposals');
  },

  /**
   * Get proposal by ID
   */
  async getById(id: string): Promise<Proposal> {
    return apiRequest<Proposal>(`/api/proposals/${id}`);
  },

  /**
   * Create new proposal (requires wallet signature)
   */
  async create(proposal: Partial<Proposal>): Promise<Proposal> {
    return apiRequest<Proposal>('/api/proposals', {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  },
};

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
  /**
   * Get strategy statistics
   */
  async getStrategyStats(): Promise<{
    totalStrategies: number;
    activeStrategies: number;
    totalProfit: number;
    totalExecutions: number;
  }> {
    return apiRequest('/analytics/strategies/stats');
  },

  /**
   * Get execution statistics
   */
  async getExecutionStats(): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    avgProfitPerExecution: number;
    totalVolume: number;
  }> {
    return apiRequest('/analytics/executions/stats');
  },

  /**
   * Get leaderboard (top strategies and creators)
   */
  async getLeaderboard(): Promise<{
    topStrategies: Array<{
      strategyId: string;
      name: string;
      creator: string;
      totalProfit: number;
      executionCount: number;
      successRate: number;
    }>;
    topCreators: Array<{
      creator: string;
      totalStrategies: number;
      totalProfit: number;
      totalEarnings: number;
    }>;
  }> {
    return apiRequest('/analytics/leaderboard');
  },
};

/**
 * Health check endpoint
 */
export const healthApi = {
  /**
   * Check API server health
   */
  async check(): Promise<{
    status: string;
    uptime: number;
    timestamp: string;
  }> {
    return apiRequest('/health');
  },

  /**
   * Check analytics service health
   */
  async checkAnalytics(): Promise<{
    status: string;
    service: string;
  }> {
    return apiRequest('/analytics/health');
  },
};

/**
 * WebSocket connection for real-time updates
 */
export function createWebSocketConnection(
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket {
  const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace(
    'http://',
    'ws://'
  );
  const ws = new WebSocket(`${wsUrl}/ws`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
  };

  return ws;
}

/**
 * Export all APIs as a single object
 */
export const api = {
  strategies: strategiesApi,
  executions: executionsApi,
  proposals: proposalsApi,
  analytics: analyticsApi,
  health: healthApi,
  createWebSocket: createWebSocketConnection,
};

export default api;
