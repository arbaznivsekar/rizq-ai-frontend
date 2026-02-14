'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface JobSelectionContextType {
  selectedJobs: Set<string>;
  toggleJobSelection: (jobId: string) => void;
  clearSelection: () => void;
  hasSelection: () => boolean;
}

const JobSelectionContext = createContext<JobSelectionContextType | undefined>(undefined);

export function JobSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

  const toggleJobSelection = (jobId: string) => {
    const newSelection = new Set(selectedJobs);
    if (newSelection.has(jobId)) {
      newSelection.delete(jobId);
    } else {
      newSelection.add(jobId);
    }
    setSelectedJobs(newSelection);
  };

  const clearSelection = () => {
    setSelectedJobs(new Set());
  };

  const hasSelection = () => {
    return selectedJobs.size > 0;
  };

  return (
    <JobSelectionContext.Provider
      value={{
        selectedJobs,
        toggleJobSelection,
        clearSelection,
        hasSelection,
      }}
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


