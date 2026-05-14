import AuthForm from '@/app/components/auth/AuthForm';
import { Suspense } from 'react';

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ backgroundColor: '#FFF9F0', paddingTop: 80 }}>
      <div className="w-full max-w-md rounded-3xl p-8" style={{ backgroundColor: '#fff', boxShadow: '0 20px 60px rgba(15,15,35,0.12)' }}>
        <h1 className="font-bold mb-2" style={{ fontSize: '2rem', color: '#1A1A2E' }}>Sign in</h1>
        <p className="mb-6" style={{ color: '#64748B' }}>
          Access your prepaid wallet and saved agent workspace.
        </p>
        <Suspense fallback={<div>Loading sign in...</div>}>
          <AuthForm mode="signin" />
        </Suspense>
      </div>
    </div>
  );
}
