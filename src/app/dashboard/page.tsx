'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboard, getQuickRecommendations, refreshRecommendations } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, TrendingUp, CheckCircle, Clock, XCircle,
  MapPin, Building2, Loader2, ArrowRight, Sparkles, RefreshCw, User, Calendar
} from 'lucide-react';
import CompanyLogo from '@/components/common/CompanyLogo';

// Cache key and expiration (5 minutes)
const RECOMMENDATIONS_CACHE_KEY = 'dashboard_recommendations';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

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
  const hasFetchedRecommendations = useRef(false);
  const scrollRestoreKey = 'dashboard_scroll_position';

  // Scroll restoration: Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(scrollRestoreKey, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll restoration: Restore scroll position on mount
  useEffect(() => {
    if (!authLoading && isAuthenticated && !statsLoading && !recommendationsLoading && !applicationsLoading) {
      const savedScrollPosition = sessionStorage.getItem(scrollRestoreKey);
      if (savedScrollPosition) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
          // Clear the saved position after restoring
          sessionStorage.removeItem(scrollRestoreKey);
        });
      } else {
        // Scroll to top on first load
        window.scrollTo(0, 0);
      }
    }
  }, [authLoading, isAuthenticated, statsLoading, recommendationsLoading, applicationsLoading]);

  // Helper function to check if a date is today
  const isToday = (date: Date | string): boolean => {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };

  const fetchDashboard = async () => {
    try {
      const response = await getDashboard();
      console.log('Dashboard API response:', response);
      if (response.success && response.data) {
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        if (response.data.recentApplications) {
          console.log('Recent applications received:', response.data.recentApplications);
          // Filter to only show today's applications
          const todayApplications = response.data.recentApplications.filter((app: Application) => {
            return isToday(new Date(app.createdAt));
          });
          
          // Sort by date (newest first)
          const sorted = todayApplications.sort((a: Application, b: Application) => {
            const aDate = new Date(a.createdAt);
            const bDate = new Date(b.createdAt);
            return bDate.getTime() - aDate.getTime();
          });
          setRecentApplications(sorted);
        } else {
          console.log('No recentApplications in response');
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
    // Check cache first unless explicitly skipping
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const now = Date.now();
          // Use cache if it's less than 5 minutes old
          if (now - timestamp < CACHE_EXPIRATION_MS && Array.isArray(data)) {
            setRecommendations(data);
            setRecommendationsLoading(false);
            return; // Don't fetch from API
          }
        }
      } catch (error) {
        // Continue to fetch from API if cache read fails
        console.warn('Cache read failed, fetching from API:', error);
      }
    }

    // Fetch from API
    try {
      const response = await getQuickRecommendations();
      
      if (response.success && response.data?.jobs) {
        const jobs = response.data.jobs;
        setRecommendations(jobs);
        
        // Cache the recommendations
        try {
          const cacheData = {
            data: jobs,
            timestamp: Date.now()
          };
          localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
          console.warn('Failed to cache recommendations:', error);
        }
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

  // Load recommendations from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        // Use cache if it's less than 5 minutes old
        if (now - timestamp < CACHE_EXPIRATION_MS && Array.isArray(data)) {
          setRecommendations(data);
          setRecommendationsLoading(false);
          hasFetchedRecommendations.current = true;
        }
      }
    } catch (error) {
      // Ignore cache errors
      console.warn('Failed to load recommendations from cache:', error);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else {
        // Fetch dashboard stats immediately
        fetchDashboard();
        
        // Only fetch recommendations if not already fetched or cached
        if (!hasFetchedRecommendations.current) {
          fetchRecommendations();
          hasFetchedRecommendations.current = true;
        }
      }
    }
  }, [isAuthenticated, authLoading, router, fetchRecommendations]);

  // Auto-refresh applications every 5 minutes and on page visibility change
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    // Refresh interval (5 minutes)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard applications...');
      fetchDashboard();
    }, 5 * 60 * 1000); // 5 minutes

    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page visible, refreshing dashboard...');
        fetchDashboard();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, authLoading]);

  const handleRefreshRecommendations = async () => {
    setRefreshing(true);
    setRecommendationsLoading(true);
    try {
      await refreshRecommendations();
      // Skip cache and force fresh fetch
      await fetchRecommendations(true);
    } catch (error) {
      console.error('Failed to refresh recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Show loading only during initial auth check, not during data fetch
  // This allows progressive loading - show page structure immediately
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-slate-600">Setting up your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-600">
            Here's your job search activity and personalized recommendations
          </p>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{user?.name}</h3>
                <p className="text-slate-600 mb-1">{user?.email}</p>
                {user?.phone && (
                  <p className="text-slate-600 mb-1">{user.phone}</p>
                )}
                <div className="flex gap-2 mt-3">
                  {user?.roles?.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right">
                {user?.gmailConnectedAt && (
                  <div className="text-sm text-green-600 mb-2">
                   Welcome to RIZQ.AI dashboard.
                  </div>
                )}
                <div className="text-sm text-slate-500">
                  Member since {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Briefcase className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-10 w-20 bg-slate-200 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold">{stats.totalApplications}</div>
              )}
              <p className="text-xs text-slate-600 mt-1">
                All time applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-10 w-20 bg-slate-200 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold text-orange-600">
                  {stats.pendingApplications}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-1">
                Awaiting response
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Accepted
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-10 w-20 bg-slate-200 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  {stats.acceptedApplications}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-1">
                Successful applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rejected
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="h-10 w-20 bg-slate-200 animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  {stats.rejectedApplications}
                </div>
              )}
              <p className="text-xs text-slate-600 mt-1">
                Keep applying!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>
                      Your job applications from today {recentApplications.length > 0 && (
                        <span className="text-blue-600 font-medium">
                          • {recentApplications.length} application{recentApplications.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {recentApplications.length > 5 && !showAllApplications && (
                        <span className="text-slate-500">
                          {' '}(showing 5 of {recentApplications.length})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setApplicationsLoading(true);
                      fetchDashboard();
                    }}
                    disabled={applicationsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${applicationsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/applications">
                      View All
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : recentApplications.length > 0 ? (
                <div className="space-y-3">
                  {(showAllApplications ? recentApplications : recentApplications.slice(0, 5))
                    .filter((application) => application.jobId && (application.jobId._id || application.jobId))
                    .map((application) => {
                    const appliedDate = new Date(application.createdAt);
                    const isApplicationToday = isToday(appliedDate);
                    const jobId = application.jobId?._id || application.jobId;
                    
                    return (
                      <Link
                        key={application._id}
                        href={`/jobs/${jobId}?from=dashboard`}
                        className={`block border rounded-lg p-4 hover:shadow-md transition-shadow ${
                          isApplicationToday ? 'border-blue-300 bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-lg hover:text-blue-600">
                                {application.jobId?.title || 'Job Title'}
                              </h3>
                              {isApplicationToday && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  Today
                                </Badge>
                              )}
                              <Badge 
                                variant={
                                  application.status === 'Offer' ? 'default' :
                                  application.status === 'Rejected' ? 'destructive' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {application.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {application.jobId?.company || 'Company'}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {application.jobId?.location || 'Location'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {isApplicationToday 
                                  ? 'Today' 
                                  : appliedDate.toLocaleDateString()
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {recentApplications.length > 5 && (
                    <div className="pt-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllApplications(!showAllApplications)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {showAllApplications ? (
                          <>
                            Show Less
                            <ArrowRight className="h-4 w-4 ml-2 rotate-90" />
                          </>
                        ) : (
                          <>
                            Show All {recentApplications.length} Applications
                            <ArrowRight className="h-4 w-4 ml-2 -rotate-90" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 mb-2">No applications today</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Start applying to jobs today and track your progress here
                  </p>
                  <Button asChild>
                    <Link href="/">
                      Browse Jobs
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Recommended Jobs - Moved before Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>AI-Powered Recommendations</CardTitle>
                  <CardDescription>
                    Personalized matches based on your profile
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshRecommendations}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">
                    View all
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recommendationsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-slate-200 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 rounded w-1/2" />
                        <div className="h-4 bg-slate-200 rounded w-2/3" />
                      </div>
                      <div className="h-8 w-24 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Jobs Found</h3>
                <p className="text-slate-600 mb-4">
                  {(user as any)?.skills?.length > 0 
                    ? "No matching jobs found. Try adjusting your filters or checking back later."
                    : "Complete your profile to get personalized job recommendations!"}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/profile">Complete Profile</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/">Browse All Jobs</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((job) => (
                  <Link
                    key={job._id}
                    href={`/jobs/${job._id}?from=dashboard`}
                    className="block border rounded-lg p-4 hover:shadow-lg hover:border-purple-300 transition-all group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-purple-600 transition-colors">
                            {job.title}
                          </h3>
                          {job.matchScore && (
                            <Badge 
                              variant={job.matchScore >= 70 ? "default" : "secondary"}
                              className={job.matchScore >= 70 ? "bg-green-500" : ""}
                            >
                              {job.matchScore}% Match
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-2">
                            <CompanyLogo
                              name={job.company}
                              logoUrl={(job as any).logoUrl}
                              domain={(job as any).companyDomain || (job as any).url}
                              size={58}
                            />
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.company}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                        </div>
                        {job.matchReasons && job.matchReasons.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {job.matchReasons.slice(0, 2).map((reason, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {job.salaryMin && job.salaryMax && (
                        <Badge variant="secondary" className="shrink-0">
                          ₹{(job.salaryMin / 100000).toFixed(1)}-
                          {(job.salaryMax / 100000).toFixed(1)} LPA
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions - Moved after Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your job search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/" className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Search Jobs</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/applications" className="flex flex-col items-center gap-2">
                  <Briefcase className="h-6 w-6" />
                  <span>My Applications</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4">
                <Link href="/profile" className="flex flex-col items-center gap-2">
                  <CheckCircle className="h-6 w-6" />
                  <span>Update Profile</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


















