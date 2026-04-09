// SelectedJobsActionBar.tsx
'use client'
import { Zap, X } from 'lucide-react'

interface Props {
  selectedCount: number
  onApply: () => void
  onDismiss: () => void
}

export function SelectedJobsActionBar({ selectedCount, onApply, onDismiss }: Props) {
  if (selectedCount === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-3 px-4 py-3 min-w-0">
        <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
          <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{selectedCount}</span>
          </div>
          <span className="truncate">{selectedCount} job{selectedCount > 1 ? 's' : ''} selected</span>
        </div>
        <button
          onClick={onApply}
          className="flex-1 min-w-0 flex items-center justify-center gap-2 bg-black text-white rounded-xl py-3 px-4 text-sm font-semibold min-h-[44px] active:scale-95 transition-transform"
        >
          <Zap className="w-4 h-4" />
          <span className="truncate">One-Click Apply to All</span>
        </button>
        <button
          onClick={onDismiss}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200 flex-shrink-0 active:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}

