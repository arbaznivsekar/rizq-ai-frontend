'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getApplications } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, MapPin, Building2, Calendar, Loader2,
  CheckCircle, Clock, XCircle, FileText, LayoutDashboard
} from 'lucide-react';

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

export default function ApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const scrollRestoreKey = 'applications_scroll_position';

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
    if (!authLoading && isAuthenticated && !loading) {
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
  }, [authLoading, isAuthenticated, loading]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      } else {
        // Fetch immediately when authenticated
        setLoading(true);
        fetchApplications();
      }
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchApplications = async () => {
    try {
      const response = await getApplications();
      if (response.success && response.data) {
        // Filter out applications where jobId is null (job was deleted)
        const validApplications = (response.data || []).filter((app: Application) => 
          app.jobId && (app.jobId._id || app.jobId)
        );
        setApplications(validApplications);
      } else if (response.items) {
        // Handle both response formats
        const validApplications = (response.items || []).filter((app: Application) => 
          app.jobId && (app.jobId._id || app.jobId)
        );
        setApplications(validApplications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map backend status to frontend display status
  const mapStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'Applied': 'pending',
      'Interview': 'pending',
      'Offer': 'accepted',
      'Rejected': 'rejected',
    };
    return statusMap[status] || status.toLowerCase();
  };

  const getStatusIcon = (status: string) => {
    const displayStatus = mapStatus(status);
    switch (displayStatus) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const displayStatus = mapStatus(status);
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      pending: 'secondary',
      accepted: 'default',
      rejected: 'destructive',
    };
    return (
      <Badge variant={variants[displayStatus] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true;
    const displayStatus = mapStatus(app.status);
    return displayStatus === filter;
  });

  // Only show full loading during initial auth check
  // Allow progressive loading for data
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back to Dashboard Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')} 
          className="mb-6"
        >
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Applications</h1>
          <p className="text-slate-600">
            Track and manage all your job applications in one place
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-8 w-8 text-blue-600" />
                <div>
                  {loading ? (
                    <div className="h-8 w-12 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold">{applications.length}</p>
                  )}
                  <p className="text-sm text-slate-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  {loading ? (
                    <div className="h-8 w-12 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-orange-600">
                      {applications.filter((a) => a.status === 'Applied' || a.status === 'Interview').length}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  {loading ? (
                    <div className="h-8 w-12 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      {applications.filter((a) => a.status === 'Offer').length}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  {loading ? (
                    <div className="h-8 w-12 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-bold text-red-600">
                      {applications.filter((a) => a.status === 'Rejected').length}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <Card>
          <CardHeader>
            <CardTitle>All Applications</CardTitle>
            <CardDescription>
              Filter and view your application history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending ({applications.filter((a) => a.status === 'Applied' || a.status === 'Interview').length})</TabsTrigger>
                <TabsTrigger value="accepted">Accepted ({applications.filter((a) => a.status === 'Offer').length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({applications.filter((a) => a.status === 'Rejected').length})</TabsTrigger>
              </TabsList>

              <TabsContent value={filter}>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4 animate-pulse">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="h-6 bg-slate-200 rounded w-3/4" />
                            <div className="h-4 bg-slate-200 rounded w-1/2" />
                            <div className="h-4 bg-slate-200 rounded w-2/3" />
                          </div>
                          <div className="flex gap-3">
                            <div className="h-6 w-20 bg-slate-200 rounded" />
                            <div className="h-9 w-24 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                      No applications yet
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Start applying to jobs and track your progress here
                    </p>
                    <Button asChild>
                      <Link href="/">Browse Jobs</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application) => (
                      <div
                        key={application._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-2">
                              {getStatusIcon(application.status)}
                              <div>
                                <Link
                                  href={`/jobs/${application.jobId?._id || application.jobId}?from=applications`}
                                  className="font-semibold text-lg hover:text-blue-600 transition-colors"
                                >
                                  {application.jobId?.title || 'Job Title'}
                                </Link>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 text-sm text-slate-600">
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
                                    Applied {new Date(application.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(application.status)}
                            {application.jobId && (application.jobId._id || application.jobId) ? (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/jobs/${application.jobId._id || application.jobId}?from=applications`}>
                                  View Job
                                </Link>
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Job Deleted
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




























