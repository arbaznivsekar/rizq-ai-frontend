'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGmail, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleGmailLogin = () => {
    loginWithGmail();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center space-y-2">
          <Link href="/" className="group">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
              RIZQ.AI
            </h1>
          </Link>
          <p className="text-sm text-slate-500">AI-Powered Job Application Assistant</p>
        </div>

        {/* Main Card */}
        <Card className="border-slate-200 shadow-xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-slate-900">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-base text-slate-600">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Gmail Sign In Section */}
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-600">
                Sign in with your Gmail account to access RIZQ.AI
              </p>

              <Button
                onClick={handleGmailLogin}
                size="lg"
                className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Gmail
              </Button>
            </div>

            <Separator className="my-6" />

            {/* Privacy Notice - Sincere and Transparent */}
            <Alert className="bg-slate-50 border-slate-200">
              <Shield className="h-4 w-4 text-slate-700" />
              <AlertDescription className="text-sm text-slate-700 leading-relaxed space-y-2">
                <p className="font-medium text-slate-900">Your privacy matters to us</p>
                <p>
                  We use secure OAuth 2.0 to connect with your Gmail. We'll never store your password or access your personal emails.
                </p>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    By continuing, you agree to our{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* What We'll Use Your Gmail For */}
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-slate-700">What we'll use your Gmail for:</p>
              <p className="text-xs text-slate-600">
                Sending personalized job applications on your behalf
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
















