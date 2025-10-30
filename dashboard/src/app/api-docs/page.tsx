'use client';

import { useState } from 'react';
import { CodeBlock } from '@/components/docs/CodeBlock';

type Section = 'overview' | 'strategies' | 'executions' | 'proposals' | 'analytics' | 'websocket';

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📖' },
    { id: 'strategies', label: 'Strategies', icon: '⚡' },
    { id: 'executions', label: 'Executions', icon: '🚀' },
    { id: 'proposals', label: 'Proposals', icon: '🗳️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'websocket', label: 'WebSocket', icon: '🔌' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-midnight-black/50 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-black text-white">
            API <span className="text-rebellious">DOCS</span>
          </h2>
          <p className="text-xs text-neutral-gray mt-1">
            MEVrebels Protocol
          </p>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left cursor-pointer ${
                  activeSection === item.id
                    ? 'bg-rebellious/20 text-rebellious border border-rebellious/30'
                    : 'text-neutral-gray hover:text-white hover:bg-midnight-black'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Links */}
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-xs uppercase text-neutral-gray font-bold mb-3">
              Quick Links
            </h3>
            <div className="space-y-2">
              <a
                href="https://api.mevrebels.rectorspace.com/health"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-trust-blue hover:text-trust-blue/80 transition-colors"
              >
                Health Check →
              </a>
              <a
                href="https://github.com/RECTOR-LABS/mevrebels-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-trust-blue hover:text-trust-blue/80 transition-colors"
              >
                GitHub Repo →
              </a>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'strategies' && <StrategiesSection />}
          {activeSection === 'executions' && <ExecutionsSection />}
          {activeSection === 'proposals' && <ProposalsSection />}
          {activeSection === 'analytics' && <AnalyticsSection />}
          {activeSection === 'websocket' && <WebSocketSection />}
        </div>
      </main>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-4">
          MEVrebels API Documentation
        </h1>
        <p className="text-lg text-neutral-gray">
          Complete REST API reference for the MEVrebels Protocol. Build arbitrage strategies, execute trades, and participate in DAO governance.
        </p>
      </div>

      <div className="bg-trust-blue/10 border border-trust-blue/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-trust-blue mb-2">Base URL</h3>
        <code className="text-white font-mono bg-midnight-black px-3 py-1 rounded">
          https://api.mevrebels.rectorspace.com
        </code>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
        <p className="text-neutral-gray mb-4">
          Currently, most endpoints are publicly accessible. Write operations (POST, PUT, DELETE) will require wallet signature authentication in the future.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Rate Limiting</h2>
        <p className="text-neutral-gray mb-4">
          API requests are rate-limited to <strong className="text-white">100 requests per second</strong> per IP address. Burst allowance: 20 requests.
        </p>
        <div className="bg-warning-orange/10 border border-warning-orange/30 rounded-lg p-4">
          <p className="text-warning-orange text-sm">
            ⚠️ If rate limit is exceeded, you'll receive a <code className="bg-midnight-black px-2 py-1 rounded">429 Too Many Requests</code> response.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Response Format</h2>
        <p className="text-neutral-gray mb-4">
          All responses are in JSON format with consistent structure:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "data": {...},
  "status": "success",
  "timestamp": "2025-10-30T12:00:00Z"
}`}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Error Handling</h2>
        <p className="text-neutral-gray mb-4">
          Errors include descriptive messages and appropriate HTTP status codes:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "error": "Strategy not found",
  "status": "error",
  "code": 404,
  "timestamp": "2025-10-30T12:00:00Z"
}`}
        />
      </div>

      <div className="bg-rebellious/10 border border-rebellious/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-rebellious mb-2">Need Help?</h3>
        <p className="text-neutral-gray mb-3">
          Join our community for support and updates:
        </p>
        <div className="flex gap-4">
          <a
            href="https://discord.gg/mevrebels"
            className="text-trust-blue hover:text-trust-blue/80 transition-colors"
          >
            Discord →
          </a>
          <a
            href="https://twitter.com/mevrebels"
            className="text-trust-blue hover:text-trust-blue/80 transition-colors"
          >
            Twitter →
          </a>
        </div>
      </div>
    </div>
  );
}

function StrategiesSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-4">Strategies API</h1>
        <p className="text-lg text-neutral-gray">
          Manage arbitrage strategies - list, create, and retrieve strategy details.
        </p>
      </div>

      {/* GET /api/strategies */}
      <EndpointSection
        method="GET"
        path="/api/strategies"
        description="Retrieve all registered strategies"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/strategies`,
          javascript: `const response = await fetch(
  'https://api.mevrebels.rectorspace.com/api/strategies'
);
const strategies = await response.json();`,
          python: `import requests

