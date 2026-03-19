import { useMemo, useState } from "react"
import { Sparkles, FileText, Loader2, Mail, Send, RefreshCw } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EmailListView, EmailPreview } from "./EmailListView"

type ApplyJobsModalJob = {
  id: string
  title: string
  company: string
  location: string
}

export interface ApplyJobsModalJobState {
  summary?: string
  summaryIsGenerating?: boolean
  summaryIsEdited?: boolean
  resumeIsGenerating?: boolean
  resumePdfUrl?: string
  resumeProxyPdfUrl?: string
  resumeGoogleDocUrl?: string
  resumeDownloadUrl?: string
  resumeError?: string | null
}

interface ApplyJobsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: ApplyJobsModalJob[]
  summaryCount: number
  resumeCount: number
  jobStates: Record<string, ApplyJobsModalJobState>
  emailPreview: EmailPreview[]
  isGeneratingEmails: boolean
  canGenerateEmails: boolean
  onGenerateSummaries: () => void
  onGenerateResumes: () => void
  onGenerateSummaryForJob: (jobId: string) => void
  onGenerateResumeForJob: (jobId: string) => void
  onGenerateEmails: () => void
  onUpdateEmail: (emailIndex: number, subject: string, body: string, recipientEmail?: string) => void
  onRegenerateEmail: (emailIndex: number) => void
  onRemoveEmailApplication: (emailIndex: number, jobId: string) => void
  onFinalizeEmails: () => void
  applying: boolean
}

