'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { generateProfessionalSummary, generateBatchResumes, updateEmail, regenerateEmail, finalizeEmails, generateEmailPreview, getEmailPreview, getBulkApplicationProgress, getApplicationQuota } from '@/lib/api';
import type { QuotaSummary } from '@/lib/api';
import { toast } from 'sonner';
import { ApplicationProgressModal } from '@/components/application/ApplicationProgressModal';
import { EmailApplicationSuccessModal } from '@/components/application/EmailApplicationSuccessModal';
import { EmailPreview } from './EmailListView';
import { SelectedJobsActionBar } from '@/components/jobs/SelectedJobsActionBar';
import { ApplyJobsModalJobState } from '@/components/jobs/ApplyJobsModal';
import { ApplyJobsModal } from '@/components/jobs/ApplyJobsModal';

const GEN_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── localStorage helpers ────────────────────────────────────────────────────

interface PersistedJobData {
  summary?: string;
  summaryIsEdited?: boolean;
  resumePdfUrl?: string;
  resumeDownloadUrl?: string;
  resumeGoogleDocUrl?: string;
  savedAt: number;
}

function genCacheKey(userId: string, jobId: string) {
  return `rizq_gen_${userId}_${jobId}`;
}

function loadPersistedJobData(userId: string, jobId: string): PersistedJobData | null {
  try {
    const raw = localStorage.getItem(genCacheKey(userId, jobId));
    if (!raw) return null;
    const parsed: PersistedJobData = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > GEN_CACHE_TTL_MS) {
      localStorage.removeItem(genCacheKey(userId, jobId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePersistedJobData(userId: string, jobId: string, data: Omit<PersistedJobData, 'savedAt'>) {
  try {
    localStorage.setItem(genCacheKey(userId, jobId), JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // storage full or unavailable — not fatal
  }
}

/**
 * Helper function to extract fileId from pdfDownloadUrl and construct proxy URL
 * @param pdfDownloadUrl - Backend URL like "http://localhost:8080/api/download-pdf?fileId=XXX"
 * @returns Proxy URL like "/api/proxy-pdf?fileId=XXX"
 */
function getProxyPdfUrl(pdfDownloadUrl: string): string {
  console.log("pdfDownloadUrl", pdfDownloadUrl);
  try {
    const url = new URL(pdfDownloadUrl);
    const baseUrl = url.origin;
    const fileId = url.searchParams.get('fileId');
    const id= url.searchParams.get('id');

    return `/api/proxy-pdf?fileId=${fileId}&id=${id}&baseUrl=${baseUrl}`;
  } catch (error) {
    console.error('❌ Error parsing pdfDownloadUrl:', error);
    return pdfDownloadUrl; // Fallback to original URL
  }
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  companyDomain?: string;
  logoUrl?: string;
  description?: string;
}

interface BulkApplyBarProps {
  jobs: Job[];
}

interface SummaryState {
  summary: string;
  isGenerating: boolean;
  isEdited: boolean;
}

interface ResumeState {
  pdfUrl: string;
  pdfDownloadUrl: string;
  googleDocUrl: string;
  isGenerating: boolean;
  error: string | null;
}

export function BulkApplyBar({ jobs }: BulkApplyBarProps) {
  const { selectedJobs, clearSelection, toggleJobSelection } = useJobSelection();
  const { user } = useAuth();
  const userId = (user as any)?._id || (user as any)?.id || '';

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState(false);
  const [emailSuccessSummary, setEmailSuccessSummary] = useState<{ queued: number; failed: number } | null>(null);
  const [showEmailSuccessAfterProgress, setShowEmailSuccessAfterProgress] = useState(false);

  // Quota state — fetched on mount and refreshed after each successful batch
  const [quota, setQuota] = useState<QuotaSummary | null>(null);
  const [isQuotaLoading, setIsQuotaLoading] = useState(false);

  const fetchQuota = useCallback(async () => {
    setIsQuotaLoading(true);
    try {
      const summary = await getApplicationQuota();
      setQuota(summary);
    } catch {
      // Non-fatal — quota UI is informational, not a hard gate here
    } finally {
      setIsQuotaLoading(false);
    }
  }, []);

  // Summary management
  const [summaries, setSummaries] = useState<Map<string, SummaryState>>(new Map());

  // Resume management
  const [resumes, setResumes] = useState<Map<string, ResumeState>>(new Map());

  // Email preview management
  const [emailPreview, setEmailPreview] = useState<EmailPreview[]>([]);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  const [emailProgressId, setEmailProgressId] = useState<string | null>(null);
  const selectableJobIds = useMemo(() => new Set(jobs.map(job => job._id)), [jobs]);
  const scopedSelectedJobIds = useMemo(
    () => Array.from(selectedJobs).filter(jobId => selectableJobIds.has(jobId)),
    [selectedJobs, selectableJobIds]
  );
  const scopedSelectedCount = scopedSelectedJobIds.length;
  const selectedJobsList = useMemo(
    () => jobs.filter(job => scopedSelectedJobIds.includes(job._id)),
    [jobs, scopedSelectedJobIds]
  );
  const selectedJobIdsKey = useMemo(
    () => selectedJobsList.map(job => job._id).sort().join('|'),
    [selectedJobsList]
  );

  // Fetch quota on mount so the action bar shows live limits immediately
  useEffect(() => { fetchQuota(); }, [fetchQuota]);

  // Load persisted generated content when a job is selected
  useEffect(() => {
    if (!userId) return;
    scopedSelectedJobIds.forEach(jobId => {
      const cached = loadPersistedJobData(userId, jobId);
      if (!cached) return;

      if (cached.summary && !summaries.has(jobId)) {
        setSummaries(prev => {
          if (prev.has(jobId)) return prev;
          const next = new Map(prev);
          next.set(jobId, { summary: cached.summary!, isGenerating: false, isEdited: cached.summaryIsEdited ?? false });
          return next;
        });
      }

      if (cached.resumeDownloadUrl && !resumes.has(jobId)) {
        setResumes(prev => {
          if (prev.has(jobId)) return prev;
          const next = new Map(prev);
          next.set(jobId, {
            pdfUrl: cached.resumePdfUrl || '',
            pdfDownloadUrl: cached.resumeDownloadUrl!,
            googleDocUrl: cached.resumeGoogleDocUrl || '',
            isGenerating: false,
            error: null,
          });
          return next;
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, scopedSelectedJobIds]);

  // Restore cached emails when modal opens
  useEffect(() => {
    if (!showBulkModal || !userId) return;

    setEmailPreview(prev => {
      const selectedJobIds = new Set(selectedJobsList.map(job => job._id));
      // Keep only currently selected jobs in the modal view.
      const scoped = prev.filter(email => selectedJobIds.has(email.jobId));
      // Emails are never restored from cache — always generated fresh.
      // Scope down to only currently selected jobs and return.
      if (scoped.length === prev.length && scoped.every((email, idx) => email === prev[idx])) {
        return prev;
      }
      return scoped;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBulkModal, userId, selectedJobIdsKey]);

  // Background poll for Send-All flow so we can skip old processing modal
  useEffect(() => {
    if (!showEmailSuccessAfterProgress || !progressId) return;

    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const pollProgress = async () => {
      if (!isMounted) return;
      try {
        const result = await getBulkApplicationProgress(progressId);
        if (!isMounted || !result?.success) return;

        const data = result.data;
        if (!data?.isComplete) return;

        if (intervalId) clearInterval(intervalId);
        const successful = data.successful || 0;
        const failed = data.failed || 0;
        const skipped = data.skipped || 0;

        clearSelection();
        setProgressId(null);
        setShowEmailSuccessAfterProgress(false);

        if (successful === 0 && failed === 0 && skipped > 0) {
          toast.warning('Already Applied', {
            description: `You've already applied to ${skipped === 1 ? 'this job' : `all ${skipped} jobs`} within the last 30 days. You can reapply after the waiting period.`,
            duration: 6000,
          });
          return;
        }

        setEmailSuccessSummary({ queued: successful, failed });
        setShowEmailSuccessModal(true);
      } catch (error) {
        console.error('Failed to poll send-all progress:', error);
      }
    };

    pollProgress();
    intervalId = setInterval(pollProgress, 2000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [showEmailSuccessAfterProgress, progressId, clearSelection]);

  // Generate summary for a single job
  const handleGenerateSummary = async (job: Job) => {
    setSummaries(prev => {
      const newMap = new Map(prev);
      newMap.set(job._id, { summary: '', isGenerating: true, isEdited: false });
      return newMap;
    });

    try {
      const summary = await generateProfessionalSummary(
        job.title,
        job.description || '',
        job.company
      );
      
      setSummaries(prev => {
        const newMap = new Map(prev);
        newMap.set(job._id, { summary, isGenerating: false, isEdited: false });
        return newMap;
      });

      if (userId) {
        const existing = loadPersistedJobData(userId, job._id);
        savePersistedJobData(userId, job._id, { ...existing, summary, summaryIsEdited: false });
      }

      toast.success('Summary Generated', {
        description: `Professional summary created for ${job.title}`,
        duration: 3000,
      });
    } catch (error) {
      setSummaries(prev => {
        const newMap = new Map(prev);
        newMap.delete(job._id);
        return newMap;
      });
      
      toast.error('Generation Failed', {
        description: 'Failed to generate summary. Please try again.',
        duration: 5000,
      });
    }
  };
  
  // Generate summaries for all selected jobs
  const handleGenerateAllSummaries = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const job of selectedJobsList) {
      try {
        await handleGenerateSummary(job);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success('Summaries Generated', {
        description: `Generated ${successCount} professional summaries${failCount > 0 ? `, ${failCount} failed` : ''}`,
        duration: 5000,
      });
    }
  };
  
  // Generate resume for a single job
  const handleGenerateResume = async (job: Job) => {
    const summaryState = summaries.get(job._id);
    if (!summaryState || !summaryState.summary) {
      toast.error('Summary Required', {
        description: 'Please generate a professional summary before creating the resume.',
        duration: 5000,
      });
      return;
    }
    
    setResumes(prev => {
      const newMap = new Map(prev);
      newMap.set(job._id, {
        pdfUrl: '',
        pdfDownloadUrl: '',
        googleDocUrl: '',
        isGenerating: true,
        error: null
      });
      return newMap;
    });

    try {
      const result = await generateBatchResumes([{
        jobId: job._id,
        jobTitle: job.title,
        professionalSummary: summaryState.summary
      }]);
      
      if (result.success && result.resumes && result.resumes.length > 0) {
        const resume = result.resumes[0];
        
        if (resume.status === 'success') {
          setResumes(prev => {
            const newMap = new Map(prev);
            newMap.set(job._id, {
              pdfUrl: resume.pdfUrl || '',
              pdfDownloadUrl: resume.pdfDownloadUrl || '',
              googleDocUrl: resume.googleDocUrl || '',
              isGenerating: false,
              error: null
            });
            return newMap;
          });

          if (userId) {
            const existing = loadPersistedJobData(userId, job._id);
            savePersistedJobData(userId, job._id, {
              ...existing,
              resumePdfUrl: resume.pdfUrl || '',
              resumeDownloadUrl: resume.pdfDownloadUrl || '',
              resumeGoogleDocUrl: resume.googleDocUrl || '',
            });
          }

          toast.success('Resume Generated', {
            description: `Resume created for ${job.title}`,
            duration: 3000,
          });
        } else {
          throw new Error(resume.error || 'Resume generation failed');
        }
      }
    } catch (error: any) {
      setResumes(prev => {
        const newMap = new Map(prev);
        newMap.set(job._id, {
          pdfUrl: '',
          pdfDownloadUrl: '',
          googleDocUrl: '',
          isGenerating: false,
          error: error.message || 'Generation failed'
        });
        return newMap;
      });
      
      toast.error('Resume Generation Failed', {
        description: error.message || 'Failed to generate resume. Please try again.',
        duration: 5000,
      });
    }
  };
  
  // Generate resumes for all expanded jobs with summaries
  const handleGenerateAllResumes = async () => {
    const jobsWithSummaries = selectedJobsList.filter(job => {
      const summaryState = summaries.get(job._id);
      return summaryState && summaryState.summary;
    });
    
    if (jobsWithSummaries.length === 0) {
      toast.error('No Summaries Available', {
        description: 'Please generate summaries before creating resumes.',
        duration: 5000,
      });
      return;
    }
    
    // Single atomic update — mark all qualifying jobs as generating
    setResumes(prev => {
      const newMap = new Map(prev);
      jobsWithSummaries.forEach(job => {
        newMap.set(job._id, { pdfUrl: '', pdfDownloadUrl: '', googleDocUrl: '', isGenerating: true, error: null });
      });
      return newMap;
    });

    try {
      const jobsData = jobsWithSummaries.map(job => ({
        jobId: job._id,
        jobTitle: job.title,
        professionalSummary: summaries.get(job._id)!.summary,
      }));

      const result = await generateBatchResumes(jobsData);

      // Build a lookup so we can cover every submitted job, including any the API
      // silently omitted — those would stay stuck forever without this guard.
      const resultsByJobId = new Map<string, any>(
        (result?.resumes ?? []).map((r: any) => [r.jobId, r])
      );

      // Single atomic update — every job in jobsWithSummaries is resolved here
      setResumes(prev => {
        const newMap = new Map(prev);
        jobsWithSummaries.forEach(job => {
          const resume = resultsByJobId.get(job._id);
          if (resume?.status === 'success') {
            newMap.set(job._id, {
              pdfUrl: resume.pdfUrl || '',
              pdfDownloadUrl: resume.pdfDownloadUrl || '',
              googleDocUrl: resume.googleDocUrl || '',
              isGenerating: false,
              error: null,
            });
            // Persist to localStorage so re-opening the modal shows the cached resume
            if (userId) {
              const existing = loadPersistedJobData(userId, job._id);
              savePersistedJobData(userId, job._id, {
                ...existing,
                resumePdfUrl: resume.pdfUrl || '',
                resumeDownloadUrl: resume.pdfDownloadUrl || '',
                resumeGoogleDocUrl: resume.googleDocUrl || '',
              });
            }
          } else {
            // Job missing from response or explicitly failed — never leave isGenerating:true
            newMap.set(job._id, {
              pdfUrl: '',
              pdfDownloadUrl: '',
              googleDocUrl: '',
              isGenerating: false,
              error: resume?.error || 'Generation failed',
            });
          }
        });
        return newMap;
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Batch generation failed');
      }

      const successful = result.summary?.successful ?? resultsByJobId.size;
      const failed = jobsWithSummaries.length - successful;
      toast.success('Resumes Generated', {
        description: `Generated ${successful} resume${successful === 1 ? '' : 's'}${failed > 0 ? `, ${failed} failed` : ''}`,
        duration: 5000,
      });
    } catch (error: any) {
      // Safety net — clear any remaining isGenerating flags not already resolved above
      setResumes(prev => {
        const newMap = new Map(prev);
        jobsWithSummaries.forEach(job => {
          const current = newMap.get(job._id);
          if (current?.isGenerating) {
            newMap.set(job._id, { pdfUrl: '', pdfDownloadUrl: '', googleDocUrl: '', isGenerating: false, error: 'Generation failed' });
          }
        });
        return newMap;
      });
      toast.error('Batch Resume Generation Failed', {
        description: error.message || 'Failed to generate resumes. Please try again.',
        duration: 5000,
      });
    }
  };

  // Generate emails via orchestrator preview mode — what you see is exactly what gets sent
  const handleGenerateEmails = async () => {
    if (selectedJobsList.length === 0) return;

    setIsGeneratingEmails(true);
    try {
      const jobIds = selectedJobsList.map(job => job._id);

      // Collect summaries for selected jobs
      const jobSummaries: Record<string, string> = {};
      jobIds.forEach(jobId => {
        const s = summaries.get(jobId);
        if (s?.summary) jobSummaries[jobId] = s.summary;
      });

      // Trigger orchestrator in preview mode: discovers emails → generates AI emails → stores in Redis
      const result = await generateEmailPreview(jobIds, undefined, jobSummaries);

      if (result.success && result.data?.progressId) {
        setEmailProgressId(result.data.progressId);

        // Poll until emails are ready in Redis
        let attempts = 0;
        const maxAttempts = 60;

        const pollForEmails = async () => {
          try {
            const previewResult = await getEmailPreview(result.data.progressId);

            if (previewResult?.success && previewResult.data?.emails?.length > 0) {
              setEmailPreview(previewResult.data.emails);
              setIsGeneratingEmails(false);
              toast.success('Emails Generated', {
                description: `Generated ${previewResult.data.emails.length} personalized email${previewResult.data.emails.length === 1 ? '' : 's'}`,
                duration: 3000,
              });
              return;
            }

            if (previewResult?.status && previewResult.status >= 500) {
              setIsGeneratingEmails(false);
              toast.error('Email Preview Failed', {
                description: previewResult.error || 'There was a problem generating email previews. Please try again.',
                duration: 5000,
              });
              return;
            }
          } catch (error) {
            console.error('Failed to get email preview:', error);
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollForEmails, 2000);
          } else {
            setIsGeneratingEmails(false);
            toast.error('Email Generation Timeout', {
              description: 'Emails are still being generated. Please try again in a moment.',
              duration: 5000,
            });
          }
        };

        setTimeout(pollForEmails, 3000);
      } else {
        setIsGeneratingEmails(false);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to generate emails. Please try again.';
      setIsGeneratingEmails(false);
      toast.error('Email Generation Failed', { description: errorMsg, duration: 5000 });
    }
  };

  // Handle email update — sync to backend so the same content gets sent
  const handleEmailUpdate = async (emailIndex: number, subject: string, body: string, recipientEmail?: string) => {
    if (!emailProgressId) return;
    try {
      const result = await updateEmail(emailProgressId, emailIndex, subject, body);
      if (result.success) {
        setEmailPreview(prev => prev.map(email =>
          email.emailIndex === emailIndex
            ? {
                ...email,
                subject,
                body,
                recipientEmail: recipientEmail || email.recipientEmail,
                lastModified: new Date().toISOString(),
                isPlaceholder: recipientEmail ? false : email.isPlaceholder,
              }
            : email
        ));
      }
    } catch (error) {
      console.error('Failed to update email:', error);
      throw error;
    }
  };

  // Handle email regenerate — uses backend to regenerate the same email
  const handleEmailRegenerate = async (emailIndex: number) => {
    if (!emailProgressId) return;
    try {
      const result = await regenerateEmail(emailProgressId, emailIndex);
      if (result.success && result.data) {
        setEmailPreview(prev => prev.map(email =>
          email.emailIndex === emailIndex
            ? { ...email, subject: result.data.subject, body: result.data.body, generatedAt: result.data.generatedAt }
            : email
        ));
        toast.success('Email Regenerated', { description: 'The email has been regenerated with AI', duration: 3000 });
      }
    } catch (error) {
      console.error('Failed to regenerate email:', error);
      toast.error('Regeneration Failed', { description: 'Failed to regenerate email. Please try again.', duration: 5000 });
      throw error;
    }
  };

  // Handle removing a single email/application (for unverified emails)
  const handleRemoveEmailApplication = (emailIndex: number, jobId: string) => {
    setEmailPreview(prev => prev.filter(email => email.emailIndex !== emailIndex));
    setResumes(prev => { const m = new Map(prev); m.delete(jobId); return m; });
    setSummaries(prev => { const m = new Map(prev); m.delete(jobId); return m; });
    toggleJobSelection(jobId);
    toast.info('Application removed', {
      description: 'This job has been removed from your current email batch.',
      duration: 3000,
    });
  };

  // Handle finalize and send — backend sends the exact previewed emails from Redis
  const handleFinalizeEmails = async () => {
    if (!emailProgressId) return;

    setApplying(true);
    try {
      // Build mapping of jobId -> pdfDownloadUrl for resumes that were generated
      const resumeDownloads: Record<string, string> = {};
      emailPreview.forEach(email => {
        const resumeState = resumes.get(email.jobId);
        if (resumeState?.pdfDownloadUrl) {
          resumeDownloads[email.jobId] = resumeState.pdfDownloadUrl;
        }
      });

      // Require resumes for all jobs before sending
      if (emailPreview.length > 1) {
        const jobsWithoutResume = emailPreview.filter(email => !resumeDownloads[email.jobId]);
        if (jobsWithoutResume.length > 0) {
          setApplying(false);
          toast.error('Resume Required', {
            description: 'Please generate resumes for all selected jobs before sending emails.',
            duration: 5000,
          });
          return;
        }
      }

      const result = await finalizeEmails(
        emailProgressId,
        resumeDownloads,
        emailPreview.map(e => e.jobId)
      );

      if (result.success) {
        const queued = result.data?.queued ?? 0;
        const failed = result.data?.failed ?? 0;

        setShowBulkModal(false);
        setEmailPreview([]);
        setEmailProgressId(null);
        clearSelection();
        setEmailSuccessSummary({ queued, failed });
        setShowEmailSuccessModal(true);
        fetchQuota();
      }
    } catch (err) {
      console.error('Finalize failed:', err);
      const error = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
      const status = error.response?.status;
      const errCode = error.response?.data?.error;

      if (status === 429) {
        const quotaMessages: Record<string, string> = {
          batch_cooldown: 'Your next batch is available after the 6-hour cooldown.',
          daily_limit_reached: 'Daily limit of 20 applications reached. Resets at midnight UTC.',
          max_batches_reached: 'Both batches used for today. Come back tomorrow!',
        };
        toast.warning('Batch Limit Reached', {
          description: quotaMessages[errCode ?? ''] ?? error.response?.data?.message ?? 'Quota exceeded.',
          duration: 7000,
        });
        fetchQuota();
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to send emails. Please try again.';
        toast.error('Send Failed', { description: errorMsg, duration: 5000 });
      }
    } finally {
      setApplying(false);
    }
  };

  const handleProgressComplete = (successful: number, failed: number, skipped?: number) => {
    console.log('✅ [handleProgressComplete] Called - Modal will remain open, only clearing selection');

    // If this progress run came from "Send All", move to the new success modal UX.
    if (showEmailSuccessAfterProgress) {
      clearSelection();
      setShowProgressModal(false);
      setProgressId(null);
      setShowEmailSuccessAfterProgress(false);

      if (successful === 0 && failed === 0 && skipped && skipped > 0) {
        toast.warning('Already Applied', {
          description: `You've already applied to ${skipped === 1 ? 'this job' : `all ${skipped} jobs`} within the last 30 days. You can reapply after the waiting period.`,
          duration: 6000,
        });
        return;
      }

      setEmailSuccessSummary({ queued: successful, failed });
      setShowEmailSuccessModal(true);
      return;
    }
    
    // IMPORTANT: Do NOT close the modal here
    // The modal must stay open until the user explicitly clicks the "Close" button
    // Only clear the selection for next use
    clearSelection();
    
    // Show appropriate toast notification (non-blocking)
    // Case 1: All jobs were already applied (skipped)
    if (successful === 0 && failed === 0 && skipped && skipped > 0) {
      toast.warning('Already Applied', {
        description: `You've already applied to ${skipped === 1 ? 'this job' : `all ${skipped} jobs`} within the last 30 days. You can reapply after the waiting period.`,
        duration: 6000,
      });
      return;
    }
    
    // Case 2: Some successful applications
    if (successful > 0) {
      // Bust the recommendations cache so dashboard re-fetches without applied jobs
      try { localStorage.removeItem('dashboard_recommendations'); } catch (_) {}
      toast.success(`Successfully Applied!`, {
        description: `${successful} application${successful > 1 ? 's' : ''} sent successfully${failed > 0 ? `, ${failed} failed` : ''}${skipped && skipped > 0 ? `, ${skipped} skipped (already applied)` : ''}.`,
        duration: 5000,
      });
      return;
    }
    
    // Case 3: All failed
    if (failed > 0) {
      toast.error('Applications Failed', {
        description: 'All applications failed to send. Please try again.',
        duration: 5000,
      });
    }
    
    // NOTE: Modal remains open - user must click "Close" button
    // This ensures they can review the results before closing
  };
  
  const handleModalClose = () => {
    console.log('🚪 [handleModalClose] User clicked Close button - closing modal');
    setShowProgressModal(false);
    setProgressId(null);
    setShowEmailSuccessAfterProgress(false);
    // Selection is already cleared in handleProgressComplete
  };

  // Calculate valid summary count (only for currently selected jobs)
  const validSummaryCount = scopedSelectedJobIds.filter(jobId => {
    const summaryState = summaries.get(jobId);
    return summaryState && summaryState.summary && summaryState.summary.trim().length > 0;
  }).length;

  // Determine if user can generate emails:
  // All selected jobs must have a professional summary and a generated resume.
  const canGenerateEmails = selectedJobsList.length > 0 && selectedJobsList.every(job => {
    const summaryState = summaries.get(job._id);
    const resumeState = resumes.get(job._id);
    const hasSummary =
      summaryState &&
      typeof summaryState.summary === 'string' &&
      summaryState.summary.trim().length > 0;
    const hasResume =
      !!resumeState &&
      typeof resumeState.pdfDownloadUrl === 'string' &&
      resumeState.pdfDownloadUrl.trim().length > 0;
    return hasSummary && hasResume;
  });
  const jobStates: Record<string, ApplyJobsModalJobState> = useMemo(() => {
    const states: Record<string, ApplyJobsModalJobState> = {};
    selectedJobsList.forEach(job => {
      const summaryState = summaries.get(job._id);
      const resumeState = resumes.get(job._id);
      states[job._id] = {
        summary: summaryState?.summary,
        summaryIsGenerating: summaryState?.isGenerating,
        summaryIsEdited: summaryState?.isEdited,
        resumeIsGenerating: resumeState?.isGenerating ?? false,
        resumePdfUrl: resumeState?.pdfUrl
          ? getProxyPdfUrl(resumeState.pdfDownloadUrl)
          : undefined,
        resumeProxyPdfUrl: resumeState?.pdfDownloadUrl
          ? getProxyPdfUrl(resumeState.pdfDownloadUrl)
          : undefined,
        resumeGoogleDocUrl: resumeState?.googleDocUrl,
        resumeDownloadUrl: resumeState?.pdfDownloadUrl
          ? getProxyPdfUrl(resumeState.pdfDownloadUrl)
          : undefined,
        resumeError: resumeState?.error,
      };
    });
    return states;
  }, [selectedJobsList, summaries, resumes]);


  // CRITICAL: Don't return null if modal is open - that would unmount the modal!
  // Keep the component mounted as long as the progress modal or email success modal is visible
  if (scopedSelectedCount === 0 && !showProgressModal && !showEmailSuccessModal) {
    return null;
  }

  return (
    <>
      {/* Bottom Action Bar - Only show if jobs are selected AND modal is not open */}
      {scopedSelectedCount > 0 && !showProgressModal && !showBulkModal && (
        <SelectedJobsActionBar
          selectedCount={scopedSelectedCount}
          onApply={() => setShowBulkModal(true)}
          onDismiss={clearSelection}
          quota={quota}
          isQuotaLoading={isQuotaLoading}
        />
      )}
{/* Bulk Apply Modal - new mobile-first bottom sheet */}
<ApplyJobsModal
  open={showBulkModal}
  onOpenChange={(open) => {
    if (!open) {
      setShowBulkModal(false);
      // Do NOT clear emailPreview here — emails persist across modal open/close
      setEmailProgressId(null);
    }
  }}
  jobs={selectedJobsList.map(job => ({
    id: job._id,
    title: job.title,
    company: job.company,
    location: job.location,
  }))}
  summaryCount={validSummaryCount}
  resumeCount={Array.from(resumes.values()).filter(r => r.pdfUrl).length}
  jobStates={jobStates}
  emailPreview={emailPreview}
  isGeneratingEmails={isGeneratingEmails}
  canGenerateEmails={canGenerateEmails}
  onGenerateSummaries={handleGenerateAllSummaries}
  onGenerateResumes={handleGenerateAllResumes}
  onGenerateSummaryForJob={(jobId) => {
    const job = jobs.find(j => j._id === jobId);
    if (job) handleGenerateSummary(job);
  }}
  onGenerateResumeForJob={(jobId) => {
    const job = jobs.find(j => j._id === jobId);
    if (job) handleGenerateResume(job);
  }}
  onGenerateEmails={handleGenerateEmails}
  onUpdateEmail={handleEmailUpdate}
  onRegenerateEmail={handleEmailRegenerate}
  onRemoveEmailApplication={handleRemoveEmailApplication}
  onFinalizeEmails={handleFinalizeEmails}
  applying={applying}
  verifiedSentCount={quota?.verifiedSentCount ?? 0}
/>



      {/* Application Progress Modal */}
      {showProgressModal && progressId && (
        <ApplicationProgressModal
          progressId={progressId}
          totalJobs={scopedSelectedCount}
          onComplete={handleProgressComplete}
          onClose={handleModalClose}
        />
      )}

      {showEmailSuccessModal && emailSuccessSummary && (
        <EmailApplicationSuccessModal
          queued={emailSuccessSummary.queued}
          failed={emailSuccessSummary.failed}
          quota={quota}
          onClose={() => {
            setShowEmailSuccessModal(false);
            // Refresh quota so the post-apply strip reflects the new batch state
            fetchQuota();
          }}
        />
      )}
    </>
  );
}

