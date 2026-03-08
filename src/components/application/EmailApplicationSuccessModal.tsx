'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Send, XCircle, Clock, Mail } from 'lucide-react';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';

interface EmailApplicationSuccessModalProps {
  queued: number;
  failed: number;
  onClose: () => void;
}

export function EmailApplicationSuccessModal({
  queued,
  failed,
  onClose,
}: EmailApplicationSuccessModalProps) {
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
    const gmailUrl = 'https://mail.google.com/mail/u/0/#sent';
    setIsOpeningGmail(true);

    try {
      const newWindow = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // Popup blocked – best-effort fallback: copy URL and inform the user.
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(gmailUrl).catch(() => {
            // ignore clipboard failures
          });
        }
        // eslint-disable-next-line no-alert
        alert('We opened Gmail or copied the Gmail URL. If a new tab did not open, paste the URL into your browser.');
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
                    Check your Gmail inbox for confirmation emails.
                  </p>
                ) : (
                  <p>No applications were sent. Please review and try again.</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleOpenGmail}
              disabled={isOpeningGmail}
              aria-label="Open Gmail sent folder in a new tab"
              className="sm:min-w-[10rem]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.366l8.073-5.873C21.69 2.28 24 3.434 24 5.457z" fill="#4285F4"/>
                <path d="M0 5.457v.727l12 8.727 12-8.727v-.727c0-2.023-2.309-3.178-3.927-1.964L12 9.366 3.927 3.493C2.31 2.28 0 3.434 0 5.457z" fill="#34A853"/>
                <path d="M18.545 21.002h3.819c.904 0 1.636-.732 1.636-1.636v-6.545l-5.455 4.091v4.09z" fill="#FBBC04"/>
                <path d="M5.455 21.002V16.91L0 12.82v6.545c0 .904.732 1.636 1.636 1.636h3.819z" fill="#EA4335"/>
                <path opacity=".1" d="M18.545 11.002V21h3.819c.904 0 1.636-.732 1.636-1.636V11.73l-5.455-.728z" fill="#000"/>
                <path opacity=".1" d="M1.636 11.002A1.636 1.636 0 0 0 0 12.638v6.728c0 .904.732 1.636 1.636 1.636h3.819V11.73l-3.819-.728z" fill="#000"/>
              </svg>
              <span>{isOpeningGmail ? 'Opening Gmail…' : 'Open Gmail Sent Folder'}</span>
            </Button>

            <Button
              type="button"
              onClick={onClose}
              size="lg"
              className="sm:min-w-[8rem]"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