response = requests.get(
    'https://api.mevrebels.rectorspace.com/api/strategies'
)
strategies = response.json()`,
        }}
        responseExample={`[
  {
    "id": "uuid",
    "name": "SOL/USDC Arbitrage",
    "creator": "ArchD...x7vK",
    "dexes": ["Raydium", "Orca"],
    "tokenPairs": ["SOL/USDC"],
    "profitThreshold": 0.5,
    "maxSlippage": 1.0,
    "totalProfit": 12543.67,
    "executionCount": 234,
    "successRate": 94.5,
    "status": "active",
    "createdAt": "2025-10-15T00:00:00Z"
  }
]`}
      />

      {/* GET /api/strategies/:id */}
      <EndpointSection
        method="GET"
        path="/api/strategies/:id"
        description="Get strategy details by ID"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/strategies/uuid`,
          javascript: `const strategyId = 'uuid';
const response = await fetch(
  \`https://api.mevrebels.rectorspace.com/api/strategies/\${strategyId}\`
);
const strategy = await response.json();`,
        }}
        responseExample={`{
  "id": "uuid",
  "name": "SOL/USDC Arbitrage",
  "creator": "ArchD...x7vK",
  "dexes": ["Raydium", "Orca"],
  "tokenPairs": ["SOL/USDC"],
  "profitThreshold": 0.5,
  "maxSlippage": 1.0,
  "totalProfit": 12543.67,
  "executionCount": 234,
  "successRate": 94.5,
  "status": "active"
}`}
      />

      {/* GET /api/strategies/:id/stats */}
      <EndpointSection
        method="GET"
        path="/api/strategies/:id/stats"
        description="Get strategy performance statistics"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/strategies/uuid/stats`,
          javascript: `const strategyId = 'uuid';
const response = await fetch(
  \`https://api.mevrebels.rectorspace.com/api/strategies/\${strategyId}/stats\`
);
const stats = await response.json();`,
        }}
        responseExample={`{
  "totalProfit": 12543.67,
  "executionCount": 234,
  "successRate": 94.5,
  "avgProfitPerExecution": 53.61
}`}
      />
    </div>
  );
}

function ExecutionsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-4">Executions API</h1>
        <p className="text-lg text-neutral-gray">
          Track strategy executions and their results.
        </p>
      </div>

      <EndpointSection
        method="GET"
        path="/api/executions"
        description="Retrieve all strategy executions"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/executions`,
          javascript: `const response = await fetch(
  'https://api.mevrebels.rectorspace.com/api/executions'
);
const executions = await response.json();`,
        }}
        responseExample={`[
  {
    "id": "uuid",
    "strategyId": "uuid",
    "executor": "8Qbz...mN3w",
    "profitLamports": 5000000,
    "gasUsed": 12000,
    "success": true,
    "timestamp": "2025-10-30T08:00:00Z"
  }
]`}
      />

      <EndpointSection
        method="GET"
        path="/api/executions/:id"
        description="Get execution details by ID"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/executions/uuid`,
        }}
        responseExample={`{
  "id": "uuid",
  "strategyId": "uuid",
  "executor": "8Qbz...mN3w",
  "profitLamports": 5000000,
  "gasUsed": 12000,
  "success": true,
  "timestamp": "2025-10-30T08:00:00Z",
  "transactionSignature": "5x..."
}`}
      />
    </div>
  );
}

function ProposalsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-4">Proposals API</h1>
        <p className="text-lg text-neutral-gray">
          DAO governance proposals for strategy approval and protocol parameters.
        </p>
      </div>

      <EndpointSection
        method="GET"
        path="/api/proposals"
        description="Retrieve all DAO proposals"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/proposals`,
          javascript: `const response = await fetch(
  'https://api.mevrebels.rectorspace.com/api/proposals'
);
const proposals = await response.json();`,
        }}
        responseExample={`[
  {
    "id": "uuid",
    "title": "Approve Strategy: SOL/USDC Arb",
    "description": "Approve this arbitrage strategy...",
    "type": "strategy-approval",
    "proposer": "5FHw...kBYw",
    "votesYes": 1247,
    "votesNo": 123,
    "votesAbstain": 45,
    "quorum": 1000,
    "status": "active",
    "createdAt": "2025-10-28T00:00:00Z",
    "endsAt": "2025-11-04T00:00:00Z"
  }
]`}
      />

      <EndpointSection
        method="GET"
        path="/api/proposals/:id"
        description="Get proposal details by ID"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/api/proposals/uuid`,
        }}
        responseExample={`{
  "id": "uuid",
  "title": "Approve Strategy: SOL/USDC Arb",
  "description": "Full description here...",
  "type": "strategy-approval",
  "votesYes": 1247,
  "votesNo": 123,
  "status": "active"
}`}
      />
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-4">Analytics API</h1>
        <p className="text-lg text-neutral-gray">
          Protocol-wide statistics, leaderboards, and performance metrics.
        </p>
      </div>

      <EndpointSection
        method="GET"
        path="/analytics/strategies/stats"
        description="Get strategy statistics"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/analytics/strategies/stats`,
          javascript: `const response = await fetch(
  'https://api.mevrebels.rectorspace.com/analytics/strategies/stats'
);
const stats = await response.json();`,
        }}
        responseExample={`{
  "totalStrategies": 156,
  "activeStrategies": 98,
  "totalProfit": 456789.23,
  "totalExecutions": 12456
}`}
      />

      <EndpointSection
        method="GET"
        path="/analytics/executions/stats"
        description="Get execution statistics"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/analytics/executions/stats`,
        }}
        responseExample={`{
  "totalExecutions": 12456,
  "successfulExecutions": 11789,
  "failedExecutions": 667,
  "avgProfitPerExecution": 36.67,
  "totalVolume": 456789.23
}`}
      />

      <EndpointSection
        method="GET"
        path="/analytics/leaderboard"
        description="Get leaderboard (top strategies and creators)"
        examples={{
          curl: `curl https://api.mevrebels.rectorspace.com/analytics/leaderboard`,
          javascript: `const response = await fetch(
  'https://api.mevrebels.rectorspace.com/analytics/leaderboard'
);
const leaderboard = await response.json();`,
        }}
        responseExample={`{
  "topStrategies": [
    {
      "strategyId": "uuid",
      "name": "SOL/USDC Arbitrage",
      "creator": "ArchD...x7vK",
      "totalProfit": 12543.67,
      "executionCount": 234,
      "successRate": 94.5
    }
  ],
  "topCreators": [
    {
      "creator": "ArchD...x7vK",
      "totalStrategies": 5,
      "totalProfit": 45678.90,
      "totalEarnings": 13703.67
    }
  ]
}`}
      />
    </div>
  );
}

