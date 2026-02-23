'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X, 
  Mail, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Edit3,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailData {
  email: string;
  role: string;
  confidence_score: number;
  source: string;
  status: 'active' | 'bounced' | 'unverified';
}

interface CompanyEmailData {
  company: {
    name: string;
    domain?: string;
  };
  emails: EmailData[];
  cache: boolean;
  responseMs?: number;
  credits?: number;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
}

interface EmailReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJobs: Job[];
  emailData: CompanyEmailData[];
  onSendApplications: (applications: Array<{
    jobId: string;
    recipientEmail: string;
    subject: string;
    body: string;
  }>) => Promise<void>;
  isSending: boolean;
}

export function EmailReviewModal({
  isOpen,
  onClose,
  selectedJobs,
  emailData,
  onSendApplications,
  isSending
}: EmailReviewModalProps) {
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [emailSubjects, setEmailSubjects] = useState<Record<string, string>>({});
  const [emailBodies, setEmailBodies] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);

  // Initialize email content when modal opens
  useEffect(() => {
    if (isOpen && emailData.length > 0) {
      const initialSubjects: Record<string, string> = {};
      const initialBodies: Record<string, string> = {};
      const initialSelected: Set<string> = new Set();

      emailData.forEach(companyData => {
        companyData.emails.forEach(email => {
          const emailKey = `${companyData.company.name}-${email.email}`;
          initialSubjects[emailKey] = `Application for ${selectedJobs.find(job => job.company === companyData.company.name)?.title || 'Position'}`;
          initialBodies[emailKey] = generateEmailBody(companyData.company.name, selectedJobs.find(job => job.company === companyData.company.name));
          initialSelected.add(emailKey);
        });
      });

      setEmailSubjects(initialSubjects);
      setEmailBodies(initialBodies);
      setSelectedEmails(initialSelected);
    }
  }, [isOpen, emailData, selectedJobs]);

  const generateEmailBody = (companyName: string, job?: Job) => {
    return `Dear Hiring Manager,

I hope this email finds you well. I am writing to express my strong interest in the ${job?.title || 'position'} at ${companyName}.

With my background and experience, I believe I would be a valuable addition to your team. I am particularly drawn to ${companyName} because of [your specific reason - research the company].

I have attached my resume for your review and would welcome the opportunity to discuss how my skills and experience align with your needs.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
[Your Name]`;
  };

  const handleEmailToggle = (emailKey: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailKey)) {
      newSelected.delete(emailKey);
    } else {
      newSelected.add(emailKey);
    }
    setSelectedEmails(newSelected);
  };

  const handleSubjectChange = (emailKey: string, subject: string) => {
    setEmailSubjects(prev => ({ ...prev, [emailKey]: subject }));
  };

  const handleBodyChange = (emailKey: string, body: string) => {
    setEmailBodies(prev => ({ ...prev, [emailKey]: body }));
  };

  const getEmailKey = (companyName: string, email: string) => `${companyName}-${email}`;

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'recruiter': return '👥';
      case 'hr': return '🏢';
      case 'hiring_manager': return '👔';
      case 'talent_acquisition': return '🎯';
      default: return '📧';
    }
  };

  const handleSendApplications = async () => {
    const applications = Array.from(selectedEmails).map(emailKey => {
      const [companyName, email] = emailKey.split('-');
      const job = selectedJobs.find(job => job.company === companyName);
      return {
        jobId: job?._id || '',
        recipientEmail: email,
        subject: emailSubjects[emailKey] || '',
        body: emailBodies[emailKey] || ''
      };
    }).filter(app => app.jobId);

    if (applications.length === 0) {
      toast.error('No valid applications to send');
      return;
    }

    await onSendApplications(applications);
  };

  const totalEmails = emailData.reduce((sum, company) => sum + company.emails.length, 0);
  const selectedCount = selectedEmails.size;
  const totalCredits = emailData.reduce((sum, company) => sum + (company.credits || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Mail className="h-6 w-6 text-blue-600" />
                Email Outreach Review
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Review and customize your job application emails before sending
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isSending}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-slate-600">Companies</p>
                  <p className="text-2xl font-bold text-slate-900">{emailData.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-slate-600">Emails Found</p>
                  <p className="text-2xl font-bold text-slate-900">{totalEmails}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-slate-600">Selected</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedCount}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-slate-600">Credits Used</p>
                  <p className="text-2xl font-bold text-slate-900">{totalCredits}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Company Email Lists */}
          <div className="space-y-6">
            {emailData.map((companyData, companyIndex) => (
              <Card key={companyIndex} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        {companyData.company.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4" />
                        {selectedJobs.find(job => job.company === companyData.company.name)?.location}
                        {companyData.cache && (
                          <Badge variant="secondary" className="ml-2">
                            From Cache
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {companyData.emails.length} email{companyData.emails.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {companyData.emails.map((email, emailIndex) => {
                      const emailKey = getEmailKey(companyData.company.name, email.email);
                      const isSelected = selectedEmails.has(emailKey);
                      const isEditing = editingEmail === emailKey;

                      return (
                        <div
                          key={emailIndex}
                          className={`p-4 rounded-lg border transition-all ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleEmailToggle(emailKey)}
                              className="mt-1"
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{getRoleIcon(email.role)}</span>
                                <span className="font-semibold text-slate-900">{email.email}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getConfidenceColor(email.confidence_score)}`}
                                >
                                  {email.confidence_score}% confidence
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {email.role.replace('_', ' ')}
                                </Badge>
                              </div>

                              {isSelected && (
                                <div className="space-y-3 mt-3">
                                  <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                                      Subject Line
                                    </label>
                                    <div className="flex gap-2">
                                      <Input
                                        value={emailSubjects[emailKey] || ''}
                                        onChange={(e) => handleSubjectChange(emailKey, e.target.value)}
                                        placeholder="Enter email subject..."
                                        className="flex-1"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingEmail(isEditing ? null : emailKey)}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                                      Email Body
                                    </label>
                                    <Textarea
                                      value={emailBodies[emailKey] || ''}
                                      onChange={(e) => handleBodyChange(emailKey, e.target.value)}
                                      placeholder="Enter email body..."
                                      rows={6}
                                      className="resize-none"
                                    />
                                  </div>

                                  {showPreview && (
                                    <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                                      <h4 className="font-medium text-slate-900 mb-2">Preview:</h4>
                                      <div className="text-sm text-slate-700">
                                        <p className="font-semibold">Subject: {emailSubjects[emailKey]}</p>
                                        <div className="mt-2 whitespace-pre-wrap">
                                          {emailBodies[emailKey]}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>

        <div className="border-t p-6 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <p>Ready to send <strong>{selectedCount}</strong> application{selectedCount > 1 ? 's' : ''} to <strong>{emailData.length}</strong> companies</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              size="lg"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSendApplications}
              disabled={isSending || selectedCount === 0}
              size="lg"
              className="px-8"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending Applications...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send {selectedCount} Application{selectedCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}


