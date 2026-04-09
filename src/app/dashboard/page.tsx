'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboard, getQuickRecommendations, refreshRecommendations } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase, TrendingUp, CheckCircle, Clock, XCircle,
  MapPin, Building2, Loader2, ArrowRight, Sparkles,
  RefreshCw, User, Calendar, Settings, LogOut, FileText, ChevronRight,
  Check, X
} from 'lucide-react';
import CompanyLogo from '@/components/common/CompanyLogo';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { BulkApplyBar } from '@/components/jobs/BulkApplyBar';

const RECOMMENDATIONS_CACHE_KEY = 'dashboard_recommendations';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  matchScore?: number;
  matchReasons?: string[];
  logoUrl?: string;
  companyDomain?: string;
  url?: string;
}

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    location: string;
    salaryMin?: number;
    salaryMax?: number;
    url?: string;
    companyDomain?: string;
    logoUrl?: string;
  };
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });
  const [recommendations, setRecommendations] = useState<Job[]>([]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [showAllApplications, setShowAllApplications] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ai-matches');
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { selectedJobs, selectedJobsData, toggleJobSelection, clearSelection } = useJobSelection();

  const hasFetchedRecommendations = useRef(false);
  const scrollRestoreKey = 'dashboard_scroll_position';

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(scrollRestoreKey, window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !statsLoading && !recommendationsLoading && !applicationsLoading) {
      const saved = sessionStorage.getItem(scrollRestoreKey);
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
          sessionStorage.removeItem(scrollRestoreKey);
        });
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [authLoading, isAuthenticated, statsLoading, recommendationsLoading, applicationsLoading]);

  const isToday = (date: Date | string): boolean => {
    const today = new Date();
    const d = new Date(date);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const fetchDashboard = async () => {
    try {
      const response = await getDashboard();
      if (response.success && response.data) {
        if (response.data.stats) setStats(response.data.stats);
        if (response.data.recentApplications) {
          const sorted = response.data.recentApplications
            .filter((app: Application) => isToday(new Date(app.createdAt)))
            .sort((a: Application, b: Application) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRecentApplications(sorted);
        } else {
          setRecentApplications([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setStatsLoading(false);
      setApplicationsLoading(false);
    }
  };

  const fetchRecommendations = useCallback(async (skipCache = false) => {
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRATION_MS && Array.isArray(data)) {
            setRecommendations(data);
            setRecommendationsLoading(false);
            return;
          }
        }
      } catch (e) { console.warn('Cache read failed:', e); }
    }
    try {
      const response = await getQuickRecommendations();
      if (response.success && response.data?.jobs) {
        const jobs = response.data.jobs;
        setRecommendations(jobs);
        try {
          localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify({ data: jobs, timestamp: Date.now() }));
        } catch (e) { console.warn('Cache write failed:', e); }
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRATION_MS && Array.isArray(data)) {
          setRecommendations(data);
          setRecommendationsLoading(false);
          hasFetchedRecommendations.current = true;
        }
      }
    } catch (e) { console.warn('Failed to load cache:', e); }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else {
        fetchDashboard();
        if (!hasFetchedRecommendations.current) {
          fetchRecommendations();
          hasFetchedRecommendations.current = true;
        }
      }
    }
  }, [isAuthenticated, authLoading, router, fetchRecommendations]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    const interval = setInterval(() => fetchDashboard(), 5 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') fetchDashboard(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [isAuthenticated, authLoading]);

  const handleRefreshRecommendations = async () => {
    setRefreshing(true);
    setRecommendationsLoading(true);
    setRefreshKey(k => k + 1);
    try {
      await refreshRecommendations();
      await fetchRecommendations(true);
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const todayCount = recentApplications.filter(app => isToday(app.createdAt)).length;

  const matchBadgeClass = (score: number) => {
    if (score >= 70) return 'bg-black text-white border border-black';
    if (score >= 55) return 'bg-gray-200 text-gray-800 border border-gray-300';
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const statusBadgeClass = (status: string) => {
    const map: Record<string, string> = {
      Applied: 'bg-blue-100 text-blue-700 border border-blue-200',
      Interview: 'bg-violet-100 text-violet-700 border border-violet-200',
      Offer: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      Rejected: 'bg-red-100 text-red-600 border border-red-200',
    };
    return map[status] ?? map.Applied;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/20">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-[15px] text-slate-500 font-medium">Setting up your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7]">

      {/* ─────────────────────────────────────────
          Original Header — untouched
      ───────────────────────────────────────── */}
      <Header />

      {/* ─────────────────────────────────────────
          Profile / Navigation Sheet
      ───────────────────────────────────────── */}
      <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-80 p-0 border-0 overflow-hidden rounded-l-3xl">
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
                {user?.phone && <p className="text-gray-400 text-[12px]">{user.phone}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {user?.roles?.map(role => (
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
              onClick={() => { setProfileSheetOpen(false); router.push('/auth/logout'); }}
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

      {/* ─────────────────────────────────────────
          Page Content
      ───────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-2xl pt-5 pb-28 md:pb-10 space-y-4">

        {/* ── Hero Welcome Card (Glassmorphic) ── */}
        <div
          className="relative overflow-hidden rounded-[28px] p-6"
          style={{
            background: 'linear-gradient(145deg,rgb(31, 31, 32) 0%,rgb(31, 31, 32) 55%,rgb(12, 13, 13) 100%)',
            boxShadow: '0 10px 40px rgba(9, 9, 9, 0.3), 0 2px 8px rgba(11, 11, 11, 0.15)',
          }}
        >
          {/* Decorative orbs */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 right-8 w-20 h-20 rounded-full bg-white/5 blur-xl pointer-events-none" />

          <div className="relative z-10">
            {/* Name row */}
            <div>
              <p className="text-gray-400 text-[12px] font-semibold uppercase tracking-widest mb-1">Welcome back</p>
              <h1 className="text-white text-[24px] font-extrabold leading-tight tracking-tight">
                {user?.name}
              </h1>
            </div>

            {/* Email */}
            <p className="text-gray-400 text-[13px] mt-1 truncate">{user?.email}</p>

            {/* ── Stats pills ── */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                { label: 'Total Apps', value: stats.totalApplications, icon: Briefcase },
                { label: 'Pending', value: stats.pendingApplications, icon: Clock },
                { label: 'Today', value: todayCount, icon: Calendar },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl p-3.5"
                  style={{
                    background: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.22)',
                  }}
                >
                  <Icon className="h-4 w-4 text-gray-400 mb-2.5" />
                  {statsLoading
                    ? <Skeleton className="h-7 w-8 bg-white/25 rounded-lg mb-1" />
                    : <p className="text-white text-[26px] font-extrabold leading-none tabular-nums">{value}</p>
                  }
                  <p className="text-gray-400 text-[11px] font-semibold mt-2 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Gmail pill */}
            {user?.gmailConnectedAt && (
              <div
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gmail Connected
              </div>
            )}
          </div>
        </div>

        {/* ── Selected Jobs Banner ── */}
        {selectedJobs.size > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-[10px] font-black leading-none">{selectedJobs.size}</span>
                </div>
                <span className="text-[13px] font-bold text-gray-900">
                  {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected for apply
                </span>
              </div>
              <button
                onClick={clearSelection}
                className="text-[12px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
              >
                Clear all
              </button>
            </div>
            {/* Job list */}
            <div className="divide-y divide-gray-50">
              {Array.from(selectedJobsData.values()).map(job => (
                <div key={job._id} className="flex items-center gap-3 px-4 py-3">
                  <CompanyLogo
                    name={job.company}
                    logoUrl={job.logoUrl}
                    domain={job.companyDomain || job.url}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-[11px] text-gray-500 truncate">{job.company} · {job.location}</p>
                  </div>
                  <button
                    onClick={() => toggleJobSelection(job._id)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
                    aria-label="Remove job"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
            {/* Footer hint */}
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400 font-medium">
                Tap "One-Click Apply to All" at the bottom to start applying
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab switcher — glassmorphic pill */}
          <TabsList
            className="w-full h-12 rounded-2xl p-1.5 grid grid-cols-3"
            style={{
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.55)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <TabsTrigger
              value="ai-matches"
              className="rounded-xl text-[12px] font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              AI Matches
            </TabsTrigger>
            <TabsTrigger
              value="recent-applications"
              className="rounded-xl text-[12px] font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all"
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Recent
              {recentApplications.length > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-black text-white text-[9px] font-black flex items-center justify-center px-1 leading-none">
                  {recentApplications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="all-applications"
              className="rounded-xl text-[12px] font-bold gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-black transition-all"
            >
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              All Apps
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════
              TAB 1 — AI MATCHES
          ═══════════════════════════════════ */}
          <TabsContent value="ai-matches" className="mt-4 space-y-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">AI Recommendations</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Personalized to your profile</p>
              </div>
              <button
                onClick={handleRefreshRecommendations}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-[13px] font-bold text-black px-3 py-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {recommendationsLoading ? (
              <div key={refreshKey} className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
                    <div className="flex justify-between items-start mb-3">
                      <Skeleton className="h-5 w-3/5 rounded-lg" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-2/5 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-1/2 rounded-lg mb-4" />
                    <Skeleton className="h-px w-full mb-3" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <User className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-[16px] mb-1">No Matches Yet</h3>
                <p className="text-slate-500 text-[13px] mb-5 max-w-[260px] mx-auto">
                  {(user as any)?.skills?.length > 0
                    ? 'No matching jobs found. Try refreshing AI matches.'
                    : 'Complete your profile to unlock personalized recommendations.'}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" className="rounded-xl h-9" asChild>
                    <Link href="/profile">Complete Profile</Link>
                  </Button>
                  <Button size="sm" className="rounded-xl h-9" asChild>
                    <Link href="/">Browse Jobs</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div key={refreshKey} className="space-y-3">
                {recommendations.map((job) => (
                  <div
                    key={job._id}
                    className={`relative rounded-2xl transition-all ${selectedJobs.has(job._id) ? 'ring-2 ring-black' : ''}`}
                  >
                    {selectedJobs.has(job._id) && (
                      <div className="absolute top-3 right-3 z-10 w-5 h-5 bg-black rounded-full flex items-center justify-center pointer-events-none">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  <Link
                    href={`/jobs/${job._id}?from=dashboard`}
                    className="block bg-white rounded-2xl p-4 border border-white/80 shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99] duration-150"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                  >
                    {/* Title + Match */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-bold text-[15px] text-slate-900 leading-snug flex-1">
                        {job.title}
                      </h3>
                      {job.matchScore && (
                        <span className={`shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${matchBadgeClass(job.matchScore)}`}>
                          {job.matchScore}% match
                        </span>
                      )}
                    </div>

                    {/* Company + Location */}
                    <div className="flex items-center gap-3 text-[13px] text-slate-500 mb-2.5 flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <CompanyLogo name={job.company} logoUrl={job.logoUrl} domain={job.companyDomain || job.url} size={18} />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </span>
                    </div>

                    {/* Match reasons */}
                    {job.matchReasons && job.matchReasons.length > 0 && (
                      <div className="flex gap-3 mb-2.5">
                        {job.matchReasons.slice(0, 2).map((r, i) => (
                          <span key={i} className="text-[11px] text-slate-500 flex items-center gap-0.5">
                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                            {r}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer: salary + CTA */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-800">
                        {job.salaryMin && job.salaryMax
                          ? `₹${(job.salaryMin / 100000).toFixed(0)}–${(job.salaryMax / 100000).toFixed(0)} LPA`
                          : <span className="text-slate-400 font-normal">Salary not listed</span>
                        }
                      </span>
                      <span className="text-[12px] font-bold text-black flex items-center gap-1">
                        Quick Apply <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                  </div>
                ))}

                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold text-black bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                >
                  Browse All Jobs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════
              TAB 2 — RECENT APPLICATIONS
          ═══════════════════════════════════ */}
          <TabsContent value="recent-applications" className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Today's Applications</h2>
                <p className="text-[12px] text-slate-500 mt-0.5">Jobs applied to today</p>
              </div>
              <button
                onClick={() => { setApplicationsLoading(true); fetchDashboard(); }}
                disabled={applicationsLoading}
                className="flex items-center gap-1.5 text-[13px] font-bold text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${applicationsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {applicationsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-white/80">
                    <Skeleton className="h-5 w-3/4 rounded-lg mb-2.5" />
                    <Skeleton className="h-4 w-1/2 rounded-lg mb-4" />
                    <Skeleton className="h-px w-full mb-3" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(255,255,255,0.70)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-7 w-7 text-slate-300" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-[16px] mb-1">No applications today</h3>
                <p className="text-[13px] text-slate-500 mb-5">Start applying and track your progress here</p>
                <Button size="sm" className="rounded-xl h-9" asChild>
                  <Link href="/">Browse Jobs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(showAllApplications ? recentApplications : recentApplications.slice(0, 5))
                  .filter(app => app.jobId && (app.jobId._id || app.jobId))
                  .map((application) => {
                    const appliedDate = new Date(application.createdAt);
                    const jobId = application.jobId?._id || application.jobId;
                    return (
                      <Link
                        key={application._id}
                        href={`/jobs/${jobId}?from=dashboard`}
                        className="block bg-white rounded-2xl p-4 border border-white/80 shadow-sm hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99] duration-150"
                        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <h3 className="font-bold text-[15px] text-slate-900 leading-snug flex-1">
                            {application.jobId?.title ?? 'Job Title'}
                          </h3>
                          <span className={`shrink-0 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${statusBadgeClass(application.status)}`}>
                            {application.status === 'Applied' ? 'Pending' : application.status}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[13px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-medium text-slate-700">{application.jobId?.company ?? 'Company'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{application.jobId?.location ?? 'Location'}</span>
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[12px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {isToday(appliedDate) ? 'Applied today' : `Applied ${appliedDate.toLocaleDateString()}`}
                          </span>
                          <span className="text-[12px] font-bold text-black flex items-center gap-1">
                            View Status <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                {recentApplications.length > 5 && (
                  <button
                    onClick={() => setShowAllApplications(!showAllApplications)}
                    className="w-full py-3.5 rounded-2xl text-[14px] font-bold text-black bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {showAllApplications ? 'Show Less' : `Show All ${recentApplications.length} Applications`}
                    <ArrowRight className={`h-4 w-4 transition-transform ${showAllApplications ? 'rotate-90' : '-rotate-90'}`} />
                  </button>
                )}

                <Link
                  href="/applications"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold text-slate-600 bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-sm"
                >
                  View All Applications <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════
              TAB 3 — ALL APPLICATIONS
          ═══════════════════════════════════ */}
          <TabsContent value="all-applications" className="mt-4 space-y-3">
            <div>
              <h2 className="text-[17px] font-extrabold text-slate-900 tracking-tight">Application Stats</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Your complete job search overview</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total', value: stats.totalApplications, icon: Briefcase, iconColor: 'text-blue-500', bg: 'bg-blue-50', numColor: 'text-blue-900', sub: 'All time' },
                { label: 'Pending', value: stats.pendingApplications, icon: Clock, iconColor: 'text-amber-500', bg: 'bg-amber-50', numColor: 'text-amber-800', sub: 'Awaiting reply' },
                { label: 'Accepted', value: stats.acceptedApplications, icon: CheckCircle, iconColor: 'text-emerald-600', bg: 'bg-emerald-50', numColor: 'text-emerald-700', sub: 'Successful' },
                { label: 'Rejected', value: stats.rejectedApplications, icon: XCircle, iconColor: 'text-red-400', bg: 'bg-red-50', numColor: 'text-red-600', sub: 'Keep going!' },
              ].map(({ label, value, icon: Icon, iconColor, bg, numColor, sub }) => (
                <div
                  key={label}
                  className={`${bg} rounded-2xl p-4 border border-white shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  {statsLoading
                    ? <Skeleton className="h-9 w-14 rounded-xl" />
                    : <p className={`text-[32px] font-extrabold ${numColor} leading-none tabular-nums`}>{value}</p>
                  }
                  <p className="text-[11px] text-slate-400 mt-2">{sub}</p>
                </div>
              ))}
            </div>

            <Link
              href="/applications"
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[14px] font-bold text-black bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
            >
              View Full History <ArrowRight className="h-4 w-4" />
            </Link>
          </TabsContent>
        </Tabs>

        {/* ── Quick Actions ── */}
        <div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: TrendingUp, label: 'Search Jobs', href: '/', iconColor: 'text-black', bg: 'bg-gray-100' },
              { icon: Briefcase, label: 'Applications', href: '/applications', iconColor: 'text-black', bg: 'bg-gray-100' },
              { icon: User, label: 'My Profile', href: '/profile', iconColor: 'text-black', bg: 'bg-gray-100' },
            ].map(({ icon: Icon, label, href, iconColor, bg }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2.5 p-4 bg-white rounded-2xl shadow-sm border border-white/80 hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.97] duration-150"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <span className="text-[12px] font-bold text-slate-700 text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky CTA (hidden when jobs are selected to avoid bar conflict) ── */}
      {selectedJobs.size === 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 md:hidden z-30 px-4 pb-6 pt-4"
          style={{ background: 'linear-gradient(to top, #f2f2f7 65%, rgba(242,242,247,0))' }}
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full h-13 py-3.5 rounded-2xl text-[15px] font-extrabold text-white transition-all active:scale-[0.98] duration-100 bg-black"
            style={{
              boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            }}
          >
            Browse All Jobs
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}

      {/* ── BulkApplyBar — manages selected jobs apply workflow ── */}
      <BulkApplyBar jobs={Array.from(selectedJobsData.values())} />
    </div>
  );
}