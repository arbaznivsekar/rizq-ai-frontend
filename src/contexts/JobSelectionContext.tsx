'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const JobSelectionContext = createContext<JobSelectionContextType | undefined>(undefined);

export function JobSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectedJobsData, setSelectedJobsData] = useState<Map<string, SelectedJobData>>(new Map());

  const toggleJobSelection = (jobId: string, jobData?: SelectedJobData) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });

    setSelectedJobsData(prev => {
      const next = new Map(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else if (jobData) {
        next.set(jobId, jobData);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedJobs(new Set());
    setSelectedJobsData(new Map());
  };

  const hasSelection = () => selectedJobs.size > 0;

  return (
    <JobSelectionContext.Provider
      value={{ selectedJobs, selectedJobsData, toggleJobSelection, clearSelection, hasSelection }}
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
