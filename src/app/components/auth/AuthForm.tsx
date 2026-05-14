'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const callbackUrl = params.get('callbackUrl') || '/wallet';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `Signup failed with HTTP ${res.status}`);
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) throw new Error('Invalid email or password');
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === 'signup' && (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-xl px-4 py-3"
          style={{ border: '1px solid #CBD5E1' }}
        />
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        className="w-full rounded-xl px-4 py-3"
        style={{ border: '1px solid #CBD5E1' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
        className="w-full rounded-xl px-4 py-3"
        style={{ border: '1px solid #CBD5E1' }}
      />
      {error && <div className="rounded-xl p-3" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>{error}</div>}
      <button
        disabled={loading}
        className="w-full rounded-xl px-4 py-3 font-bold"
        style={{ backgroundColor: '#1A1A2E', color: '#fff', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>
      <p style={{ color: '#64748B' }}>
        {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link href={mode === 'signup' ? '/signin' : '/signup'} style={{ color: '#1A1A2E', fontWeight: 700 }}>
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </form>
  );
}
