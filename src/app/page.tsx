'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { searchJobs, checkApplicationEligibility } from '@/lib/api';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/layout/Header';
import { BulkApplyBar } from '@/components/jobs/BulkApplyBar';
import { Search, MapPin, Building2, Loader2, CheckCircle } from 'lucide-react';
import CompanyLogo from '@/components/common/CompanyLogo';

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  url: string;
  companyDomain?: string;
  logoUrl?: string;
}

interface ApplicationStatus {
  [jobId: string]: {
    hasApplied: boolean;
    canReapply: boolean;
    daysUntilReapply?: number;
  };
}

export default function HomePage() {
  const { selectedJobs, toggleJobSelection } = useJobSelection();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({});
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const JOBS_PER_PAGE = 20;

  // Ensure we never render duplicate jobs (prevents duplicate React keys)
  const dedupeJobs = (list: Job[]): Job[] => {
    const seenIds = new Set<string>();
    const unique: Job[] = [];
    for (const job of list) {
      if (!seenIds.has(job._id)) {
        seenIds.add(job._id);
        unique.push(job);
      }
    }
    return unique;
  };

  // Save pagination state when navigating to job details
  const savePaginationState = () => {
    const paginationState = {
      query,
      location,
      offset,
      hasMore,
      total
    };
    sessionStorage.setItem('paginationState', JSON.stringify(paginationState));
    console.log('💾 Saved pagination state:', paginationState);
  };

  // Restore pagination state when returning from job details
  const restorePaginationState = () => {
    const savedState = sessionStorage.getItem('paginationState');
    if (savedState) {
      try {
        const paginationState = JSON.parse(savedState);
        console.log('🔄 Restoring pagination state:', paginationState);
        
        // Only restore if we have a job to scroll to
        const lastViewedJobId = sessionStorage.getItem('lastViewedJobId');
        if (lastViewedJobId) {
          setQuery(paginationState.query);
          setLocation(paginationState.location);
          setOffset(paginationState.offset);
          setHasMore(paginationState.hasMore);
          setTotal(paginationState.total);
          
          // Clear the saved state
          sessionStorage.removeItem('paginationState');
          return paginationState; // Return the state object instead of boolean
        }
      } catch (error) {
        console.error('❌ Failed to parse pagination state:', error);
        sessionStorage.removeItem('paginationState');
      }
    }
    return null;
  };

  // Scroll to the job that was clicked when returning from details page
  const scrollToJob = (jobId: string) => {
    const jobElement = document.getElementById(`job-card-${jobId}`);
    if (jobElement) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jobElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          console.log('✅ Scrolled to job:', jobId);
        });
      });
      return true;
    }
    console.log('❌ Job element not found:', jobId);
    return false;
  };

  // Check which jobs user has already applied to
  const checkJobsEligibility = async (jobIds: string[]) => {
    if (!user || jobIds.length === 0) {
      console.log('⚠️ Skipping eligibility check:', { hasUser: !!user, jobCount: jobIds.length });
      setCheckingEligibility(false);
      return;
    }
    
    console.log('🔍 Checking eligibility for jobs:', jobIds.length, 'jobs');
    setCheckingEligibility(true);
    try {
      const result = await checkApplicationEligibility(jobIds);
      console.log('✅ Eligibility check result:', {
        success: result.success,
        dataKeys: result.data ? Object.keys(result.data).length : 0,
        sampleData: result.data ? Object.keys(result.data).slice(0, 3) : []
      });
      
      if (result.success && result.data) {
        // Backend returns an object with jobId as keys, not an array
        // Example: { "jobId1": { hasApplied: true, canReapply: false, ... }, ... }
        setApplicationStatus(prev => {
          const newStatus = { ...prev, ...result.data };
          console.log('📊 Updated applicationStatus:', {
            totalJobs: Object.keys(newStatus).length,
            appliedJobs: Object.values(newStatus).filter((s: any) => s.hasApplied).length
          });
          return newStatus;
        });
      } else {
        console.warn('⚠️ Eligibility check returned invalid data:', result);
      }
    } catch (error) {
      console.error('❌ Failed to check application eligibility:', error);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Effect to check eligibility when user becomes available (if jobs are already loaded)
  useEffect(() => {
    // If user just became available and we have jobs loaded but no status checked
    if (user && jobs.length > 0 && !checkingEligibility) {
      const jobIds = jobs.map(job => job._id);
      const jobsWithoutStatus = jobIds.filter(jobId => !applicationStatus[jobId]);
      
      if (jobsWithoutStatus.length > 0) {
        console.log('🔄 [useEffect] User became available, checking eligibility for', jobsWithoutStatus.length, 'jobs');
        checkJobsEligibility(jobsWithoutStatus);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jobs.length]);

  useEffect(() => {
    // Check if we have URL parameters (from "Back to search" navigation)
    const urlQuery = searchParams.get('q');
    const urlLocation = searchParams.get('location');
    
    if (urlQuery || urlLocation) {
      // Set the search parameters from URL
      setQuery(urlQuery || '');
      setLocation(urlLocation || '');
      
      // Check if we need to restore pagination state
      const restoredState = restorePaginationState();
      
      if (restoredState) {
        // Load jobs with the restored pagination state
        handleSearchWithPagination(restoredState);
      } else {
        // Perform search with URL parameters
        setTimeout(() => {
          // Use the state values that were just set from URL parameters
          handleSearchWithQueryAndLocation(urlQuery || '', urlLocation || '', true);
        }, 100); // Small delay to ensure state is set
      }
    } else {
      // Check if we need to restore pagination state (normal flow)
      const restoredState = restorePaginationState();
      
      if (restoredState) {
        // Load jobs with the restored pagination state
        handleSearchWithPagination(restoredState);
      } else {
        // Normal initial load
        handleSearch(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle search with pagination restoration
  const handleSearchWithPagination = async (paginationState: any) => {
    setLoading(true);
    setError('');
    
    try {
      // First, load only the first page of jobs (20 jobs)
      const result = await searchJobs({ 
        query: paginationState.query, 
        location: paginationState.location,
        limit: JOBS_PER_PAGE, // Load only first page
        offset: 0 // Start from beginning
      });
      
      if (result.success) {
        const firstPageJobs = result.data.jobs || [];
        
        console.log('📦 [handleSearchWithPagination] First page loaded:', {
          jobCount: firstPageJobs.length,
          hasUser: !!user,
          userId: user?.email || 'NO USER'
        });
        
        // Check eligibility BEFORE setting jobs
        if (user && firstPageJobs.length > 0) {
          const jobIds = firstPageJobs.map((job: Job) => job._id);
          console.log('🔍 [handleSearchWithPagination] Calling checkJobsEligibility...');
          await checkJobsEligibility(jobIds);
        } else {
          console.warn('⚠️ [handleSearchWithPagination] Skipping eligibility:', { 
            hasUser: !!user, 
            jobCount: firstPageJobs.length 
          });
        }
        
        setJobs(dedupeJobs(firstPageJobs));
        setTotal(result.data.total || 0);
        setOffset(JOBS_PER_PAGE);
        setHasMore(JOBS_PER_PAGE < result.data.total);
        
        console.log('🔄 Loaded first page jobs:', firstPageJobs.length);
        
        // Check if the target job is in the first page
        const lastViewedJobId = sessionStorage.getItem('lastViewedJobId');
        if (lastViewedJobId) {
          const jobExists = firstPageJobs.some((job: Job) => job._id === lastViewedJobId);
          
          if (jobExists) {
            // Job is in first page, scroll to it
            setTimeout(() => {
              console.log('🔍 Job found in first page, scrolling to:', lastViewedJobId);
              const scrolled = scrollToJob(lastViewedJobId);
              if (scrolled) {
                sessionStorage.removeItem('lastViewedJobId');
                console.log('✅ Scroll restoration completed');
              }
            }, 500);
          } else {
            // Job is not in first page, load just enough to include it
            console.log('🔍 Job not in first page, loading additional jobs to include it');
            const additionalResult = await searchJobs({ 
              query: paginationState.query, 
              location: paginationState.location,
              limit: paginationState.offset + JOBS_PER_PAGE, // Load up to where user was
              offset: 0 // Start from beginning to get all jobs up to target
            });
            
            if (additionalResult.success) {
              const allJobsUpToTarget = additionalResult.data.jobs || [];
              
              console.log('📦 [handleSearchWithPagination] Additional jobs loaded:', {
                jobCount: allJobsUpToTarget.length,
                hasUser: !!user
              });
              
              // Check eligibility for ALL jobs BEFORE setting
              if (user && allJobsUpToTarget.length > 0) {
                const jobIds = allJobsUpToTarget.map((job: Job) => job._id);
                console.log('🔍 [handleSearchWithPagination] Calling checkJobsEligibility for all jobs...');
                await checkJobsEligibility(jobIds);
              } else {
                console.warn('⚠️ [handleSearchWithPagination] Skipping eligibility for additional jobs:', {
                  hasUser: !!user,
                  jobCount: allJobsUpToTarget.length
                });
              }
              
              setJobs(dedupeJobs(allJobsUpToTarget));
              setOffset(paginationState.offset + JOBS_PER_PAGE);
              setHasMore((paginationState.offset + JOBS_PER_PAGE) < result.data.total);
              
              setTimeout(() => {
                console.log('🔍 Scrolling to job after loading additional jobs:', lastViewedJobId);
                const scrolled = scrollToJob(lastViewedJobId);
                if (scrolled) {
                  sessionStorage.removeItem('lastViewedJobId');
                  console.log('✅ Scroll restoration completed after loading additional jobs');
                }
              }, 500);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Search with pagination failed:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle scroll restoration - works for both initial load and pagination
  useEffect(() => {
    const lastViewedJobId = sessionStorage.getItem('lastViewedJobId');
    console.log('🔍 Scroll restoration check:', { 
      lastViewedJobId, 
      jobsLength: jobs.length, 
      loading, 
      loadingMore, 
      offset,
      hasJobId: !!lastViewedJobId,
      hasJobs: jobs.length > 0,
      notLoading: !loading && !loadingMore
    });
    
    if (lastViewedJobId && jobs.length > 0 && !loading && !loadingMore) {
      // Check if the job exists in current jobs array
      const jobExists = jobs.some(job => job._id === lastViewedJobId);
      console.log('🔍 Job exists in current batch:', jobExists);
      
      if (jobExists) {
        // Try immediate scroll first
        console.log('🔍 Attempting immediate scroll to job:', lastViewedJobId);
        const scrolled = scrollToJob(lastViewedJobId);
        
        if (scrolled) {
          sessionStorage.removeItem('lastViewedJobId');
          console.log('✅ Scroll restoration completed (immediate)');
        } else {
          // If not found, wait for DOM to be fully rendered
          console.log('⚠️ Immediate scroll failed, trying delayed scroll...');
          setTimeout(() => {
            console.log('🔍 Attempting delayed scroll to job:', lastViewedJobId);
            const scrolled = scrollToJob(lastViewedJobId);
            
            if (scrolled) {
              sessionStorage.removeItem('lastViewedJobId');
              console.log('✅ Scroll restoration completed (delayed)');
            } else {
              console.log('⚠️ Delayed scroll failed, trying final retry...');
              // Try again with longer delay
              setTimeout(() => {
                console.log('🔍 Attempting final retry scroll to job:', lastViewedJobId);
                const scrolled = scrollToJob(lastViewedJobId);
                if (scrolled) {
                  sessionStorage.removeItem('lastViewedJobId');
                  console.log('✅ Scroll restoration completed (final retry)');
                } else {
                  console.log('❌ Job element still not found after all retries');
                  console.log('🔍 Available job IDs:', jobs.map(job => job._id));
                }
              }, 1000);
            }
          }, 200);
        }
      } else {
        console.log('⚠️ Job not in current batch, waiting for more jobs to load...');
        console.log('🔍 Available job IDs:', jobs.map(job => job._id));
      }
    }
  }, [jobs, loading, loadingMore, offset]);

  const handleSearch = async (resetOffset = true) => {
    setLoading(true);
    setError('');
    const searchOffset = resetOffset ? 0 : offset;
    
    console.log('🔍 [handleSearch] Starting search:', {
      resetOffset,
      hasUser: !!user,
      userId: user?.email || 'NO USER',
      query,
      location
    });
    
    try {
      const result = await searchJobs({ 
        query, 
        location, 
        limit: JOBS_PER_PAGE,
        offset: searchOffset 
      });
      
      if (result.success) {
        const newJobs = result.data.jobs || [];
        
        console.log('📦 [handleSearch] Jobs fetched:', {
          jobCount: newJobs.length,
          hasUser: !!user,
          userId: user?.email || 'NO USER'
        });
        
        // Check application eligibility BEFORE setting jobs
        // This ensures the status is ready when jobs render
        if (user && newJobs.length > 0) {
          const jobIds = newJobs.map((job: Job) => job._id);
          console.log('🔍 [handleSearch] Calling checkJobsEligibility for', jobIds.length, 'jobs');
          await checkJobsEligibility(jobIds);
        } else {
          console.warn('⚠️ [handleSearch] Skipping eligibility check:', {
            hasUser: !!user,
            jobCount: newJobs.length,
            reason: !user ? 'User not available' : 'No jobs'
          });
        }
        
        // Now set the jobs - they will render with correct status
        setJobs(
          resetOffset
            ? dedupeJobs(newJobs)
            : dedupeJobs([...jobs, ...newJobs])
        );
        setTotal(result.data.total);
        setOffset(resetOffset ? JOBS_PER_PAGE : searchOffset + JOBS_PER_PAGE);
        setHasMore(newJobs.length === JOBS_PER_PAGE && (resetOffset ? JOBS_PER_PAGE : searchOffset + JOBS_PER_PAGE) < result.data.total);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.response?.data?.message || 'Failed to search jobs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with specific query and location (for URL parameter navigation)
  const handleSearchWithQueryAndLocation = async (searchQuery: string, searchLocation: string, resetOffset = true) => {
    setLoading(true);
    setError('');
    const searchOffset = resetOffset ? 0 : offset;
    
    try {
      const result = await searchJobs({ 
        query: searchQuery, 
        location: searchLocation, 
        limit: JOBS_PER_PAGE,
        offset: searchOffset 
      });
      
      if (result.success) {
        const newJobs = result.data.jobs || [];
        
        // Check application eligibility BEFORE setting jobs
        if (user && newJobs.length > 0) {
          const jobIds = newJobs.map((job: Job) => job._id);
          await checkJobsEligibility(jobIds);
        }
        
        setJobs(
          resetOffset
            ? dedupeJobs(newJobs)
            : dedupeJobs([...jobs, ...newJobs])
        );
        setTotal(result.data.total);
        setOffset(resetOffset ? JOBS_PER_PAGE : searchOffset + JOBS_PER_PAGE);
        setHasMore(newJobs.length === JOBS_PER_PAGE && (resetOffset ? JOBS_PER_PAGE : searchOffset + JOBS_PER_PAGE) < result.data.total);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.response?.data?.message || 'Failed to search jobs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const result = await searchJobs({ 
        query, 
        location, 
        limit: JOBS_PER_PAGE,
        offset: offset 
      });
      
      if (result.success) {
        const newJobs = result.data.jobs || [];
        
        // Check application eligibility BEFORE adding jobs
        // This ensures new jobs render with correct disabled state
        if (user && newJobs.length > 0) {
          const jobIds = newJobs.map((job: Job) => job._id);
          await checkJobsEligibility(jobIds);
        }
        
        setJobs(dedupeJobs([...jobs, ...newJobs]));
        setOffset(offset + JOBS_PER_PAGE);
        setHasMore(newJobs.length === JOBS_PER_PAGE && offset + JOBS_PER_PAGE < result.data.total);
      }
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-24 max-w-6xl">
        {/* Search Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Search Jobs</CardTitle>
            <CardDescription className="text-base">
              {total > 0 ? `Showing ${jobs.length} of ${total} jobs` : 'Start searching for your next opportunity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Job title, keywords, or company..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(true)}
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Location (optional)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(true)}
                />
              </div>
              <Button onClick={() => handleSearch(true)} disabled={loading} className="h-12 px-8 text-base">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Job Results */}
        {!loading && jobs.length > 0 && (
          <>
          <div className="mt-8 space-y-4">
            {jobs.map((job, index) => {
              const jobStatus = applicationStatus[job._id];
              const isAlreadyApplied = jobStatus?.hasApplied && !jobStatus?.canReapply;
              
              // Debug logging for each job
              if (index < 3) {  // Log first 3 jobs only to avoid spam
                console.log(`📋 Rendering job ${job._id.substring(0, 8)}... (${job.title}):`, {
                  jobStatus: jobStatus || 'NO STATUS',
                  hasApplied: jobStatus?.hasApplied,
                  canReapply: jobStatus?.canReapply,
                  isDisabled: isAlreadyApplied,
                  daysUntilReapply: jobStatus?.daysUntilReapply
                });
              }
              
              return (
                <Card 
                  key={`${job._id}-${index}`}
                  id={`job-card-${job._id}`}
                  className={`hover:shadow-xl transition-all duration-200 ${
                    selectedJobs.has(job._id) ? 'ring-2 ring-blue-500 bg-blue-50/50' : 
                    isAlreadyApplied ? 'opacity-75 bg-slate-50' : 'hover:scale-[1.01]'
                  }`}
                >
                <CardHeader>
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      <div className="flex items-start pt-1">
                        <Checkbox
                          checked={selectedJobs.has(job._id)}
                          onCheckedChange={() => !isAlreadyApplied && toggleJobSelection(job._id)}
                          disabled={isAlreadyApplied}
                          className="h-5 w-5"
                        />
                      </div>
                      
                      {/* Job Info */}
                      <div className="flex-1 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">{job.title}</CardTitle>
                        {isAlreadyApplied && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Applied
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-base">
                        <span className="flex items-center gap-2">
                          <CompanyLogo name={job.company} logoUrl={job.logoUrl} domain={job.companyDomain || job.url} size={48} />
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {job.salaryMin && job.salaryMax && (
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          ₹{(job.salaryMin / 100000).toFixed(1)}-
                          {(job.salaryMax / 100000).toFixed(1)} LPA
                        </Badge>
                      )}
                      {/* {isAlreadyApplied && jobStatus?.daysUntilReapply !== undefined && jobStatus.daysUntilReapply > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                         Reapply in {jobStatus.daysUntilReapply} days
                        </Badge>
                      )} */}
                    </div>
                      </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 line-clamp-3 text-base">
                    {job.description || 'No description available'}
                  </p>
                  {job.requirements && job.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.requirements.slice(0, 8).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                      {job.requirements.length > 8 && (
                        <Badge variant="outline" className="text-sm">
                          +{job.requirements.length - 8} more
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3">
                       <Button 
                         asChild 
                         className="flex-1"
                         onClick={() => {
                           // Save both job ID and pagination state
                           sessionStorage.setItem('lastViewedJobId', job._id);
                           savePaginationState();
                           console.log('💾 Saved job ID and pagination state:', job._id);
                         }}
                       >
                      <Link href={`/jobs/${job._id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button 
                  onClick={loadMore} 
                  disabled={loadingMore}
                  size="lg"
                  variant="outline"
                  className="px-12"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading more jobs...
                    </>
                  ) : (
                    <>
                      Load More Jobs ({total - jobs.length} remaining)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && !error && (
          <div className="mt-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No jobs found</h3>
                <p className="text-slate-500 text-center">
                  Try adjusting your search terms or removing the location filter
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bulk Apply Bar Component */}
      <BulkApplyBar jobs={jobs} />

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p>Built with ❤️ by RIZQ.AI Team</p>
          <p className="text-sm mt-2">Powered by RIZQ.AI</p>
        </div>
      </footer>
    </div>
  );
}
