export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: 'strategy-approval' | 'protocol-upgrade' | 'treasury' | 'parameter-change';
  proposer: string;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  quorum: number;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  createdAt: Date;
  endsAt: Date;
  strategyId?: string;
}

export type VoteChoice = 'yes' | 'no' | 'abstain';
