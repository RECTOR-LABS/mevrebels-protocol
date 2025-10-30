export interface Strategy {
  id: string;
  name: string;
  creator: string;
  dexes: string[];
  tokenPairs: string[];
  profitThreshold: number;
  maxSlippage: number;
  totalProfit: number;
  executionCount: number;
  successRate: number;
  status: 'active' | 'pending' | 'rejected';
  createdAt: Date;
  lastExecuted?: Date;
}

export interface StrategyFilters {
  dex?: string;
  minProfit?: number;
  status?: Strategy['status'];
}

export type StrategySort =
  | 'profit-desc'
  | 'profit-asc'
  | 'executions-desc'
  | 'success-desc'
  | 'recent';
