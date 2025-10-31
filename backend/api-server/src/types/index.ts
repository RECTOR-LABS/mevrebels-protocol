/**
 * TypeScript Types for MEVrebels API
 */

// Strategy
export interface Strategy {
  id: string;
  creator: string;
  strategy_id: number;
  name: string;
  dexs: DexType[];
  token_pairs: TokenPair[];
  profit_threshold: number;
  max_slippage: number;
  status: StrategyStatus;
  total_profit: number;
  execution_count: number;
  success_count: number;
  created_at: Date;
  updated_at: Date;
}

export type StrategyStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'paused';

export type DexType = 'raydium' | 'orca' | 'meteora' | 'phoenix' | 'lifinity';

export interface TokenPair {
  tokenA: string;
  tokenB: string;
}

// Execution
export interface Execution {
  id: string;
  strategy_id: string;
  executor: string;
  signature: string;
  profit_lamports: number;
  gas_used: number;
  success: boolean;
  error_message?: string;
  timestamp: Date;
  dex_path?: DexType[];
  token_amounts?: any;
  execution_time_ms?: number;
}

// Proposal
export interface Proposal {
  id: string;
  proposal_id: number;
  type: ProposalType;
  title: string;
  description: string;
  proposer: string;
  votes_yes: number;
  votes_no: number;
  votes_abstain: number;
  quorum: number;
  status: ProposalStatus;
  created_at: Date;
  ends_at: Date;
  executed_at?: Date;
  strategy_id?: string;
}

export type ProposalType = 'strategy-approval' | 'parameter-change' | 'treasury' | 'upgrade';
export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';

// Vote
export interface Vote {
  id: string;
  proposal_id: string;
  voter: string;
  vote_type: VoteType;
  voting_power: number;
  timestamp: Date;
}

export type VoteType = 'yes' | 'no' | 'abstain';

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  strategy_id: string;
  strategy_name: string;
  creator: string;
  total_profit: number;
  execution_count: number;
  success_rate: number;
}

// Analytics
export interface AnalyticsOverview {
  total_strategies: number;
  active_strategies: number;
  total_executions: number;
  total_volume_lamports: number;
  total_creators: number;
  total_executors: number;
  active_proposals: number;
}

export interface StrategyPerformance {
  total_executions: number;
  successful_executions: number;
  total_profit: number;
  avg_profit: number;
  max_profit: number;
  success_rate: number;
}

// Creator Earnings
export interface CreatorEarnings {
  creator: string;
  total_earnings_lamports: number;
  strategy_count: number;
  total_executions: number;
  successful_executions: number;
  last_execution_at?: Date;
}

// WebSocket Messages
export interface WSMessage {
  type: WSMessageType;
  data: any;
}

export type WSMessageType =
  | 'opportunity'
  | 'execution'
  | 'proposal_created'
  | 'proposal_voted'
  | 'strategy_created'
  | 'subscribe'
  | 'unsubscribe'
  | 'ping'
  | 'pong';

export interface OpportunityMessage {
  dex_a: string;
  dex_b: string;
  token_a: string;
  token_b: string;
  profit_estimate_lamports: number;
  confidence_score: number;
}

export interface ExecutionMessage {
  strategy_id: string;
  executor: string;
  profit_lamports: number;
  success: boolean;
  timestamp: Date;
}
