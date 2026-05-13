'use client';

import { useCallback, useEffect, useState } from 'react';

export interface WalletState {
  user: {
    userId: string;
    isGuest: boolean;
    databaseBacked: boolean;
  };
  wallet: {
    balanceMicrocredits: string;
    databaseBacked: boolean;
  };
}

function formatMicrocredits(value: string): string {
  return `$${(Number(value) / 1_000_000).toFixed(2)}`;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWallet({ user: data.user, wallet: data.wallet });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    wallet,
    loading,
    error,
    refresh,
    formattedBalance: wallet ? formatMicrocredits(wallet.wallet.balanceMicrocredits) : '$0.00',
  };
}
