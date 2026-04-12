'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getJob, checkApplicationEligibility } from '@/lib/api';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { BulkApplyBar } from '@/components/jobs/BulkApplyBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  const { selectedJobs, selectedJobsData, toggleJobSelection } = useJobSelection();
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
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedScrollPosition, 10));
          sessionStorage.removeItem(scrollRestoreKey);
        });
      } else {
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
    }
  };

  // Back navigation helper
  const handleBack = () => {
    if (fromDashboard) {
      router.push('/dashboard');
    } else if (fromApplications) {
      router.push('/applications');
    } else {
      const savedState = sessionStorage.getItem('paginationState');
      if (savedState) {
        try {
          const paginationState = JSON.parse(savedState);
          const urlParams = new URLSearchParams();
          if (paginationState.query) urlParams.set('q', paginationState.query);
          if (paginationState.location) urlParams.set('location', paginationState.location);
          router.push(`/?${urlParams.toString()}`);
        } catch (error) {
          console.error('Failed to parse saved state:', error);
          router.push('/');
        }
      } else {
        router.push('/');
      }
    }
  };

  const backLabel = fromDashboard ? (
    <><LayoutDashboard className="h-4 w-4 mr-2" />Back to Dashboard</>
  ) : fromApplications ? (
    <><Briefcase className="h-4 w-4 mr-2" />Back to Applications</>
  ) : (
    <><ArrowLeft className="h-4 w-4 mr-2" />Back to search</>
  );

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
              <Button onClick={handleBack}>{backLabel}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <div className="container mx-auto px-4 py-6 pb-28 max-w-5xl">

        {/* Back Button */}
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          {backLabel}
        </Button>

        {/* Application Status Alert */}
        {applicationStatus?.hasApplied && (
          <Alert className={`mb-4 ${applicationStatus.canReapply ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
            <CheckCircle2 className={`h-4 w-4 ${applicationStatus.canReapply ? 'text-green-600' : 'text-blue-600'}`} />
            <AlertDescription className={applicationStatus.canReapply ? 'text-green-800' : 'text-blue-800'}>
              {applicationStatus.canReapply ? (
                <span className="font-medium">You previously applied to this job. You can apply again now.</span>
              ) : (
                <span className="font-medium">
                  <Clock className="inline h-4 w-4 mr-1" />
                  You applied to this job. You can reapply in{' '}
                  <strong>{applicationStatus.daysUntilReapply} day{applicationStatus.daysUntilReapply !== 1 ? 's' : ''}</strong>.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ✅ FIXED: Job Header Card — mobile responsive */}
        <Card className={`mb-6 transition-all ${selectedJobs.has(job._id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">

              {/* Row 1 — Checkbox + Logo + Company */}
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedJobs.has(job._id)}
                  onCheckedChange={() => toggleJobSelection(job._id, {
                    _id: job._id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    description: job.description,
                    companyDomain: job.companyDomain,
                    logoUrl: job.logoUrl,
                    url: job.url,
                  })}
                  className="h-5 w-5 flex-shrink-0"
                  disabled={applicationStatus?.hasApplied && !applicationStatus?.canReapply}
                />
                <CompanyLogo
                  name={job.company}
                  logoUrl={job.logoUrl}
                  domain={job.companyDomain || job.url}
                  size={40}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="font-semibold text-base truncate">{job.company}</span>
                </div>
              </div>

              {/* Row 2 — Job Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                {job.title}
              </h1>

              <Separator />

              {/* Row 3 — Meta info */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{job.location}</span>
                </div>
                {job.jobType && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                    <span>{job.jobType}</span>
                  </div>
                )}
                {job.postedAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Row 4 — Salary inline, NO overflow */}
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5 w-fit">
                  <span className="text-emerald-600 font-bold text-base flex-shrink-0">₹</span>
                  <div>
                    <p className="text-base font-bold text-emerald-700">
                      {(job.salaryMin / 100000).toFixed(1)} – {(job.salaryMax / 100000).toFixed(1)} LPA
                    </p>
                    <p className="text-xs text-emerald-600">Annual Compensation</p>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {/* ✅ FIXED: Job Description — parsed sections, readable */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Job Description</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="space-y-3">
              {(job.description || 'No description available')
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((section, i) => {
                  const lines = section.split('\n').filter(Boolean);
                  const firstLine = lines[0] || '';
                  const isHeading =
                    firstLine.length < 60 &&
                    (firstLine.endsWith(':') || firstLine === firstLine.toUpperCase());

                  if (isHeading) {
                    return (
                      <div key={i} className="space-y-1 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {firstLine.replace(':', '')}
                        </p>
                        {lines.slice(1).length > 0 && (
                          <p className="text-sm text-foreground leading-relaxed">
                            {lines.slice(1).join(' ')}
                          </p>
                        )}
                      </div>
                    );
                  }

                  return (
                    <p key={i} className="text-sm text-foreground leading-relaxed">
                      {section}
                    </p>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Required Skills */}
        {job.requirements && job.requirements.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Required Skills</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
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

      {/* Bulk Apply Bar — passes current job + every other selected job so the
          action bar count and the submit payload both reflect the full batch, not
          just the single job being viewed on this page.                          */}
      <BulkApplyBarWithSelection currentJob={job} selectedJobsData={selectedJobsData} />
    </div>
  );
}

/** Thin wrapper that builds the correct jobs array for BulkApplyBar */
function BulkApplyBarWithSelection({
  currentJob,
  selectedJobsData,
}: {
  currentJob: Job | null;
  selectedJobsData: Map<string, import('@/contexts/JobSelectionContext').SelectedJobData>;
}) {
  const jobs = useMemo(() => {
    const map = new Map<string, {
      _id: string; title: string; company: string; location: string;
      description?: string; companyDomain?: string; logoUrl?: string; url?: string;
      requirements?: string[];
    }>();

    // Always include the current job (with full details from the page fetch)
    if (currentJob) {
      map.set(currentJob._id, {
        _id: currentJob._id,
        title: currentJob.title,
        company: currentJob.company,
        location: currentJob.location,
        description: currentJob.description,
        companyDomain: currentJob.companyDomain,
        logoUrl: currentJob.logoUrl,
        url: currentJob.url,
        requirements: currentJob.requirements,
      });
    }

    // Include every other job that was selected on a different page
    selectedJobsData.forEach((j, id) => {
      if (!map.has(id)) {
        map.set(id, {
          _id: j._id,
          title: j.title,
          company: j.company,
          location: j.location,
          description: j.description,
          companyDomain: j.companyDomain,
          logoUrl: j.logoUrl,
          url: j.url,
        });
      }
    });

    return Array.from(map.values()) as Parameters<typeof BulkApplyBar>[0]['jobs'];
  }, [currentJob, selectedJobsData]);

  return <BulkApplyBar jobs={jobs} />;
}