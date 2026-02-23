'use client';

import { useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Send, XCircle, Clock } from 'lucide-react';
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
                  <p>Your applications have been sent and are being delivered to employers.</p>
                ) : (
                  <p>No applications were sent. Please review and try again.</p>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          <Button onClick={onClose} className="w-full" size="lg">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

