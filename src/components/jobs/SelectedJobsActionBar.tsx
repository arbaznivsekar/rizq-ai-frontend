// SelectedJobsActionBar.tsx
'use client';

import { Zap, X } from 'lucide-react';
import { BatchQuotaStatus } from '@/components/jobs/BatchQuotaStatus';
import type { QuotaSummary } from '@/lib/api';
import { MAX_BATCH_SIZE } from '@/contexts/JobSelectionContext';

interface Props {
  selectedCount: number;
  onApply: () => void;
  onDismiss: () => void;
  quota: QuotaSummary | null;
  isQuotaLoading?: boolean;
}

export function SelectedJobsActionBar({
  selectedCount,
  onApply,
  onDismiss,
  quota,
  isQuotaLoading,
}: Props) {
  if (selectedCount === 0) return null;

  const needsMore = selectedCount < MAX_BATCH_SIZE;
  const remaining = MAX_BATCH_SIZE - selectedCount;

  // Button is disabled when:
  // 1. Not enough jobs selected yet (< 10)
  // 2. Quota is blocking (cooldown, daily limit, etc.)
  const quotaBlocked = quota !== null && !quota.canApply;
  const isDisabled = needsMore || quotaBlocked;

  let buttonLabel: string;
  if (needsMore) {
    buttonLabel = remaining === 1
      ? 'Select 1 more to apply'
      : `Select ${remaining} more to apply`;
  } else if (quotaBlocked) {
    buttonLabel = 'Apply Unavailable';
  } else {
    buttonLabel = `Apply ${selectedCount} Jobs Now`;
  }

  const showQuotaStatus = quota !== null || isQuotaLoading;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
      {/* Quota status strip — only shown when there is data or loading */}
      {showQuotaStatus && (
        <div className="px-4 pt-3">
          <BatchQuotaStatus quota={quota} isLoading={isQuotaLoading} />
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 min-w-0">
        {/* Selected count pill */}
        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{selectedCount}</span>
          </div>
          <span className="truncate">
            {selectedCount} / {MAX_BATCH_SIZE} selected
          </span>
        </div>

        {/* Main CTA */}
        <button
          onClick={onApply}
          disabled={isDisabled}
          className={[
            'flex-1 min-w-0 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold min-h-[44px] transition-all duration-150',
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-black text-white active:scale-95',
          ].join(' ')}
        >
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{buttonLabel}</span>
        </button>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 flex-shrink-0 active:bg-gray-100"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
