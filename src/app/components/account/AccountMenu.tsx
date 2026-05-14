'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useWallet } from '@/app/hooks/useWallet';

export default function AccountMenu() {
  const { data: session, status } = useSession();
  const { wallet, formattedBalance, loading, refresh } = useWallet();
  const [open, setOpen] = useState(false);

  const signedIn = status === 'authenticated' && !!session?.user?.email;
  const isAdmin = session?.user?.role === 'admin';
  const label = loading ? 'Account...' : signedIn ? formattedBalance : `Guest ${formattedBalance}`;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-full px-3 py-2 text-xs font-bold transition-all"
        style={{
          fontFamily: "'Space Mono', monospace",
          color: '#fff',
          backgroundColor: signedIn ? 'rgba(34,197,94,0.22)' : 'rgba(15, 15, 35, 0.65)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-xl"
          style={{
            backgroundColor: 'rgba(15, 15, 35, 0.96)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#fff',
          }}
        >
          <div className="mb-3">
            <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
              {signedIn ? session.user?.email : 'Guest demo mode'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formattedBalance}</div>
            <div className="mt-1" style={{ fontSize: '0.75rem', color: wallet?.user.databaseBacked ? '#86EFAC' : '#FCD34D' }}>
              {wallet?.user.databaseBacked ? 'Paid wallet-backed account' : 'Demo only - sign in to buy credits'}
            </div>
          </div>

          <div className="grid gap-2">
            <Link href="/wallet" className="rounded-xl px-3 py-2 text-sm font-bold no-underline" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}>
              Wallet & history
            </Link>
            {isAdmin && (
              <Link href="/admin" className="rounded-xl px-3 py-2 text-sm font-bold no-underline" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                Admin
              </Link>
            )}
            {!signedIn ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/signin" className="rounded-xl px-3 py-2 text-sm font-bold text-center no-underline" style={{ backgroundColor: '#fff', color: '#0F0F23' }}>
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-xl px-3 py-2 text-sm font-bold text-center no-underline" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}>
                  Sign up
                </Link>
              </div>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-xl px-3 py-2 text-sm font-bold text-left"
                style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: '#fff' }}
              >
                Sign out
              </button>
            )}
            <button onClick={refresh} className="text-xs underline text-left" style={{ color: '#CBD5E1' }}>
              Refresh balance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
