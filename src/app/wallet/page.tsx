'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useWallet } from '@/app/hooks/useWallet';

const packs = [5, 10, 20, 50];

interface WalletTransaction {
  id: string;
  type: string;
  amountMicrocredits: string;
  balanceAfterMicrocredits: string;
  description?: string | null;
  createdAt: string;
}

function formatMicrocredits(value: string): string {
  return `$${(Number(value) / 1_000_000).toFixed(2)}`;
}

function WalletPageContent() {
  const params = useSearchParams();
  const { wallet, formattedBalance, refresh, loading } = useWallet();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; title?: string | null; updatedAt: string; latestMessage?: string | null }>>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

  const checkout = params.get('checkout');
  const signedIn = !!wallet && !wallet.user.isGuest && wallet.user.databaseBacked;

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/wallet/history', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setTransactions(data.transactions || []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Unable to load wallet history');
    }
  };

  const loadSessions = async () => {
    const res = await fetch('/api/chat/sessions', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) setSessions(data.sessions || []);
  };

  useEffect(() => {
    refresh();
    loadHistory();
    loadSessions();
  }, [refresh]);

  const startCheckout = async (dollars: number) => {
    setCheckoutLoading(dollars);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dollars }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || `Checkout failed with HTTP ${res.status}`);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout unavailable');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-[100dvh] px-6" style={{ backgroundColor: '#FFF9F0', paddingTop: 96, paddingBottom: 64 }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: '#1A1A2E' }}>
            Wallet
          </h1>
          <p style={{ color: '#64748B', maxWidth: 680 }}>
            Credits are prepaid AI usage credits for model requests. They are not unlimited subscription access, and provider calls stop when balance is insufficient.
          </p>
        </div>

        {checkout === 'success' && (
          <div className="mb-6 rounded-2xl p-4" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
            Checkout completed. Your balance will update after Stripe confirms the webhook.
          </div>
        )}
        {checkout === 'cancelled' && (
          <div className="mb-6 rounded-2xl p-4" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
            Checkout cancelled. No credits were added.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
          <section className="rounded-3xl p-6" style={{ backgroundColor: '#fff', boxShadow: '0 12px 40px rgba(15,15,35,0.08)' }}>
            <div style={{ color: '#64748B', fontWeight: 700, fontSize: '0.75rem' }}>CURRENT BALANCE</div>
            <div className="my-2" style={{ fontSize: '3rem', fontWeight: 800, color: '#1A1A2E' }}>
              {loading ? '...' : formattedBalance}
            </div>
            <div className="mb-5" style={{ color: signedIn ? '#166534' : '#92400E' }}>
              {signedIn ? 'Paid wallet-backed account' : 'Guest demo mode - sign in to buy credits'}
            </div>

            {!signedIn ? (
              <div className="grid grid-cols-2 gap-3">
                <Link href="/signin?callbackUrl=/wallet" className="rounded-xl px-4 py-3 text-center font-bold no-underline" style={{ backgroundColor: '#1A1A2E', color: '#fff' }}>
                  Sign in
                </Link>
                <Link href="/signup?callbackUrl=/wallet" className="rounded-xl px-4 py-3 text-center font-bold no-underline" style={{ backgroundColor: '#F1F5F9', color: '#1A1A2E' }}>
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {packs.map((dollars) => (
                  <button
                    key={dollars}
                    onClick={() => startCheckout(dollars)}
                    disabled={checkoutLoading !== null}
                    className="rounded-xl px-4 py-3 font-bold"
                    style={{ backgroundColor: '#1A1A2E', color: '#fff', opacity: checkoutLoading !== null ? 0.65 : 1 }}
                  >
                    {checkoutLoading === dollars ? 'Starting...' : `Buy $${dollars}`}
                  </button>
                ))}
              </div>
            )}

            {checkoutError && (
              <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                {checkoutError}
              </div>
            )}
            <button onClick={() => { refresh(); loadHistory(); }} className="mt-4 underline" style={{ color: '#64748B' }}>
              Refresh balance
            </button>
          </section>

          <section className="rounded-3xl p-6" style={{ backgroundColor: '#fff', boxShadow: '0 12px 40px rgba(15,15,35,0.08)' }}>
            <h2 className="font-bold mb-4" style={{ color: '#1A1A2E' }}>Transaction history</h2>
            {historyError && <p style={{ color: '#991B1B' }}>{historyError}</p>}
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex justify-between gap-4 rounded-xl p-3" style={{ backgroundColor: '#F8FAFC' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1A1A2E' }}>{txn.type}</div>
                    <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>{new Date(txn.createdAt).toLocaleString()}</div>
                    {txn.description && <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>{txn.description}</div>}
                  </div>
                  <div style={{ fontWeight: 800, color: txn.amountMicrocredits.startsWith('-') ? '#991B1B' : '#166534' }}>
                    {formatMicrocredits(txn.amountMicrocredits)}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && <p style={{ color: '#64748B' }}>No wallet transactions yet.</p>}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl p-6" style={{ backgroundColor: '#fff', boxShadow: '0 12px 40px rgba(15,15,35,0.08)' }}>
          <h2 className="font-bold mb-4" style={{ color: '#1A1A2E' }}>Recent chat sessions</h2>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl p-3" style={{ backgroundColor: '#F8FAFC' }}>
                <div style={{ fontWeight: 700, color: '#1A1A2E' }}>{session.title || 'Untitled chat'}</div>
                <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>{new Date(session.updatedAt).toLocaleString()}</div>
                {session.latestMessage && <div style={{ color: '#64748B', fontSize: '0.8125rem' }}>{session.latestMessage.slice(0, 120)}</div>}
              </div>
            ))}
            {sessions.length === 0 && <p style={{ color: '#64748B' }}>No saved chat sessions yet. Signed-in chats will appear here.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" style={{ backgroundColor: '#FFF9F0', paddingTop: 96 }}>Loading wallet...</div>}>
      <WalletPageContent />
    </Suspense>
  );
}
