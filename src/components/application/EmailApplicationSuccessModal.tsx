'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Send, XCircle, Clock, ExternalLink } from 'lucide-react';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';
import type { QuotaSummary } from '@/lib/api';

interface EmailApplicationSuccessModalProps {
  queued: number;
  failed: number;
  onClose: () => void;
  quota?: QuotaSummary | null;
}

export function EmailApplicationSuccessModal({
  queued,
  failed,
  onClose,
  quota,
}: EmailApplicationSuccessModalProps) {
  const router = useRouter();
  const confettiRef = useRef<ConfettiRef>(null);
  const [isOpeningGmail, setIsOpeningGmail] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti when modal mounts
    const ref = confettiRef.current;
    if (!ref) return;

    // Multi-burst celebration similar to ApplicationProgressModal
    const timeouts: NodeJS.Timeout[] = [];

    const scheduleBurst = (delay: number, options: Parameters<NonNullable<ConfettiRef>['fire']>[0]) => {
      const timeout = setTimeout(() => {
        ref?.fire(options);
      }, delay);
      timeouts.push(timeout);
    };

    scheduleBurst(100, {
      particleCount: 250,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      startVelocity: 45,
      decay: 0.9,
      scalar: 1.4,
      colors: [
        '#FF0000',
        '#FF7F00',
        '#FFFF00',
        '#00FF00',
        '#0000FF',
        '#4B0082',
        '#9400D3',
        '#FF1493',
        '#00CED1',
        '#FFD700',
        '#FF69B4',
        '#32CD32',
      ],
      shapes: ['square', 'circle'],
      zIndex: 9999,
    });

    scheduleBurst(350, {
      particleCount: 180,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      startVelocity: 50,
      decay: 0.92,
      scalar: 1.4,
      colors: [
        '#FF0000',
        '#FF7F00',
        '#FFFF00',
        '#00FF00',
        '#0000FF',
        '#4B0082',
        '#9400D3',
        '#FF1493',
        '#00CED1',
        '#FFD700',
        '#FF69B4',
        '#32CD32',
      ],
      shapes: ['square', 'circle'],
      zIndex: 9999,
    });

    scheduleBurst(600, {
      particleCount: 160,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      startVelocity: 55,
      decay: 0.94,
      scalar: 1.4,
      colors: [
        '#FF0000',
        '#FF7F00',
        '#FFFF00',
        '#00FF00',
        '#0000FF',
        '#4B0082',
        '#9400D3',
        '#FF1493',
        '#00CED1',
        '#FFD700',
        '#FF69B4',
        '#32CD32',
      ],
      shapes: ['square', 'circle'],
      zIndex: 9999,
    });

    return () => {
      // Clean up timeouts on unmount
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const total = queued + failed;
  const progressPercentage = total > 0 ? Math.round((queued / total) * 100) : 0;

  const handleOpenGmail = () => {
    setIsOpeningGmail(true);

    try {
      // Detect if user is on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobile: Try to open Gmail app
        if (isAndroid) {
          // Android - use intent to open Sent folder
          window.location.href = 'intent://mail.google.com/mail/u/0/#sent#Intent;scheme=https;package=com.google.android.gm;end';
        } else {
          // iOS - use googlegmail:// protocol (opens to main view, can't directly open Sent)
          window.location.href = 'googlegmail://';
        }
        
        // Fallback to web Gmail Sent folder if app doesn't open (after 1.5 seconds)
        setTimeout(() => {
          if (!document.hidden) {
            // App didn't open, fallback to mobile web Sent folder
            window.location.href = 'https://mail.google.com/mail/u/0/#sent';
          }
        }, 1500);
      } else {
        // Desktop: Open Sent folder in new tab
        const gmailUrl = 'https://mail.google.com/mail/u/0/#sent';
        const newWindow = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          // Popup blocked – fallback
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(gmailUrl).catch(() => {
              // ignore clipboard failures
            });
          }
          // eslint-disable-next-line no-alert
          alert('We opened Gmail or copied the Gmail URL. If a new tab did not open, paste the URL into your browser.');
        }
      }
    } finally {
      // Small delay so the loading state is perceptible but not sticky
      setTimeout(() => setIsOpeningGmail(false), 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Confetti overlay */}
      <Confetti
        ref={confettiRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 9999 }}
        manualstart={true}
      />

      <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 relative z-10">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Applications Sent!
          </CardTitle>
          <CardDescription>Complete</CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Progress Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>
                {total} of {total}
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">{queued}</div>
                  <div className="text-sm text-green-600">Successful</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-700">{failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Send className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-700">
                {queued > 0 ? (
                  <p>
                    Your applications have been sent and are being delivered to employers.{' '}
                    Check your Gmail Sent folder to confirm.
                  </p>
                ) : (
                  <p>No applications were sent. Please review and try again.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quota summary — shows batch usage + cooldown info right in the success card */}
          {quota && quota.batchesUsed > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-600">
                    Batch {quota.batchesUsed} of {quota.batchesPerDay} used today
                  </span>
                </div>
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-500 bg-white">
                  {quota.usedToday} / {quota.dailyLimit} apps
                </Badge>
              </div>
              {quota.reason === 'batch_cooldown' && quota.nextAvailableAt && (
                <p className="text-xs text-amber-600 pl-5">
                  Next batch unlocks at {new Date(quota.nextAvailableAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {quota.batchesUsed < quota.batchesPerDay && quota.reason !== 'batch_cooldown' && (
                <p className="text-xs text-emerald-600 pl-5">
                  Batch {quota.batchesUsed + 1} available — select {quota.batchSize} jobs to apply
                </p>
              )}
              {(quota.reason === 'daily_limit_reached' || quota.reason === 'max_batches_reached') && (
                <p className="text-xs text-red-500 pl-5">
                  Daily limit reached · resets at midnight UTC
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Primary action row */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleOpenGmail}
                disabled={isOpeningGmail}
                aria-label="Open Gmail sent folder"
                className="flex-1"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.366l8.073-5.873C21.69 2.28 24 3.434 24 5.457z" fill="#4285F4"/>
                  <path d="M0 5.457v.727l12 8.727 12-8.727v-.727c0-2.023-2.31-3.178-3.927-1.964L12 9.366 3.927 3.493C2.31 2.28 0 3.434 0 5.457z" fill="#34A853"/>
                  <path d="M18.545 11.73v9.273h3.819c.904 0 1.636-.732 1.636-1.636V11.73L12 16.64z" fill="#FBBC04"/>
                  <path d="M1.636 21.003h3.819V11.73L0 16.64v2.727c0 .904.732 1.636 1.636 1.636z" fill="#EA4335"/>
                  <path d="M12 16.64l-6.545-4.91v9.273h6.545V16.64z" fill="#C5221F"/>
                  <path d="M18.545 11.73L12 16.64v4.363h6.545V11.73z" fill="#C5221F"/>
                </svg>
                <span className="ml-2">{isOpeningGmail ? 'Opening…' : 'Open Gmail Sent'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => { onClose(); router.push('/applications'); }}
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                View Applications
              </Button>
            </div>

            <Button
              type="button"
              onClick={onClose}
              size="lg"
              className="w-full"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}