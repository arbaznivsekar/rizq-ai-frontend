'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Separator } from '@/components/ui/separator';
import { User, LogOut, Briefcase, FileText, Settings, ChevronRight, Search, LayoutDashboard } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleLogout = async () => {
    setProfileSheetOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RIZQ.AI
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search Jobs
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/applications"
                  className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
                >
                  <Briefcase className="h-4 w-4" />
                  Applications
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setProfileSheetOpen(true)}
                  aria-label="Profile menu"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden md:inline text-slate-700 font-medium text-sm">{user?.name}</span>
                </button>

                <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
                  <SheetContent side="right" className="w-[300px] sm:w-80 p-0 border-0 overflow-hidden rounded-l-3xl">
                    <VisuallyHidden><SheetTitle>Profile Menu</SheetTitle></VisuallyHidden>
                    {/* Glassmorphic top gradient */}
                    <div
                      className="px-6 pt-10 pb-7"
                      style={{
                        background: 'linear-gradient(145deg, #111111 0%, #1a1a1a 60%, #222222 100%)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                          style={{
                            background: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            borderColor: 'rgba(255,255,255,0.3)',
                          }}
                        >
                          <span className="text-[26px] font-bold text-white leading-none">
                            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold text-[17px] leading-tight truncate">{user?.name}</p>
                          <p className="text-gray-400 text-[12px] mt-0.5 truncate">{user?.email}</p>
                          {(user as any)?.phone && <p className="text-gray-400 text-[12px]">{(user as any).phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        {(user as any)?.roles?.map((role: string) => (
                          <span
                            key={role}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)', border: '1px solid rgba(255,255,255,0.3)' }}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="px-3 py-3 space-y-0.5">
                      {[
                        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', color: 'text-gray-900', bg: 'bg-gray-100' },
                        { icon: User, label: 'My Profile', href: '/profile', color: 'text-gray-900', bg: 'bg-gray-100' },
                        { icon: Briefcase, label: 'My Applications', href: '/applications', color: 'text-gray-900', bg: 'bg-gray-100' },
                        { icon: FileText, label: 'Resume', href: '/profile#resume', color: 'text-gray-900', bg: 'bg-gray-100' },
                        { icon: Settings, label: 'Settings', href: '/settings', color: 'text-gray-900', bg: 'bg-gray-100' },
                      ].map(({ icon: Icon, label, href, color, bg }) => (
                        <Link
                          key={label}
                          href={href}
                          onClick={() => setProfileSheetOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-4 w-4 ${color}`} />
                          </div>
                          <span className="text-[15px] font-medium text-slate-800 flex-1">{label}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        </Link>
                      ))}
                    </nav>

                    <div className="mx-4">
                      <Separator />
                    </div>

                    <div className="px-3 py-3">
                      <button
                        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-gray-100 transition-colors w-full text-left group"
                        onClick={handleLogout}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                          <LogOut className="h-4 w-4 text-gray-700" />
                        </div>
                        <span className="text-[15px] font-medium text-gray-700 flex-1">Sign Out</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center pb-6 pt-2">
                      Member since {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
