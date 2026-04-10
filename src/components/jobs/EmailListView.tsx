'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, RefreshCw, Loader2, CheckCircle2, X } from 'lucide-react'; // Loader2 kept for isSaving badge

export interface EmailPreview {
  emailIndex: number;
  jobId: string;
  jobTitle: string;
  companyName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  generatedAt: string;
  lastModified?: string;
  isPlaceholder?: boolean;
}

interface EmailListViewProps {
  emails: EmailPreview[];
  onUpdate: (emailIndex: number, subject: string, body: string, recipientEmail?: string) => Promise<void>;
  onRegenerate: (emailIndex: number) => Promise<void>;
  isGenerating: boolean;
  onRemove: (emailIndex: number, jobId: string) => void;
}

export function EmailListView({
  emails,
  onUpdate,
  onRegenerate,
  isGenerating,
  onRemove,
}: EmailListViewProps) {
  const [editingStates, setEditingStates] = useState<Map<number, { subject: string; body: string; recipientEmail: string }>>(new Map());
  const [savingStates, setSavingStates] = useState<Set<number>>(new Set());
  const [regeneratingStates, setRegeneratingStates] = useState<Set<number>>(new Set());
  const [saveTimeouts, setSaveTimeouts] = useState<Map<number, NodeJS.Timeout>>(new Map());

  const initializeEditingState = (email: EmailPreview) => {
    if (!editingStates.has(email.emailIndex)) {
      setEditingStates(prev => {
        const newMap = new Map(prev);
        newMap.set(email.emailIndex, {
          subject: email.subject,
          body: email.body,
          recipientEmail: email.recipientEmail
        });
        return newMap;
      });
    }
  };

  const handleFieldChange = (emailIndex: number, field: 'subject' | 'body' | 'recipientEmail', value: string) => {
    const email = emails.find(e => e.emailIndex === emailIndex);
    if (email) {
      initializeEditingState(email);
    }

    setEditingStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(emailIndex) || {
        subject: email?.subject || '',
        body: email?.body || '',
        recipientEmail: email?.recipientEmail || ''
      };
      const updatedState = { ...current, [field]: value };
      newMap.set(emailIndex, updatedState);

      const existingTimeout = saveTimeouts.get(emailIndex);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeout = setTimeout(async () => {
        setSavingStates(prev => new Set(prev).add(emailIndex));
        try {
          await onUpdate(emailIndex, updatedState.subject, updatedState.body, updatedState.recipientEmail);
        } catch (error) {
          console.error('Failed to update email:', error);
        } finally {
          setSavingStates(prev => {
            const newSet = new Set(prev);
            newSet.delete(emailIndex);
            return newSet;
          });
        }
      }, 1000);

      setSaveTimeouts(prev => {
        const newMap = new Map(prev);
        newMap.set(emailIndex, timeout);
        return newMap;
      });

      return newMap;
    });
  };

  const handleRegenerate = async (emailIndex: number) => {
    setRegeneratingStates(prev => new Set(prev).add(emailIndex));
    try {
      await onRegenerate(emailIndex);
      setEditingStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(emailIndex);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to regenerate email:', error);
    } finally {
      setRegeneratingStates(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailIndex);
        return newSet;
      });
    }
  };

  if (emails.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Mail className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <p>No emails generated yet. Click "Generate Emails" to create personalized emails.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const editingState = editingStates.get(email.emailIndex) || {
          subject: email.subject,
          body: email.body,
          recipientEmail: email.recipientEmail
        };
        const isSaving = savingStates.has(email.emailIndex);
        const isRegenerating = regeneratingStates.has(email.emailIndex);
        const isEdited = email.lastModified && new Date(email.lastModified) > new Date(email.generatedAt);

        if (!editingStates.has(email.emailIndex)) {
          initializeEditingState(email);
        }

        return (
          <Card key={email.emailIndex} className="relative border-slate-200 overflow-hidden">

            {/* ✅ FIX 2: X button top-right corner for unverified emails */}
            {email.isPlaceholder && (
              <button
                type="button"
                onClick={() => onRemove(email.emailIndex, email.jobId)}
                disabled={isRegenerating || isGenerating}
                className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-muted hover:bg-destructive hover:text-white transition-colors disabled:opacity-50"
                title="Remove this application"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2">

                {/* Job title + company row */}
                <div className="min-w-0 pr-8">
                  <CardTitle className="text-base flex items-center gap-2 leading-snug">
                    <Building2 className="h-4 w-4 flex-shrink-0 text-slate-600" />
                    <span className="line-clamp-2">{email.jobTitle}</span>
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                    <span className="truncate max-w-[160px]">{email.companyName}</span>
                    {email.isPlaceholder && (
                      <Badge
                        variant="outline"
                        className="text-xs border-orange-300 text-orange-600 bg-orange-50 flex-shrink-0"
                        title="This email address is unverified and may not be delivered to the recruiter."
                      >
                        Unverified email
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {isEdited && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Edited
                    </Badge>
                  )}
                  {isSaving && (
                    <Badge variant="outline" className="text-xs">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                </div>

                {/* Regenerate button — full width, always visible */}
                <Button
                  size="sm"
                  variant={isRegenerating ? "secondary" : "outline"}
                  className="w-full transition-all"
                  onClick={() => handleRegenerate(email.emailIndex)}
                  disabled={isRegenerating || isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 transition-transform ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate Email'}
                </Button>

              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Subject</label>
                <Input
                  value={editingState.subject}
                  onChange={(e) => handleFieldChange(email.emailIndex, 'subject', e.target.value)}
                  placeholder="Email subject"
                  disabled={isRegenerating || isGenerating}
                  className="font-medium"
                />
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>{editingState.subject.length} characters</span>
                  <span>Recommended: 50-70 characters</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Body</label>
                <Textarea
                  value={editingState.body}
                  onChange={(e) => handleFieldChange(email.emailIndex, 'body', e.target.value)}
                  placeholder="Email body"
                  disabled={isRegenerating || isGenerating}
                  className="min-h-[200px] resize-none"
                />
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>{editingState.body.length} characters</span>
                  <span>Recommended: 150-250 words</span>
                </div>
              </div>
            </CardContent>

          </Card>
        );
      })}
    </div>
  );
}