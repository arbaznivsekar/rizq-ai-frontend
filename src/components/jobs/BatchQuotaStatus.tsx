'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle2, Lock, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { QuotaSummary } from '@/lib/api';

interface BatchQuotaStatusProps {
  quota: QuotaSummary | null;
  isLoading?: boolean;
}

/**
 * Formats a future ISO timestamp into a live HH:MM:SS countdown string.
 * Returns null when the target time has passed.
 */
function useCountdown(targetIso: string | undefined): string | null {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!targetIso) {
      setDisplay(null);
      return;
    }

    const tick = () => {
      const diffMs = new Date(targetIso).getTime() - Date.now();
      if (diffMs <= 0) {
        setDisplay(null);
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setDisplay(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return display;
}

export function BatchQuotaStatus({ quota, isLoading }: BatchQuotaStatusProps) {
  const cooldownCountdown = useCountdown(
    quota?.reason === 'batch_cooldown' ? quota.nextAvailableAt : undefined
  );
  const resetCountdown = useCountdown(
    quota?.reason === 'daily_limit_reached' || quota?.reason === 'max_batches_reached'
      ? quota.resetAt
      : undefined
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
        <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin flex-shrink-0" />
        <span className="text-xs text-gray-400">Checking quota…</span>
      </div>
    );
  }

  if (!quota) return null;

  const progressPct = Math.round((quota.usedToday / quota.dailyLimit) * 100);

  /* ── State A: Cooldown active ─────────────────────────────────────────── */
  if (quota.reason === 'batch_cooldown') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-700 truncate">
              Batch {quota.batchesUsed} complete
            </span>
          </div>
          {cooldownCountdown ? (
            <Badge
              variant="outline"
              className="text-xs font-mono border-amber-300 text-amber-700 bg-white flex-shrink-0 tabular-nums"
            >
              {cooldownCountdown}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-white flex-shrink-0">
              Ready
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <Progress value={progressPct} className="h-1.5" />
          <p className="text-xs text-amber-600">
            {quota.usedToday} / {quota.dailyLimit} used today · next batch in {quota.batchCooldownHours}h
          </p>
        </div>
      </div>
    );
  }

  /* ── State B: Daily limit or max batches reached ──────────────────────── */
  if (quota.reason === 'daily_limit_reached' || quota.reason === 'max_batches_reached') {
    const label =
      quota.reason === 'daily_limit_reached'
        ? 'Daily limit reached'
        : 'All batches used today';
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="text-xs font-medium text-red-700 truncate">{label}</span>
          </div>
          {resetCountdown && (
            <Badge
              variant="outline"
              className="text-xs font-mono border-red-300 text-red-700 bg-white flex-shrink-0 tabular-nums"
            >
              Resets {resetCountdown}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <Progress value={100} className="h-1.5" />
          <p className="text-xs text-red-600">
            {quota.usedToday} / {quota.dailyLimit} used · quota resets at midnight UTC
          </p>
        </div>
      </div>
    );
  }

  /* ── State C: Ready — show compact usage bar ──────────────────────────── */
  if (quota.batchesUsed > 0) {
    // Next batch is available — show a subtle "ready" strip
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="text-xs font-medium text-emerald-700 truncate">
              Batch {quota.batchesUsed + 1} available
            </span>
          </div>
          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-white flex-shrink-0">
            {quota.remainingToday} left
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={progressPct} className="h-1.5" />
          <p className="text-xs text-emerald-600">
            {quota.usedToday} / {quota.dailyLimit} used today · select {quota.batchSize} jobs to apply
          </p>
        </div>
      </div>
    );
  }

  /* ── State D: Fresh day — no batches used yet, subtle info strip ──────── */
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 truncate">
          {quota.batchesPerDay} batches available today
        </span>
        <Badge variant="outline" className="text-xs border-gray-200 text-gray-500 bg-white flex-shrink-0">
          {quota.dailyLimit} total
        </Badge>
      </div>
      <div className="space-y-1">
        <Progress value={0} className="h-1.5" />
        <p className="text-xs text-gray-400">
          Select {quota.batchSize} jobs · apply · wait 6 h · apply again
        </p>
      </div>
    </div>
  );
}
