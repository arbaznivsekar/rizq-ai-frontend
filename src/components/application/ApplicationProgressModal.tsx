'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Loader2,
  Send,
  Clock,
  XCircle
} from 'lucide-react';
import { getBulkApplicationProgress } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';

interface ApplicationProgressModalProps {
  progressId: string;
  totalJobs: number;
  onComplete: (successful: number, failed: number, skipped?: number) => void;
  onClose: () => void;
}

export function ApplicationProgressModal({
  progressId,
  totalJobs,
  onComplete,
  onClose
}: ApplicationProgressModalProps) {
  const confettiRef = useRef<ConfettiRef>(null);
  const completionHandledRef = useRef(false); // Prevent duplicate completion calls
  const [progress, setProgress] = useState({
    total: totalJobs,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    status: 'Initializing...',
    isComplete: false
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let isMounted = true; // Track if component is still mounted

    const pollProgress = async () => {
      if (!isMounted) return; // Don't update state if unmounted
      
      try {
        const result = await getBulkApplicationProgress(progressId);
        
        if (!isMounted) return; // Double-check after async operation
        
        if (result.success) {
          const data = result.data;
          setProgress({
            total: data.total || totalJobs,
            processed: data.processed || 0,
            successful: data.successful || 0,
            failed: data.failed || 0,
            skipped: data.skipped || 0,
            status: data.status || 'Processing...',
            isComplete: data.isComplete || false
          });

          if (data.isComplete && !completionHandledRef.current) {
            completionHandledRef.current = true; // Mark as handled
            clearInterval(intervalId);
            
            console.log('✅ Application process complete - modal will remain open until user closes it');
            
            // Fire confetti if there are successful applications
            if (data.successful > 0) {
              console.log('🎉 Firing dramatic paper bomb explosion! Successful applications:', data.successful);
              
              // Dramatic multi-burst "paper bomb explosion" effect
              // Burst 1: Center explosion (360° spread)
              setTimeout(() => {
                if (!isMounted) return;
                confettiRef.current?.fire({
                  particleCount: 300,
                  spread: 360,
                  origin: { x: 0.5, y: 0.5 },
                  startVelocity: 45,
                  decay: 0.9,
                  scalar: 1.5,
                  colors: [
                    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
                    '#0000FF', '#4B0082', '#9400D3', '#FF1493',
                    '#00CED1', '#FFD700', '#FF69B4', '#32CD32'
                  ],
                  shapes: ['square', 'circle'],
                  zIndex: 9999
                });
                console.log('💥 Burst 1: Center explosion fired!');
              }, 100);
              
              // Burst 2: Secondary explosion (250ms delay)
              setTimeout(() => {
                if (!isMounted) return;
                confettiRef.current?.fire({
                  particleCount: 180,
                  spread: 360,
                  origin: { x: 0.5, y: 0.5 },
                  startVelocity: 50,
                  decay: 0.92,
                  scalar: 1.5,
                  colors: [
                    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
                    '#0000FF', '#4B0082', '#9400D3', '#FF1493',
                    '#00CED1', '#FFD700', '#FF69B4', '#32CD32'
                  ],
                  shapes: ['square', 'circle'],
                  zIndex: 9999
                });
                console.log('💥 Burst 2: Secondary explosion fired!');
              }, 350);
              
              // Burst 3: Final explosion (250ms delay from burst 2)
              setTimeout(() => {
                if (!isMounted) return;
                confettiRef.current?.fire({
                  particleCount: 170,
                  spread: 360,
                  origin: { x: 0.5, y: 0.5 },
                  startVelocity: 55,
                  decay: 0.94,
                  scalar: 1.5,
                  colors: [
                    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
                    '#0000FF', '#4B0082', '#9400D3', '#FF1493',
                    '#00CED1', '#FFD700', '#FF69B4', '#32CD32'
                  ],
                  shapes: ['square', 'circle'],
                  zIndex: 9999
                });
                console.log('💥 Burst 3: Final explosion fired!');
              }, 600);
            } else {
              console.log('No successful applications, skipping confetti');
            }
            
            // Call completion handler - BUT DO NOT CLOSE MODAL
            // Modal stays open until user explicitly clicks "Close" button
            // The onComplete callback only triggers toast notifications and clears selection
            setTimeout(() => {
              if (isMounted) {
                onComplete(data.successful || 0, data.failed || 0, data.skipped || 0);
              }
            }, 500); // Short delay just for confetti to start
          }
        }
      } catch (error) {
        console.error('Failed to get progress:', error);
      }
    };

    // Initial call
    pollProgress();
    
    // Poll every 2 seconds
    intervalId = setInterval(pollProgress, 2000);

    return () => {
      isMounted = false; // Mark as unmounted
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressId, totalJobs]); // Removed onComplete from deps to prevent re-initialization

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.processed / progress.total) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Confetti Canvas - positioned to cover the entire viewport */}
      <Confetti
        ref={confettiRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 9999 }}
        manualstart={true}
      />
      
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-200 relative z-10">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            {progress.isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            )}
            {progress.isComplete ? 'Applications Sent!' : 'Processing Applications'}
          </CardTitle>
          <CardDescription>
            {progress.status}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{progress.processed} of {progress.total}</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Stats */}
          {progress.isComplete && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {progress.successful}
                    </div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-700">
                      {progress.failed}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>
              </div>
              {progress.skipped > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 col-span-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold text-orange-700">
                        {progress.skipped}
                      </div>
                      <div className="text-sm text-orange-600">Already Applied (within 30 days)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          <div className={`p-4 border rounded-lg ${
            progress.isComplete && progress.skipped > 0 && progress.successful === 0 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {progress.isComplete ? (
                progress.skipped > 0 && progress.successful === 0 ? (
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <Send className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                )
              ) : (
                <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm text-slate-700">
                {progress.isComplete ? (
                  progress.skipped > 0 && progress.successful === 0 ? (
                    <p>You&apos;ve already applied to {progress.skipped === 1 ? 'this job' : 'these jobs'} within the last 30 days. Please wait for the reapplication period to end.</p>
                  ) : (
                    <p>Your applications have been sent and are being delivered to employers.</p>
                  )
                ) : (
                  <p>We&apos;re preparing your applications and sending them to employers. This usually takes 1-2 minutes.</p>
                )}
              </div>
            </div>
          </div>

          {/* Close Button (only shown when complete) */}
          {progress.isComplete && (
            <Button onClick={onClose} className="w-full" size="lg">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


 