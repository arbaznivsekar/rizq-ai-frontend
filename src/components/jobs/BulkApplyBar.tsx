'use client';

import { useState, useEffect,useMemo } from 'react';
import { useJobSelection } from '@/contexts/JobSelectionContext';
import { bulkApplyToJobs, generateProfessionalSummary, generateBatchResumes, generateEmailPreview, getEmailPreview, updateEmail, regenerateEmail, finalizeEmails } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, X, Loader2, Building2, MapPin,   Sparkles, RefreshCw, FileText, Download,  Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationProgressModal } from '@/components/application/ApplicationProgressModal';
import { EmailApplicationSuccessModal } from '@/components/application/EmailApplicationSuccessModal';
import { CompanyLogo } from '@/components/common/CompanyLogo';
import { EmailListView, EmailPreview } from './EmailListView';
import { SelectedJobsActionBar } from '@/components/jobs/SelectedJobsActionBar';
import {ApplyJobsModalJobState,} from '@/components/jobs/ApplyJobsModal';
import { ApplyJobsModal } from '@/components/jobs/ApplyJobsModal';
const MINIMUM_JOBS_REQUIRED = 1;

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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState(false);
  const [emailSuccessSummary, setEmailSuccessSummary] = useState<{ queued: number; failed: number } | null>(null);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<'summaries' | 'resumes' | 'emails'>('summaries');
  
  // Summary management
  const [summaries, setSummaries] = useState<Map<string, SummaryState>>(new Map());
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // Resume management
  const [resumes, setResumes] = useState<Map<string, ResumeState>>(new Map());
  const [isGeneratingAllResumes, setIsGeneratingAllResumes] = useState(false);
  
  // Email preview management
  const [emailPreview, setEmailPreview] = useState<EmailPreview[]>([]);
  const [isGeneratingEmails, setIsGeneratingEmails] = useState(false);
  const [emailProgressId, setEmailProgressId] = useState<string | null>(null);
  
  // Toggle job card expansion
  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };
  
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
  
  // Update summary text (user editing)
  const handleSummaryChange = (jobId: string, newSummary: string) => {
    setSummaries(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(jobId);
      newMap.set(jobId, {
        summary: newSummary,
        isGenerating: false,
        isEdited: true
      });
      return newMap;
    });
  };
  
  // Generate summaries for all selected jobs
  const handleGenerateAllSummaries = async () => {
    setIsGeneratingAll(true);
    const selectedJobsList = jobs.filter(job => selectedJobs.has(job._id));
    
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
    
    setIsGeneratingAll(false);
    
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
    const selectedJobsList = jobs.filter(job => selectedJobs.has(job._id));
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
    
    setIsGeneratingAllResumes(true);
    
    // Mark all as generating
    jobsWithSummaries.forEach(job => {
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
    });
    
    try {
      const jobsData = jobsWithSummaries.map(job => ({
        jobId: job._id,
        jobTitle: job.title,
        professionalSummary: summaries.get(job._id)!.summary
      }));
      
      const result = await generateBatchResumes(jobsData);
      
      if (result.success && result.resumes) {
        // Update state with all results
        result.resumes.forEach((resume: any) => {
          setResumes(prev => {
            const newMap = new Map(prev);
            if (resume.status === 'success') {
              newMap.set(resume.jobId, {
                pdfUrl: resume.pdfUrl || '',
                pdfDownloadUrl: resume.pdfDownloadUrl || '',
                googleDocUrl: resume.googleDocUrl || '',
                isGenerating: false,
                error: null
              });
            } else {
              newMap.set(resume.jobId, {
                pdfUrl: '',
                pdfDownloadUrl: '',
                googleDocUrl: '',
                isGenerating: false,
                error: resume.error || 'Generation failed'
              });
            }
            return newMap;
          });
        });
        
        const successful = result.summary.successful;
        const failed = result.summary.failed;
        
        toast.success('Resumes Generated', {
          description: `Generated ${successful} resumes${failed > 0 ? `, ${failed} failed` : ''}`,
          duration: 5000,
        });
      }
    } catch (error: any) {
      // Clear generating state for all
      jobsWithSummaries.forEach(job => {
        setResumes(prev => {
          const newMap = new Map(prev);
          newMap.set(job._id, {
            pdfUrl: '',
            pdfDownloadUrl: '',
            googleDocUrl: '',
            isGenerating: false,
            error: 'Generation failed'
          });
          return newMap;
        });
      });
      
      toast.error('Batch Resume Generation Failed', {
        description: error.message || 'Failed to generate resumes. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsGeneratingAllResumes(false);
    }
  };  

  // Generate emails in preview mode
  const handleGenerateEmails = async () => {
    if (selectedJobs.size === 0) return;

    setIsGeneratingEmails(true);
    try {
      const jobIds = Array.from(selectedJobs);
      
      // Collect summaries for selected jobs
      const jobSummaries: Record<string, string> = {};
      jobIds.forEach(jobId => {
        const summaryState = summaries.get(jobId);
        if (summaryState && summaryState.summary) {
          jobSummaries[jobId] = summaryState.summary;
        }
      });
      
      // Generate emails in preview mode
      const result = await generateEmailPreview(jobIds, undefined, jobSummaries);
      
      if (result.success && result.data?.progressId) {
        setEmailProgressId(result.data.progressId);
        
        // Poll for email preview
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds max wait (emails can take time to generate)
        
        const pollForEmails = async () => {
          try {
            const previewResult = await getEmailPreview(result.data.progressId);

            if (
              previewResult?.success &&
              previewResult.data?.emails &&
              previewResult.data.emails.length > 0
            ) {
              setEmailPreview(previewResult.data.emails);
              setActiveTab('emails');
              setIsGeneratingEmails(false); // Stop loading when emails are successfully retrieved
              toast.success('Emails Generated', {
                description: `Generated ${previewResult.data.emails.length} personalized emails`,
                duration: 3000,
              });
              return;
            }

            // If backend reported a hard error (5xx), stop polling and surface it
            if (previewResult?.status && previewResult.status >= 500) {
              setIsGeneratingEmails(false);
              toast.error('Email Preview Failed', {
                description:
                  previewResult.error ||
                  'There was a problem generating email previews. Please try again.',
                duration: 5000,
              });
              return;
            }

            // For 404/not-ready or generic "no data yet", just keep polling
            if (previewResult?.status === 404 || !previewResult?.success) {
              console.log(
                `Email preview not ready yet (attempt ${attempts + 1}/${maxAttempts})`
              );
            }
          } catch (error: any) {
            console.error('Failed to get email preview:', error);
          }

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollForEmails, 2000); // Poll every 2 seconds
          } else {
            setIsGeneratingEmails(false); // Stop loading on timeout
            toast.error('Email Generation Timeout', {
              description: 'Emails are still being generated. Please try again in a moment.',
              duration: 5000,
            });
          }
        };
        
        // Start polling after a short delay to allow backend to start processing
        setTimeout(pollForEmails, 3000);
      } else {
        // If no progressId was returned, stop loading immediately
        setIsGeneratingEmails(false);
      }
    } catch (err) {
      console.error('Email generation failed:', err);
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to generate emails. Please try again.';
      setIsGeneratingEmails(false); // Stop loading on error
      toast.error('Email Generation Failed', {
        description: errorMsg,
        duration: 5000,
      });
    }
    // Removed finally block - loading state is now managed in each code path
  };

  // Handle email update
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
                isPlaceholder: recipientEmail ? false : email.isPlaceholder // Clear placeholder flag if email was updated
              }
            : email
        ));
      }
    } catch (error) {
      console.error('Failed to update email:', error);
      throw error;
    }
  };

  // Handle email regenerate
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
        toast.success('Email Regenerated', {
          description: 'The email has been regenerated with AI',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to regenerate email:', error);
      toast.error('Regeneration Failed', {
        description: 'Failed to regenerate email. Please try again.',
        duration: 5000,
      });
      throw error;
    }
  };

  // Handle removing a single email/application (for unverified emails)
  const handleRemoveEmailApplication = (emailIndex: number, jobId: string) => {
    // Remove email preview entry
    setEmailPreview(prev => prev.filter(email => email.emailIndex !== emailIndex));

    // Clear resume for this job
    setResumes(prev => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });

    // Clear professional summary for this job
    setSummaries(prev => {
      const newMap = new Map(prev);
      newMap.delete(jobId);
      return newMap;
    });

    // Allow the user to re-use this slot by unselecting the job
    // so they can pick another job without losing other selections.
    toggleJobSelection(jobId);

    toast.info('Application removed', {
      description: 'This job has been removed from your current email batch.',
      duration: 3000,
    });
  };

  // Handle finalize and send emails
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

      // If multiple jobs are selected, require a generated resume for each
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
        emailPreview.map(email => email.jobId)
      );
      
      if (result.success) {
        const queued = result.data?.queued ?? 0;
        const failed = result.data?.failed ?? 0;

        toast.success('Applications Sent Successfully', {
          description: `${queued} application${queued === 1 ? '' : 's'} sent successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
          duration: 4000,
        });

        // Close bulk modal & clear state
        setShowBulkModal(false);
        setEmailPreview([]);
        setEmailProgressId(null);
        clearSelection();

        // Show success modal with confetti & stats
        setEmailSuccessSummary({ queued, failed });
        setShowEmailSuccessModal(true);
      }
    } catch (err) {
      console.error('Finalize failed:', err);
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to send emails. Please try again.';
      toast.error('Send Failed', {
        description: errorMsg,
        duration: 5000,
      });
    } finally {
      setApplying(false);
    }
  };

  const handleBulkApply = async () => {
    if (selectedJobs.size === 0) return;

    // Check minimum requirement
    if (selectedJobs.size < MINIMUM_JOBS_REQUIRED) {
      toast.error('Minimum Selection Required', {
        description: `Please select at least ${MINIMUM_JOBS_REQUIRED} jobs to apply. You have selected ${selectedJobs.size}.`,
        duration: 5000,
      });
      return;
    }

    setApplying(true);
    try {
      const jobIds = Array.from(selectedJobs);
      
      // Collect summaries for selected jobs
      const jobSummaries: Record<string, string> = {};
      jobIds.forEach(jobId => {
        const summaryState = summaries.get(jobId);
        if (summaryState && summaryState.summary) {
          jobSummaries[jobId] = summaryState.summary;
        }
      });
      
      // Call the new orchestrator endpoint
      const result = await bulkApplyToJobs(jobIds, undefined, jobSummaries);
      
      if (result.success && result.data?.progressId) {
        const alreadyApplied = result.data?.alreadyAppliedCount || 0;
        const willProcess = result.data?.totalJobs || 0;
        
        // Close confirmation modal
        setShowBulkModal(false);
        
        // Show progress tracking modal
        setProgressId(result.data.progressId);
        setShowProgressModal(true);
        
        // Only show immediate toast for cases where processing will happen
        // The "all already applied" case will show toast via handleProgressComplete
        if (alreadyApplied > 0 && willProcess > 0) {
          toast.info('Processing Applications', {
            description: `Processing ${willProcess} new applications. ${alreadyApplied} job${alreadyApplied > 1 ? 's were' : ' was'} skipped (already applied within 30 days).`,
            duration: 5000,
          });
        } else if (willProcess > 0) {
          toast.info('Processing Applications', {
            description: 'Your applications are being processed. This will take a moment.',
            duration: 3000,
          });
        }
        // Note: No toast for willProcess === 0 (all already applied)
        // Modal completion will show the warning toast
      }
    } catch (err) {
      console.error('Bulk apply failed:', err);
      const error = err as { response?: { data?: { error?: string; message?: string } } };
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to submit applications. Please try again.';
      toast.error('Application Failed', {
        description: errorMsg,
        duration: 5000,
      });
    } finally {
      setApplying(false);
    }
  };

  const handleProgressComplete = (successful: number, failed: number, skipped?: number) => {
    console.log('✅ [handleProgressComplete] Called - Modal will remain open, only clearing selection');
    
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
    // Selection is already cleared in handleProgressComplete
  };

  const selectedJobsList = jobs.filter(job => selectedJobs.has(job._id));
  const isMinimumMet = selectedJobs.size >= MINIMUM_JOBS_REQUIRED;
  const remaining = MINIMUM_JOBS_REQUIRED - selectedJobs.size;
  
  // Calculate valid summary count (only for currently selected jobs)
  const validSummaryCount = Array.from(selectedJobs).filter(jobId => {
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
  if (selectedJobs.size === 0 && !showProgressModal && !showEmailSuccessModal) {
    return null;
  }

  return (
    <>
      {/* Bottom Action Bar - Only show if jobs are selected AND modal is not open */}
      {selectedJobs.size > 0 && !showProgressModal && !showBulkModal && (
        <SelectedJobsActionBar
          selectedCount={selectedJobs.size}
          onApply={() => setShowBulkModal(true)}
          onDismiss={clearSelection}
        />
      )}
{/* Bulk Apply Modal - new mobile-first bottom sheet */}
<ApplyJobsModal
  open={showBulkModal}
  onOpenChange={(open) => {
    if (!open) {
      setShowBulkModal(false);
      setEmailPreview([]);
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
/>



      {/* Application Progress Modal */}
      {showProgressModal && progressId && (
        <ApplicationProgressModal
          progressId={progressId}
          totalJobs={selectedJobs.size}
          onComplete={handleProgressComplete}
          onClose={handleModalClose}
        />
      )}

      {showEmailSuccessModal && emailSuccessSummary && (
        <EmailApplicationSuccessModal
          queued={emailSuccessSummary.queued}
          failed={emailSuccessSummary.failed}
          onClose={() => setShowEmailSuccessModal(false)}
        />
      )}
    </>
  );
}