export function ApplyJobsModal({
  open,
  onOpenChange,
  jobs,
  summaryCount,
  resumeCount,
  jobStates,
  emailPreview,
  isGeneratingEmails,
  canGenerateEmails,
  onGenerateSummaries,
  onGenerateResumes,
  onGenerateSummaryForJob,
  onGenerateResumeForJob,
  onGenerateEmails,
  onUpdateEmail,
  onRegenerateEmail,
  onRemoveEmailApplication,
  onFinalizeEmails,
  applying,
}: ApplyJobsModalProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "resumes" | "emails">("summary")

  const canSendEmails = useMemo(
    () => activeTab === "emails" && emailPreview.length > 0 && !isGeneratingEmails,
    [activeTab, emailPreview.length, isGeneratingEmails]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl px-0 pb-0 pt-3 h-[92vh] max-h-[92vh] flex flex-col border-none shadow-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-hidden sm:max-w-2xl lg:max-w-4xl">

          {/* Drag handle */}
          <div className="mx-auto mb-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted-foreground/30" />

          {/* Header */}
          <div className="flex-shrink-0 px-5 pb-4 bg-muted/50 rounded-t-3xl">
            <SheetHeader className="text-left">
              <div className="min-w-0">
                <SheetTitle className="text-base sm:text-lg font-semibold">
                  Apply to {jobs.length} Selected Job{jobs.length === 1 ? "" : "s"}
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                  Generate professional summaries tailored for each job
                </SheetDescription>
              </div>
            </SheetHeader>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={onGenerateSummaries}
              >
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Generate All Summaries</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={onGenerateResumes}
              >
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Generate All Resumes</span>
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground sm:text-[0.7rem]">
              {summaryCount} summaries | {resumeCount} resumes
            </p>
          </div>

          <Separator className="flex-shrink-0" />

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="flex flex-1 flex-col min-h-0 overflow-hidden"
          >
            <TabsList className="flex-shrink-0 w-full rounded-none border-b bg-transparent h-auto p-0 justify-start overflow-x-auto">
              <TabsTrigger
                value="summary"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none flex-shrink-0 px-4 py-3 text-sm sm:text-base font-medium"
              >
                Professional Summary
              </TabsTrigger>
              <TabsTrigger
                value="resumes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none flex-shrink-0 px-4 py-3 text-sm sm:text-base font-medium"
              >
                Resumes
              </TabsTrigger>
              <TabsTrigger
                value="emails"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none flex-shrink-0 px-4 py-3 text-sm sm:text-base font-medium"
              >
                Emails
              </TabsTrigger>
            </TabsList>

            {/* Scrollable content area */}
            <ScrollArea className="flex-1 min-h-0">

              {/* Summary Tab */}
              <TabsContent value="summary" className="mt-0 space-y-3 p-4">
                {jobs.map((job, i) => {
                  const state = jobStates[job.id] || {}
                  const hasSummary = !!state.summary && state.summary.trim().length > 0

                  return (
                    <div
                      key={job.id}
                      className="flex flex-col gap-3 rounded-2xl border bg-card/60 px-3 py-3 shadow-sm overflow-hidden"
                    >
                      {/* Job info row */}
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug line-clamp-2">
                            {job.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {job.company} · {job.location}
                          </p>
                        </div>
                      </div>

                      {/* Button — full width so always visible */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={state.summaryIsGenerating}
                        onClick={() => onGenerateSummaryForJob(job.id)}
                      >
                        {state.summaryIsGenerating ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Generating...
                          </>
                        ) : hasSummary ? (
                          <>
                            <RefreshCw className="mr-1 h-3 w-3" />
                            Regenerate Summary
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1 h-3 w-3" />
                            Generate Summary
                          </>
                        )}
                      </Button>

                      {state.summaryIsGenerating && (
                        <p className="text-[11px] text-muted-foreground">
                          Creating an AI-powered summary for this job...
                        </p>
                      )}

                      {hasSummary && !state.summaryIsGenerating && (
                        <div className="rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground max-h-32 overflow-y-auto">
                          <p className="whitespace-pre-wrap leading-snug">
                            {state.summary}
                          </p>
                          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/80">
                            <span>
                              {(state.summary || "").length} characters
                              {state.summaryIsEdited ? " • edited" : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </TabsContent>

              {/* Resumes Tab */}
              <TabsContent value="resumes" className="mt-0 space-y-3 p-4">
                {jobs.map((job, i) => {
                  const state = jobStates[job.id] || {}
                  const hasResume = !!state.resumePdfUrl

                  return (
                    <div
                      key={job.id}
                      className="flex flex-col gap-3 rounded-2xl border bg-card/60 px-3 py-3 shadow-sm overflow-hidden"
                    >
                      {/* Job info row */}
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug line-clamp-2">
                            {job.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {job.company} · {job.location}
                          </p>
                        </div>
                      </div>

                      {/* Generate button — full width */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={state.resumeIsGenerating}
                        onClick={() => onGenerateResumeForJob(job.id)}
                      >
                        {state.resumeIsGenerating ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Generating Resume...
                          </>
                        ) : hasResume ? (
                          <>
                            <FileText className="mr-1 h-3 w-3" />
                            Regenerate Resume
                          </>
                        ) : (
                          <>
                            <FileText className="mr-1 h-3 w-3" />
                            Generate Resume
                          </>
                        )}
                      </Button>

                      {state.resumeIsGenerating && (
                        <p className="text-[11px] text-muted-foreground">
                          Creating a tailored resume for this job...
                        </p>
                      )}

                      {hasResume && !state.resumeIsGenerating && (
                        <div className="space-y-2">
                          {/* PDF preview — full width, constrained height */}
                          {(state.resumePdfUrl || state.resumeProxyPdfUrl) && (
                            <div className="w-full h-48 overflow-hidden rounded-lg border bg-muted">
                              <iframe
                                src={state.resumePdfUrl || state.resumeProxyPdfUrl}
                                className="h-full w-full"
                                title={`Resume preview for ${job.title}`}
                              />
                            </div>
                          )}
                          {/* Action buttons — side by side, full width */}
                          <div className="grid grid-cols-2 gap-2">
                            {(state.resumeDownloadUrl || state.resumePdfUrl || state.resumeProxyPdfUrl) && (
                              <a
                                href={
                                  state.resumeDownloadUrl ||
                                  state.resumePdfUrl ||
                                  state.resumeProxyPdfUrl!
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-full items-center justify-center rounded-md border text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                Download PDF
                              </a>
                            )}
                            {(state.resumeDownloadUrl || state.resumeProxyPdfUrl || state.resumePdfUrl) && (
                              <a
                                href={state.resumeDownloadUrl || state.resumeProxyPdfUrl || state.resumePdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-8 w-full items-center justify-center rounded-md border text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                              >
                                Open in New Tab
                              </a>
                            )}
                          </div>
                          {state.resumeError && (
                            <p className="text-[11px] text-destructive">
                              {state.resumeError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </TabsContent>

              {/* Emails Tab */}
              <TabsContent value="emails" className="mt-0 p-4">
                {emailPreview.length === 0 && !isGeneratingEmails ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Generate personalized emails</p>
                      <p className="text-xs text-muted-foreground">
                        Create tailored outreach emails for each selected job before sending.
                      </p>
                    </div>
                    <Button
                      onClick={onGenerateEmails}
                      disabled={isGeneratingEmails || !canGenerateEmails}
                      size="sm"
                      className="mt-1"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Emails
                    </Button>
                    {!canGenerateEmails && (
                      <p className="text-[11px] text-muted-foreground">
                        Generate summaries and resumes for all jobs to enable email generation.
                      </p>
                    )}
                  </div>
                ) : isGeneratingEmails ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Generating emails...</p>
                      <p className="text-xs text-muted-foreground">
                        This may take a moment. We will pull in your summaries and resumes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-4">
                    <EmailListView
                      emails={emailPreview}
                      onUpdate={async (emailIndex, subject, body, recipientEmail) => {
                        onUpdateEmail(emailIndex, subject, body, recipientEmail)
                      }}
                      onRegenerate={async (emailIndex) => {
                        onRegenerateEmail(emailIndex)
                      }}
                      isGenerating={isGeneratingEmails}
                      onRemove={onRemoveEmailApplication}
                    />
                    {/* ✅ FIX 3: Only show hint text, no duplicate Send All button */}
                    <p className="text-[11px] text-muted-foreground pt-2 border-t mt-2">
                      Review and customize emails before sending them to recruiters.
                    </p>
                  </div>
                )}
              </TabsContent>

            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex-shrink-0 border-t bg-background px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              {canSendEmails && (
                <Button
                  className="w-full sm:w-auto sm:min-w-[180px]"
                  disabled={applying || isGeneratingEmails || emailPreview.length === 0}
                  onClick={onFinalizeEmails}
                >
                  {applying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send All ({emailPreview.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  )
}