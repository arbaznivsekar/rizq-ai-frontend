'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { searchJobs, checkApplicationEligibility } from '@/lib/api';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { BulkApplyBar } from '@/components/jobs/BulkApplyBar';
import { JobListingCard } from '@/components/jobs/JobListingCard';
import { Search, Loader2, MapPin, X } from 'lucide-react';
import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';

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

// Separate component that uses useSearchParams
function HomePageContent() {
  const { selectedJobs, toggleJobSelection } = useJobSelection();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({});
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const JOBS_PER_PAGE = 20;

  // ── Search-enhancement refs ───────────────────────────────────────────────
  const lastBackendSearch = useRef({ query: '', location: '' });
  const fuseRef = useRef<Fuse<Job> | null>(null);

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
    lastBackendSearch.current = { query: paginationState.query, location: paginationState.location };
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
    lastBackendSearch.current = { query, location };
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
    lastBackendSearch.current = { query: searchQuery, location: searchLocation };
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

  // ── Fuse.js: rebuild search index whenever backend results change ─────────
  useEffect(() => {
    fuseRef.current = new Fuse(jobs, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'company', weight: 0.25 },
        { name: 'description', weight: 0.15 },
        { name: 'location', weight: 0.1 },
        { name: 'requirements', weight: 0.1 },
      ],
      threshold: 0.35,       // 0 = exact, 1 = match anything
      includeScore: true,
      ignoreLocation: true,  // match anywhere in the string
      minMatchCharLength: 2,
      useExtendedSearch: false,
    });
  }, [jobs]);

  // ── Fuse.js: client-side instant filter on loaded jobs ───────────────────
  useEffect(() => {
    if (!query.trim() || !fuseRef.current) {
      setDisplayedJobs(jobs);
      return;
    }
    const results = fuseRef.current.search(query);
    setDisplayedJobs(results.map((r: FuseResult<Job>) => r.item));
  }, [jobs, query]);

  // ── Debounced backend search: auto-fires 400 ms after user stops typing ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const { query: lq, location: ll } = lastBackendSearch.current;
      // Only hit the backend if the values actually changed
      if (query !== lq || location !== ll) {
        handleSearch(true);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 md:py-8 max-w-6xl">
        {/* Search Card */}
        <Card className="shadow-sm md:shadow-lg">
          <CardHeader className="pb-3 px-4 pt-4 md:px-6 md:pt-6 md:pb-6">
            <CardTitle className="text-lg md:text-2xl">Search Jobs</CardTitle>
            <CardDescription className="text-xs md:text-base">
              {total > 0
                ? query.trim() && displayedJobs.length !== jobs.length
                  ? `${displayedJobs.length} matches · ${total} total`
                  : `Showing ${jobs.length} of ${total} jobs`
                : 'Find your next opportunity'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 md:px-6 md:pb-6">
            <div className="flex flex-col gap-2.5 md:gap-4">
              <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4">
                {/* Query input with clear button */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Title, company, skills, or keywords…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9 md:pl-10 pr-8 h-11 md:h-12 text-sm md:text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Location input with clear button */}
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Location (city, remote…)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9 md:pl-10 pr-8 h-11 md:h-12 text-sm md:text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(true)}
                  />
                  {location && (
                    <button
                      type="button"
                      onClick={() => setLocation('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="Clear location"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleSearch(true)}
                disabled={loading}
                className="h-11 md:h-12 text-sm md:text-base w-full sm:w-auto sm:self-start sm:px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-3 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-xs md:text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="mt-4 md:mt-8 space-y-3 md:space-y-4">
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
        {!loading && displayedJobs.length > 0 && (
          <>
          <div className="mt-4 md:mt-8 space-y-3 md:space-y-4 mb-32 md:mb-10">
            {displayedJobs.map((job) => {
              const jobStatus = applicationStatus[job._id];
              const isAlreadyApplied = jobStatus?.hasApplied && !jobStatus?.canReapply;
              return (
                <JobListingCard
                  key={job._id}
                  job={job}
                  isSelected={selectedJobs.has(job._id)}
                  isAlreadyApplied={!!isAlreadyApplied}
                  onToggle={() => toggleJobSelection(job._id, {
                    _id: job._id,
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    description: job.description,
                    companyDomain: job.companyDomain,
                    logoUrl: job.logoUrl,
                    url: job.url,
                  })}
                  onViewDetails={() => {
                    sessionStorage.setItem('lastViewedJobId', job._id);
                    savePaginationState();
                  }}
                />
              );
            })}
          </div>

            {/* Load More Button — only when not actively filtering client-side */}
            {hasMore && !query.trim() && (
              <div className="mt-4 md:mt-8 flex justify-center px-1">
                <Button
                  onClick={loadMore}
                  disabled={loadingMore}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto px-6 md:px-12"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading more jobs…
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
        {!loading && displayedJobs.length === 0 && !error && (
          <div className="mt-4 md:mt-8">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 md:py-12 px-4">
                <Search className="h-12 w-12 md:h-16 md:w-16 text-slate-300 mb-3 md:mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-slate-700 mb-1 md:mb-2">No jobs found</h3>
                <p className="text-slate-500 text-sm text-center max-w-xs">
                  {query.trim()
                    ? `No matches for "${query}". Try different keywords or broaden your search.`
                    : 'Try adjusting your search terms or removing the location filter.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bulk Apply Bar Component */}
      <BulkApplyBar jobs={jobs} />

      {/* Footer */}
      <footer className="mt-8 md:mt-16 py-5 md:py-8 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-slate-600">
          <p className="text-sm">Built with ❤️ by RIZQ.AI Team</p>
          <p className="text-xs mt-1 md:mt-2">Powered by RIZQ.AI</p>
        </div>
      </footer>
    </div>
  );
}

// Main component with Suspense boundary
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}