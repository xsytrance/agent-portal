import AuthForm from '@/app/components/auth/AuthForm';
import { Suspense } from 'react';

export default function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ backgroundColor: '#FFF9F0', paddingTop: 80 }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(15,15,35,0.12)' }}>
        <h1 className="font-bold mb-2" style={{ fontSize: '2rem', color: '#1A1A2E' }}>Create account</h1>
        <p className="mb-6" style={{ color: '#64748B' }}>
          Start with a wallet-backed account. Credits are prepaid usage credits, not unlimited subscription access.
        </p>
        <Suspense fallback={<div>Loading sign up...</div>}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
