'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getJob, checkApplicationEligibility } from '@/lib/api';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { BulkApplyBar } from '@/components/jobs/BulkApplyBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, MapPin, Calendar, Briefcase, 
  ArrowLeft, Loader2, LayoutDashboard, CheckCircle2, Clock
} from 'lucide-react';
import { CompanyLogo } from '@/components/common/CompanyLogo';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string;
  url: string;
  postedAt?: string;
  source?: string;
  companyDomain?: string;
  logoUrl?: string;
  logoSrcSet?: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedJobs, toggleJobSelection } = useJobSelection();
  const { isAuthenticated } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<{
    hasApplied: boolean;
    canReapply: boolean;
    daysUntilReapply?: number;
    lastAppliedAt?: string;
  } | null>(null);
  const scrollRestoreKey = `job_details_scroll_${params.id}`;

  // Check if user came from dashboard or applications page
  const fromDashboard = searchParams.get('from') === 'dashboard';
  const fromApplications = searchParams.get('from') === 'applications';

  // Scroll restoration: Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(scrollRestoreKey, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollRestoreKey]);

  // Scroll restoration: Restore scroll position on mount
  useEffect(() => {
    if (!loading && job) {
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
  }, [loading, job, scrollRestoreKey]);

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string);
    }
  }, [params.id]);

  const fetchJob = async (jobId: string) => {
    try {
      const response = await getJob(jobId);
      if (response.success && response.data.job) {
        setJob(response.data.job);
        
        // Check application eligibility if user is authenticated
        if (isAuthenticated) {
          checkEligibility(jobId);
        }
      } else {
        setError('Job not found');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('Failed to fetch job:', err);
      setError(error.response?.data?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (jobId: string) => {
    try {
      const response = await checkApplicationEligibility([jobId]);
      if (response.success && response.data[jobId]) {
        setApplicationStatus(response.data[jobId]);
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      // Don't block the UI if eligibility check fails
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Job not found</h2>
              <p className="text-slate-600 mb-6 font-bold">Please sign in first to view job details.</p>
              <Button onClick={() => {
                // Navigate based on where user came from
                if (fromDashboard) {
                  router.push('/dashboard');
                } else if (fromApplications) {
                  router.push('/applications');
                } else {
                  // Check if we have saved search state
                  const savedState = sessionStorage.getItem('paginationState');
                  if (savedState) {
                    try {
                      const paginationState = JSON.parse(savedState);
                      // Navigate to search page with preserved search parameters
                      const urlParams = new URLSearchParams();
                      if (paginationState.query) urlParams.set('q', paginationState.query);
                      if (paginationState.location) urlParams.set('location', paginationState.location);
                      router.push(`/?${urlParams.toString()}`);
                    } catch (error) {
                      console.error('Failed to parse saved state:', error);
                      router.push('/');
                    }
                  } else {
                    // Fallback to home page if no saved state
                    router.push('/');
                  }
                }
              }}>
                {fromDashboard ? (
                  <>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </>
                ) : fromApplications ? (
                  <>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Back to Applications
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to search
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 py-8 pb-24 max-w-5xl">
        {/* Back Button - Context-aware navigation */}
        <Button variant="ghost" onClick={() => {
          // Navigate based on where user came from
          if (fromDashboard) {
            router.push('/dashboard');
          } else if (fromApplications) {
            router.push('/applications');
          } else {
            // Check if we have saved search state
            const savedState = sessionStorage.getItem('paginationState');
            if (savedState) {
              try {
                const paginationState = JSON.parse(savedState);
                // Navigate to search page with preserved search parameters
                const urlParams = new URLSearchParams();
                if (paginationState.query) urlParams.set('q', paginationState.query);
                if (paginationState.location) urlParams.set('location', paginationState.location);
                router.push(`/?${urlParams.toString()}`);
              } catch (error) {
                console.error('Failed to parse saved state:', error);
                router.push('/');
              }
            } else {
              // Fallback to home page if no saved state
              router.push('/');
            }
          }
        }} className="mb-4">
          {fromDashboard ? (
            <>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </>
          ) : fromApplications ? (
            <>
              <Briefcase className="h-4 w-4 mr-2" />
              Back to Applications
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to search
            </>
          )}
        </Button>

        {/* Application Status Alert */}
        {applicationStatus && applicationStatus.hasApplied && (
          <Alert className={`mb-4 ${applicationStatus.canReapply ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CheckCircle2 className={`h-4 w-4 ${applicationStatus.canReapply ? 'text-green-600' : 'text-blue-600'}`} />
            <AlertDescription className={applicationStatus.canReapply ? 'text-green-800' : 'text-blue-800'}>
              {applicationStatus.canReapply ? (
                <span className="font-medium">
                  You previously applied to this job. You can apply again now.
                </span>
              ) : (
                <span className="font-medium">
                  <Clock className="inline h-4 w-4 mr-1" />
                  You applied to this job. You can reapply in <strong>{applicationStatus.daysUntilReapply} day{applicationStatus.daysUntilReapply !== 1 ? 's' : ''}</strong>.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Job Header Card */}
        <Card className={`mb-6 transition-all ${selectedJobs.has(job._id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
          <CardHeader>
            <div className="flex gap-4">
              {/* Selection Checkbox */}
              <div className="flex items-start pt-2">
                <Checkbox
                  checked={selectedJobs.has(job._id)}
                  onCheckedChange={() => toggleJobSelection(job._id)}
                  className="h-6 w-6"
                  disabled={applicationStatus?.hasApplied && !applicationStatus?.canReapply}
                />
              </div>

              {/* Job Info */}
              <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-col gap-3 mb-3">
                    {/* Company Logo and Name on same line */}
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        name={job.company}
                        logoUrl={job.logoUrl}
                        domain={job.companyDomain || job.url}
                        size={56}
                      />
                      <div className="flex items-center gap-2 text-base text-slate-700">
                        <Building2 className="h-5 w-5" />
                        <span className="font-semibold text-xl">{job.company}</span>
                      </div>
                    </div>
                    {/* Job Title below */}
                    <CardTitle className="text-3xl">{job.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="flex flex-col gap-2 text-base">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {job.location}
                  </span>
                  {job.jobType && (
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      {job.jobType}
                    </span>
                  )}
                  {job.postedAt && (
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Posted {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </div>

              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
                    <span className="text-emerald-600 font-bold text-lg">₹</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {(job.salaryMin / 100000).toFixed(1)} - {(job.salaryMax / 100000).toFixed(1)} LPA
                    </p>
                    <p className="text-sm text-emerald-600 font-medium">Annual Compensation</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Job Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {job.description || 'No description available'}
            </p>
          </CardContent>
        </Card>

        {/* Requirements / Skills */}
        {job.requirements && job.requirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Required Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Apply Bar Component */}
      <BulkApplyBar jobs={job ? [job] : []} />
    </div>
  );
}


