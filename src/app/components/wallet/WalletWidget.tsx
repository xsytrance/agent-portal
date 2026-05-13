'use client';

import { useState } from 'react';
import { useWallet } from '@/app/hooks/useWallet';

const packs = [5, 10, 20, 50];

export default function WalletWidget() {
  const { wallet, loading, error, formattedBalance, refresh } = useWallet();
  const [open, setOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

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
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || `Checkout failed with HTTP ${res.status}`);
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout unavailable');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-full px-3 py-2 text-xs font-bold transition-all"
        style={{
          fontFamily: "'Space Mono', monospace",
          color: '#fff',
          backgroundColor: 'rgba(15, 15, 35, 0.65)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {loading ? 'Wallet...' : `${wallet?.user.isGuest ? 'Guest' : 'Wallet'} ${formattedBalance}`}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl p-4 shadow-xl"
          style={{
            backgroundColor: 'rgba(15, 15, 35, 0.96)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff',
          }}
        >
          <div className="mb-3">
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
              {wallet?.user.isGuest ? 'Guest demo wallet' : 'Account wallet'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formattedBalance}</div>
            {!wallet?.wallet.databaseBacked && (
              <div className="mt-2 rounded-lg p-2" style={{ backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.75rem' }}>
                Database not configured. Purchases are disabled in demo fallback.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {packs.map((dollars) => (
              <button
                key={dollars}
                onClick={() => startCheckout(dollars)}
                disabled={checkoutLoading !== null}
                className="rounded-xl px-3 py-2 text-sm font-bold"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.16)',
                  opacity: checkoutLoading !== null ? 0.6 : 1,
                }}
              >
                {checkoutLoading === dollars ? '...' : `Buy $${dollars}`}
              </button>
            ))}
          </div>

          {checkoutError && (
            <div className="mt-3 rounded-lg p-2" style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: '#FCA5A5', fontSize: '0.75rem' }}>
              {checkoutError}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-lg p-2" style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: '#FCA5A5', fontSize: '0.75rem' }}>
              Wallet error: {error}
            </div>
          )}

          <button
            onClick={refresh}
            className="mt-3 text-xs underline"
            style={{ color: '#CBD5E1' }}
          >
            Refresh balance
          </button>
        </div>
      )}
    </div>
  );
}
