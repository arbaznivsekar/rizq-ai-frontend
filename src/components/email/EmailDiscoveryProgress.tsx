'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Simple Progress component inline
const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={`relative h-4 w-full overflow-hidden rounded-full bg-slate-200 ${className || ''}`}>
    <div
      className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
    />
  </div>
);
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Zap,
  Database
} from 'lucide-react';

interface EmailDiscoveryProgressProps {
  isVisible: boolean;
  totalCompanies: number;
  processedCompanies: number;
  emailsFound: number;
  creditsUsed: number;
  processingTime: number;
  cacheHits: number;
  cacheMisses: number;
  onComplete: () => void;
}

export function EmailDiscoveryProgress({
  isVisible,
  totalCompanies,
  processedCompanies,
  emailsFound,
  creditsUsed,
  processingTime,
  cacheHits,
  cacheMisses,
  onComplete
}: EmailDiscoveryProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (totalCompanies > 0) {
      const newProgress = (processedCompanies / totalCompanies) * 100;
      setProgress(newProgress);
      
      if (processedCompanies >= totalCompanies && !isComplete) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete();
        }, 2000); // Show completion state for 2 seconds
      }
    }
  }, [processedCompanies, totalCompanies, isComplete, onComplete]);

  if (!isVisible) return null;

  const progressPercentage = Math.round(progress);
  const isProcessing = processedCompanies < totalCompanies;
  const hitRate = cacheHits + cacheMisses > 0 ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            )}
            {isComplete ? 'Email Discovery Complete!' : 'Discovering Company Emails...'}
          </CardTitle>
          <CardDescription className="text-base">
            {isComplete 
              ? 'Successfully found emails for all companies. Ready to review and send applications.'
              : 'Analyzing companies and finding recruiter emails using Hunter.io API'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Progress</span>
              <span className="text-slate-600">{processedCompanies} of {totalCompanies} companies</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="text-center text-sm text-slate-600">
              {progressPercentage}% Complete
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Companies</p>
                  <p className="text-2xl font-bold text-slate-900">{totalCompanies}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Emails Found</p>
                  <p className="text-2xl font-bold text-slate-900">{emailsFound}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Credits Used</p>
                  <p className="text-2xl font-bold text-slate-900">{creditsUsed}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Time</p>
                  <p className="text-2xl font-bold text-slate-900">{Math.round(processingTime / 1000)}s</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Cache Performance */}
          <Card className="p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-700">Cache Performance</span>
              </div>
              <Badge variant="secondary" className="text-sm">
                {hitRate}% hit rate
              </Badge>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              <span className="text-green-600 font-medium">{cacheHits} cached</span>
              <span className="mx-2">•</span>
              <span className="text-orange-600 font-medium">{cacheMisses} from API</span>
            </div>
          </Card>

          {/* Status Messages */}
          <div className="space-y-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing companies and discovering emails...</span>
              </div>
            )}
            
            {isComplete && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>All companies processed successfully!</span>
              </div>
            )}

            {cacheHits > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Database className="h-4 w-4" />
                <span>Using cached emails where available to save API credits</span>
              </div>
            )}
          </div>

          {/* Processing Details */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700">
                  <p className="font-semibold mb-1">What's happening?</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>• Checking our database for cached company emails</li>
                    <li>• Using Hunter.io API to find new recruiter emails</li>
                    <li>• Validating email addresses and confidence scores</li>
                    <li>• Preparing personalized application templates</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