function WebSocketSection() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black text-white mb-4">WebSocket API</h1>
        <p className="text-lg text-neutral-gray">
          Real-time updates for opportunities, executions, and events.
        </p>
      </div>

      <div className="bg-trust-blue/10 border border-trust-blue/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-trust-blue mb-2">WebSocket URL</h3>
        <code className="text-white font-mono bg-midnight-black px-3 py-1 rounded">
          wss://api.mevrebels.rectorspace.com/ws
        </code>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">JavaScript Example</h2>
        <CodeBlock
          language="javascript"
          code={`const ws = new WebSocket('wss://api.mevrebels.rectorspace.com/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);

  // Handle different event types
  switch(data.type) {
    case 'opportunity':
      console.log('New opportunity:', data.data);
      break;
    case 'execution':
      console.log('Execution result:', data.data);
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};`}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Event Types</h2>
        <div className="space-y-4">
          <div className="bg-midnight-black/50 border border-border rounded-lg p-4">
            <h4 className="text-white font-bold mb-2">opportunity</h4>
            <p className="text-neutral-gray text-sm mb-3">
              New arbitrage opportunity detected
            </p>
            <CodeBlock
              language="json"
              code={`{
  "type": "opportunity",
  "data": {
    "strategyId": "uuid",
    "estimatedProfit": 125.45,
    "dexes": ["Raydium", "Orca"],
    "timestamp": "2025-10-30T12:00:00Z"
  }
}`}
            />
          </div>

          <div className="bg-midnight-black/50 border border-border rounded-lg p-4">
            <h4 className="text-white font-bold mb-2">execution</h4>
            <p className="text-neutral-gray text-sm mb-3">
              Strategy execution completed
            </p>
            <CodeBlock
              language="json"
              code={`{
  "type": "execution",
  "data": {
    "executionId": "uuid",
    "strategyId": "uuid",
    "success": true,
    "profit": 98.32,
    "timestamp": "2025-10-30T12:00:30Z"
  }
}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function EndpointSection({
  method,
  path,
  description,
  examples,
  responseExample,
}: {
  method: string;
  path: string;
  description: string;
  examples: Record<string, string>;
  responseExample: string;
}) {
  const [activeTab, setActiveTab] = useState<string>('curl');

  const methodColors: Record<string, string> = {
    GET: 'text-profit-green border-profit-green bg-profit-green/10',
    POST: 'text-trust-blue border-trust-blue bg-trust-blue/10',
    PUT: 'text-warning-orange border-warning-orange bg-warning-orange/10',
    DELETE: 'text-rebellious border-rebellious bg-rebellious/10',
  };

  return (
    <div className="bg-midnight-black/50 border border-border rounded-lg p-6">
      <div className="flex items-start gap-4 mb-4">
        <span
          className={`px-3 py-1 font-mono font-bold text-sm border rounded ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="text-white font-mono text-lg">{path}</code>
      </div>

      <p className="text-neutral-gray mb-6">{description}</p>

      <div className="mb-6">
        <h4 className="text-white font-bold mb-3">Request Examples</h4>
        <div className="border-b border-border mb-3">
          <div className="flex gap-2">
            {Object.keys(examples).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveTab(lang)}
                className={`px-4 py-2 font-mono text-sm transition-colors cursor-pointer ${
                  activeTab === lang
                    ? 'text-rebellious border-b-2 border-rebellious'
                    : 'text-neutral-gray hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
        <CodeBlock language={activeTab} code={examples[activeTab]} />
      </div>

      <div>
        <h4 className="text-white font-bold mb-3">Response Example</h4>
        <CodeBlock language="json" code={responseExample} />
      </div>
    </div>
  );
}
