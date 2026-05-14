'use client';

import { useCallback, useEffect, useState } from 'react';

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
  recentProviderLogs: Array<{
    id: string;
    status: string;
    model: string;
    estimatedCostMicrocredits: string;
    actualCostMicrocredits?: string | null;
    blockedReason?: string | null;
    errorMessage?: string | null;
    createdAt: string;
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
  const [adjustUserId, setAdjustUserId] = useState('guest_demo');
  const [adjustType, setAdjustType] = useState('promotional_credit');
  const [adjustAmount, setAdjustAmount] = useState('1000000');
  const [adjustStatus, setAdjustStatus] = useState<string | null>(null);

  const loadSummary = useCallback(() => {
    fetch('/api/admin/ops')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))
      .then((data) => setSummary(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load ops summary'));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const submitAdjustment = async () => {
    if (!summary?.databaseBacked) {
      setAdjustStatus('Connect PostgreSQL before applying wallet ledger entries.');
      return;
    }
    setAdjustStatus('Submitting...');
    try {
      const res = await fetch('/api/admin/wallet/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustUserId,
          type: adjustType,
          amountMicrocredits: adjustAmount,
          description: 'Admin panel wallet adjustment',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `HTTP ${res.status}`);
      setAdjustStatus(`Adjustment saved. New balance: ${formatMicrocredits(data.transaction.balanceAfterMicrocredits)}`);
      loadSummary();
    } catch (err) {
      setAdjustStatus(err instanceof Error ? err.message : 'Adjustment failed');
    }
  };

  if (error) return <div className="text-red-600">Failed to load ops summary: {error}</div>;
  if (!summary) return <div style={{ color: '#64748B' }}>Loading commercial operations...</div>;

  const cards = [
    ['Total Revenue', formatMicrocredits(summary.totals.revenueMicrocredits)],
    ['Provider Spend', formatMicrocredits(summary.totals.estimatedProviderSpendMicrocredits)],
    ['Active Users', String(summary.totals.activeUsers)],
    ['Blocked Requests', String(summary.totals.blockedRequests)],
  ];
  const ledgerDisabled = !summary.databaseBacked;

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
          <h4 className="font-semibold mb-3">Admin Ledger Action</h4>
          <fieldset
            disabled={ledgerDisabled}
            className="p-4 rounded-lg space-y-3"
            style={{
              backgroundColor: '#FFF',
              opacity: ledgerDisabled ? 0.45 : 1,
              cursor: ledgerDisabled ? 'not-allowed' : 'default',
            }}
          >
            {!summary.databaseBacked && (
              <p className="rounded-lg p-2" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.8125rem' }}>
                Connect PostgreSQL before applying wallet ledger entries.
              </p>
            )}
            <input
              disabled={ledgerDisabled}
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              placeholder="userId"
              className="w-full px-3 py-2 rounded-lg"
              style={{ border: '1px solid #CBD5E1' }}
            />
            <select
              disabled={ledgerDisabled}
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg"
              style={{ border: '1px solid #CBD5E1' }}
            >
              <option value="promotional_credit">promotional_credit</option>
              <option value="refund">refund</option>
              <option value="admin_adjustment">admin_adjustment</option>
            </select>
            <input
              disabled={ledgerDisabled}
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="amountMicrocredits"
              className="w-full px-3 py-2 rounded-lg"
              style={{ border: '1px solid #CBD5E1' }}
            />
            <button
              onClick={submitAdjustment}
              disabled={ledgerDisabled}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                backgroundColor: ledgerDisabled ? '#CBD5E1' : '#1A1A2E',
                color: '#fff',
                cursor: ledgerDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              Apply Ledger Entry
            </button>
            {adjustStatus && <p style={{ color: '#64748B', fontSize: '0.875rem' }}>{adjustStatus}</p>}
          </fieldset>
        </section>

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

        <section>
          <h4 className="font-semibold mb-3">Recent Provider Logs</h4>
          <div className="space-y-2">
            {summary.recentProviderLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="p-3 rounded-lg" style={{ backgroundColor: '#FFF' }}>
                <div className="flex justify-between gap-3">
                  <span>{log.status} · {log.model}</span>
                  <strong>{formatMicrocredits(log.actualCostMicrocredits || log.estimatedCostMicrocredits)}</strong>
                </div>
                {(log.blockedReason || log.errorMessage) && (
                  <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>
                    {log.blockedReason || log.errorMessage}
                  </div>
                )}
              </div>
            ))}
            {summary.recentProviderLogs.length === 0 && <p style={{ color: '#64748B' }}>No provider requests yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
