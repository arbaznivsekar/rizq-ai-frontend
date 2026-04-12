'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

/** Maximum jobs selectable per batch (matches free-tier batchSize on the backend) */
export const MAX_BATCH_SIZE = 10;

export interface SelectedJobData {
  _id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  companyDomain?: string;
  logoUrl?: string;
  url?: string;
}

interface JobSelectionContextType {
  selectedJobs: Set<string>;
  selectedJobsData: Map<string, SelectedJobData>;
  toggleJobSelection: (jobId: string, jobData?: SelectedJobData) => void;
  clearSelection: () => void;
  hasSelection: () => boolean;
  /** True when the selection has reached MAX_BATCH_SIZE */
  isAtCapacity: () => boolean;
}

const JobSelectionContext = createContext<JobSelectionContextType | undefined>(undefined);

export function JobSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectedJobsData, setSelectedJobsData] = useState<Map<string, SelectedJobData>>(new Map());

  const toggleJobSelection = (jobId: string, jobData?: SelectedJobData) => {
    setSelectedJobs(prev => {
      // Deselect — always allowed
      if (prev.has(jobId)) {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      }

      // Select — enforce batch cap
      if (prev.size >= MAX_BATCH_SIZE) {
        toast.warning('Batch limit reached', {
          description: `You can select up to ${MAX_BATCH_SIZE} jobs per batch. Deselect a job to choose another.`,
          duration: 4000,
        });
        return prev; // no change
      }

      const next = new Set(prev);
      next.add(jobId);
      return next;
    });

    setSelectedJobsData(prev => {
      if (prev.has(jobId)) {
        const next = new Map(prev);
        next.delete(jobId);
        return next;
      }
      // Only add if we're not already at capacity (mirrors the set logic)
      if (prev.size >= MAX_BATCH_SIZE) return prev;
      if (!jobData) return prev;
      const next = new Map(prev);
      next.set(jobId, jobData);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedJobs(new Set());
    setSelectedJobsData(new Map());
  };

  const hasSelection = () => selectedJobs.size > 0;
  const isAtCapacity = () => selectedJobs.size >= MAX_BATCH_SIZE;

  return (
    <JobSelectionContext.Provider
      value={{ selectedJobs, selectedJobsData, toggleJobSelection, clearSelection, hasSelection, isAtCapacity }}
    >
      {children}
    </JobSelectionContext.Provider>
  );
}

export function useJobSelection() {
  const context = useContext(JobSelectionContext);
  if (context === undefined) {
    throw new Error('useJobSelection must be used within a JobSelectionProvider');
  }
  return context;
}
