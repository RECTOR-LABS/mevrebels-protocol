'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '@/lib/api';
import { Proposal, VoteChoice } from '@/types/proposal';
import { formatDistanceToNow } from 'date-fns';

export default function GovernancePage() {
  const { connected, publicKey } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'closed'>('active');

  // Fetch proposals from API
  useEffect(() => {
    async function fetchProposals() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.proposals.getAll();
        setProposals(data);
      } catch (err) {
        console.error('Failed to fetch proposals:', err);
        setError('Failed to load proposals. Please try again later.');
        setProposals([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProposals();
  }, []);

  const activeProposals = proposals.filter((p) => p.status === 'active');
  const closedProposals = proposals.filter((p) => p.status !== 'active');

  const handleVote = (proposalId: string, vote: VoteChoice) => {
    if (!connected) {
      alert('Please connect your wallet to vote!');
      return;
    }
    // TODO: Implement actual voting with Anchor
    alert(`Voting ${vote.toUpperCase()} on proposal ${proposalId}...`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-midnight-black to-midnight-black/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            DAO <span className="text-trust-blue">GOVERNANCE</span>
          </h1>
          <p className="text-neutral-gray">
            Vote on proposals and shape the future of MEVrebels protocol
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-40 border-b border-border bg-midnight-black/95 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedTab('active')}
              className={`px-6 py-4 font-bold transition-all cursor-pointer ${
                selectedTab === 'active'
                  ? 'text-rebellious border-b-2 border-rebellious'
                  : 'text-neutral-gray hover:text-white'
              }`}
            >
              ACTIVE ({activeProposals.length})
            </button>
            <button
              onClick={() => setSelectedTab('closed')}
              className={`px-6 py-4 font-bold transition-all cursor-pointer ${
                selectedTab === 'closed'
                  ? 'text-rebellious border-b-2 border-rebellious'
                  : 'text-neutral-gray hover:text-white'
              }`}
            >
              CLOSED ({closedProposals.length})
            </button>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-trust-blue mb-4"></div>
              <p className="text-neutral-gray">Loading proposals from API...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Failed to Load Proposals
              </h3>
              <p className="text-neutral-gray mb-2">{error}</p>
              <p className="text-sm text-neutral-gray mb-6">
                API: {process.env.NEXT_PUBLIC_API_URL || 'https://api.mevrebels.rectorspace.com'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-trust-blue text-white font-bold rounded-lg hover:bg-trust-blue/90 transition-all cursor-pointer"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Proposals */}
          {!loading && !error && (
            <>
              {selectedTab === 'active' ? (
                activeProposals.length === 0 ? (
                  <EmptyState message="No active proposals" />
                ) : (
                  activeProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      onVote={handleVote}
                      canVote={connected}
                    />
                  ))
                )
              ) : closedProposals.length === 0 ? (
                <EmptyState message="No closed proposals" />
              ) : (
                closedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onVote={handleVote}
                    canVote={false}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  onVote,
  canVote,
}: {
  proposal: Proposal;
  onVote: (id: string, vote: VoteChoice) => void;
  canVote: boolean;
}) {
  const totalVotes = proposal.votesYes + proposal.votesNo + proposal.votesAbstain;
  const yesPercentage = totalVotes > 0 ? (proposal.votesYes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.votesNo / totalVotes) * 100 : 0;
  const abstainPercentage =
    totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0;

  const quorumReached = totalVotes >= proposal.quorum;

  const statusColors = {
    active: 'text-warning-orange border-warning-orange bg-warning-orange/10',
    passed: 'text-profit-green border-profit-green bg-profit-green/10',
    rejected: 'text-rebellious border-rebellious bg-rebellious/10',
    executed: 'text-trust-blue border-trust-blue bg-trust-blue/10',
  };

  const typeColors = {
    'strategy-approval': 'bg-rebellious/20 text-rebellious border-rebellious/30',
    'protocol-upgrade': 'bg-trust-blue/20 text-trust-blue border-trust-blue/30',
    treasury: 'bg-profit-green/20 text-profit-green border-profit-green/30',
    'parameter-change': 'bg-warning-orange/20 text-warning-orange border-warning-orange/30',
  };

  return (
    <div className="bg-gradient-to-br from-midnight-black to-midnight-black/80 border border-border rounded-lg p-6 hover:border-trust-blue transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2 py-1 text-xs font-mono uppercase rounded border ${typeColors[proposal.type]}`}
            >
              {proposal.type.replace('-', ' ')}
            </span>
            <span
              className={`px-2 py-1 text-xs font-mono uppercase rounded border ${statusColors[proposal.status]}`}
            >
              {proposal.status}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {proposal.title}
          </h3>
          <p className="text-neutral-gray text-sm mb-3">
            {proposal.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-gray">
            <span>by <span className="font-mono text-trust-blue">{proposal.proposer}</span></span>
            <span>•</span>
            <span>
              {proposal.status === 'active'
                ? `Ends ${formatDistanceToNow(proposal.endsAt, { addSuffix: true })}`
                : `Ended ${formatDistanceToNow(proposal.endsAt, { addSuffix: true })}`}
            </span>
          </div>
        </div>
      </div>

      {/* Voting Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-neutral-gray">Vote Distribution</span>
          <span className={`font-mono ${quorumReached ? 'text-profit-green' : 'text-warning-orange'}`}>
            Quorum: {totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()}
            {quorumReached && ' ✓'}
          </span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-profit-green w-16">YES</span>
            <div className="flex-1 h-3 bg-midnight-black rounded-full overflow-hidden">
              <div
                className="h-full bg-profit-green transition-all duration-500"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
            <span className="text-xs font-mono text-white w-20 text-right">
              {proposal.votesYes.toLocaleString()} ({yesPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-rebellious w-16">NO</span>
            <div className="flex-1 h-3 bg-midnight-black rounded-full overflow-hidden">
              <div
                className="h-full bg-rebellious transition-all duration-500"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
            <span className="text-xs font-mono text-white w-20 text-right">
              {proposal.votesNo.toLocaleString()} ({noPercentage.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-gray w-16">ABSTAIN</span>
            <div className="flex-1 h-3 bg-midnight-black rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-gray transition-all duration-500"
                style={{ width: `${abstainPercentage}%` }}
              />
            </div>
            <span className="text-xs font-mono text-white w-20 text-right">
              {proposal.votesAbstain.toLocaleString()} ({abstainPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Voting Buttons */}
      {canVote && proposal.status === 'active' && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onVote(proposal.id, 'yes')}
            className="flex-1 py-2 px-4 bg-profit-green text-midnight-black font-bold rounded-lg hover:bg-profit-green/90 transition-all active:scale-95 cursor-pointer"
          >
            VOTE YES
          </button>
          <button
            onClick={() => onVote(proposal.id, 'no')}
            className="flex-1 py-2 px-4 bg-rebellious text-white font-bold rounded-lg hover:bg-rebellious/90 transition-all active:scale-95 cursor-pointer"
          >
            VOTE NO
          </button>
          <button
            onClick={() => onVote(proposal.id, 'abstain')}
            className="flex-1 py-2 px-4 border-2 border-neutral-gray text-neutral-gray font-bold rounded-lg hover:bg-neutral-gray hover:text-midnight-black transition-all active:scale-95 cursor-pointer"
          >
            ABSTAIN
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🗳️</div>
      <h3 className="text-2xl font-bold text-white mb-2">{message}</h3>
      <p className="text-neutral-gray">Check back later for new proposals</p>
    </div>
  );
}
