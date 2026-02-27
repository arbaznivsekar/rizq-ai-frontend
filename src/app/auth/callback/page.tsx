'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? '/dashboard' : '/auth/login');
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-lg p-8">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
          <h1 className="text-xl font-semibold text-slate-900">Signing you in…</h1>
          <p className="text-sm text-slate-600 mt-2">
            Completing authentication and preparing your dashboard.
          </p>

          <div className="mt-6 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.replace('/auth/login')}
            >
              Back to login
            </Button>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            If this screen doesn’t redirect, try refreshing or{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 underline">
              sign in again
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

