'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';

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
  isPlaceholder?: boolean; // Flag indicating email needs to be verified
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

  // Initialize editing states from emails
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

  // Debounced save function
  const handleFieldChange = (emailIndex: number, field: 'subject' | 'body' | 'recipientEmail', value: string) => {
    // Initialize if needed
    const email = emails.find(e => e.emailIndex === emailIndex);
    if (email) {
      initializeEditingState(email);
    }

    // Update local state and capture the new values for the timeout
    setEditingStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(emailIndex) || { 
        subject: email?.subject || '', 
        body: email?.body || '',
        recipientEmail: email?.recipientEmail || ''
      };
      const updatedState = {
        ...current,
        [field]: value
      };
      newMap.set(emailIndex, updatedState);
      
      // Clear existing timeout
      const existingTimeout = saveTimeouts.get(emailIndex);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout for auto-save (1 second debounce)
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
      // Clear editing state to use new values
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

        // Initialize editing state on mount
        if (!editingStates.has(email.emailIndex)) {
          initializeEditingState(email);
        }

        return (
          <Card key={email.emailIndex} className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-600" />
                    {email.jobTitle}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                    <span>{email.companyName}</span>
                    {email.isPlaceholder && (
                      <>
                        <span>•</span>
                        <Badge
                          variant="outline"
                          className="text-xs border-orange-300 text-orange-600 bg-orange-50"
                          title="This email address is unverified and may have a high chance of not being delivered to the recruiter."
                        >
                          Unverified email
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={isRegenerating || isGenerating}
                          onClick={() => onRemove(email.emailIndex, email.jobId)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRegenerate(email.emailIndex)}
                    disabled={isRegenerating || isGenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
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
