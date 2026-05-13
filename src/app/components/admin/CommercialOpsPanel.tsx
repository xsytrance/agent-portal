'use client';

import { useEffect, useState } from 'react';

interface OpsSummary {
  databaseBacked: boolean;
  totals: {
    revenueMicrocredits: string;
    estimatedProviderSpendMicrocredits: string;
    activeUsers: number;
    blockedRequests: number;
  };
  wallets: Array<{
    userId: string;
    user?: { email?: string | null; name?: string | null; isGuest?: boolean } | null;
    balanceMicrocredits: string;
    lifetimeUsedMicrocredits: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amountMicrocredits: string;
    description?: string | null;
    createdAt: string;
  }>;
  topSpenders: Array<{
    userId: string;
    actualMicrocredits: string;
  }>;
  providerHealth: {
    openRouterConfigured: boolean;
    emergencyDisabled: boolean;
    allowedModels: string[];
  };
}

function formatMicrocredits(value: string): string {
  const numeric = Number(value) / 1_000_000;
  return `$${numeric.toFixed(2)}`;
}

export default function CommercialOpsPanel() {
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/ops')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((data) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load ops summary'));
  }, []);

  if (error) return <div className="text-red-600">Failed to load ops summary: {error}</div>;
  if (!summary) return <div style={{ color: '#64748B' }}>Loading commercial operations...</div>;

  const cards = [
    ['Total Revenue', formatMicrocredits(summary.totals.revenueMicrocredits)],
    ['Provider Spend', formatMicrocredits(summary.totals.estimatedProviderSpendMicrocredits)],
    ['Active Users', String(summary.totals.activeUsers)],
    ['Blocked Requests', String(summary.totals.blockedRequests)],
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', color: '#1A1A2E' }}>
          Commercial Operations
        </h3>
        <p style={{ color: '#64748B' }}>
          Wallet, revenue, provider spend, and safety posture for the prepaid AI workspace.
        </p>
      </div>

      {!summary.databaseBacked && (
        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
          Database is not configured. Showing degraded operational state; persistent wallets are disabled.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {cards.map(([label, value]) => (
          <div key={label} className="p-4 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: '1.5rem', color: '#1A1A2E', fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h4 className="font-semibold mb-3">Wallet Balances</h4>
          <div className="space-y-2">
            {summary.wallets.slice(0, 6).map((wallet) => (
              <div key={wallet.userId} className="p-3 rounded-lg flex justify-between" style={{ backgroundColor: '#FFF' }}>
                <span>{wallet.user?.email || wallet.user?.name || wallet.userId}</span>
                <strong>{formatMicrocredits(wallet.balanceMicrocredits)}</strong>
              </div>
            ))}
            {summary.wallets.length === 0 && <p style={{ color: '#64748B' }}>No wallets yet.</p>}
          </div>
        </section>

        <section>
          <h4 className="font-semibold mb-3">Provider Health</h4>
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF' }}>
            <div>OpenRouter configured: <strong>{summary.providerHealth.openRouterConfigured ? 'yes' : 'no'}</strong></div>
            <div>Emergency disabled: <strong>{summary.providerHealth.emergencyDisabled ? 'yes' : 'no'}</strong></div>
            <div className="mt-2" style={{ color: '#64748B' }}>
              Allowlist: {summary.providerHealth.allowedModels.join(', ')}
            </div>
          </div>
        </section>

        <section>
          <h4 className="font-semibold mb-3">Recent Transactions</h4>
          <div className="space-y-2">
            {summary.recentTransactions.slice(0, 8).map((txn) => (
              <div key={txn.id} className="p-3 rounded-lg flex justify-between" style={{ backgroundColor: '#FFF' }}>
                <span>{txn.type}</span>
                <strong>{formatMicrocredits(txn.amountMicrocredits)}</strong>
              </div>
            ))}
            {summary.recentTransactions.length === 0 && <p style={{ color: '#64748B' }}>No transactions yet.</p>}
          </div>
        </section>

        <section>
          <h4 className="font-semibold mb-3">Top Spenders</h4>
          <div className="space-y-2">
            {summary.topSpenders.slice(0, 8).map((spender) => (
              <div key={spender.userId} className="p-3 rounded-lg flex justify-between" style={{ backgroundColor: '#FFF' }}>
                <span>{spender.userId}</span>
                <strong>{formatMicrocredits(spender.actualMicrocredits)}</strong>
              </div>
            ))}
            {summary.topSpenders.length === 0 && <p style={{ color: '#64748B' }}>No usage yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
