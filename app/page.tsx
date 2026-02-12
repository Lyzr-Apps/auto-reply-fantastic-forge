'use client'

import { useState } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Send, Trash2, Save, RefreshCw, Search, Sparkles, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react'

const AGENT_ID = '698e3c78d53462d090523340'

const THEME_VARS = {
  '--background': '35 29% 95%',
  '--foreground': '30 22% 14%',
  '--card': '35 29% 92%',
  '--card-foreground': '30 22% 14%',
  '--popover': '35 29% 90%',
  '--popover-foreground': '30 22% 14%',
  '--primary': '27 61% 26%',
  '--primary-foreground': '35 29% 98%',
  '--secondary': '35 20% 88%',
  '--secondary-foreground': '30 22% 18%',
  '--accent': '43 75% 38%',
  '--accent-foreground': '35 29% 98%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--muted': '35 15% 85%',
  '--muted-foreground': '30 20% 45%',
  '--border': '27 61% 26%',
  '--input': '35 15% 75%',
  '--ring': '27 61% 26%',
  '--chart-1': '27 61% 26%',
  '--chart-2': '43 75% 38%',
  '--chart-3': '30 55% 25%',
  '--chart-4': '35 45% 42%',
  '--chart-5': '20 65% 35%',
  '--sidebar-background': '35 25% 90%',
  '--sidebar-foreground': '30 22% 14%',
  '--sidebar-border': '35 20% 85%',
  '--sidebar-primary': '27 61% 26%',
  '--sidebar-primary-foreground': '35 29% 98%',
  '--sidebar-accent': '35 20% 85%',
  '--sidebar-accent-foreground': '30 22% 14%',
  '--radius': '0.5rem'
} as React.CSSProperties

interface Email {
  id: string
  sender: string
  senderEmail: string
  subject: string
  preview: string
  content: string
  timestamp: string
  isUnread: boolean
  needsReply: boolean
  threadId?: string
  threadHistory?: string
}

interface DraftResponse {
  draft_reply?: string
  summary?: string
  tone?: string
  confidence?: number
}

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [draftContent, setDraftContent] = useState('')
  const [draftMetadata, setDraftMetadata] = useState<DraftResponse | null>(null)
  const [showDraft, setShowDraft] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lastFetched, setLastFetched] = useState<string>('')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [isFetchingEmails, setIsFetchingEmails] = useState(false)
  const [fetchError, setFetchError] = useState<string>('')

  const filteredEmails = Array.isArray(emails) ? emails.filter(email => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      email?.sender?.toLowerCase().includes(query) ||
      email?.subject?.toLowerCase().includes(query) ||
      email?.preview?.toLowerCase().includes(query)
    )
  }) : []

  const handleFetchEmails = async () => {
    setIsFetchingEmails(true)
    setActiveAgentId(AGENT_ID)
    setFetchError('')

    try {
      const message = 'Fetch my recent emails from Gmail inbox. Return the last 20 emails with sender name, email address, subject, preview text, timestamp, thread ID, and whether it is unread.'

      const result = await callAIAgent(message, AGENT_ID)

      if (result?.success && result?.response?.result) {
        const agentData = result.response.result

        // Parse the response - the agent may return different structures
        let fetchedEmails: Email[] = []

        // Check if emails are in an array field
        if (Array.isArray(agentData?.emails)) {
          fetchedEmails = agentData.emails.map((email: any, index: number) => ({
            id: email?.id ?? email?.thread_id ?? email?.message_id ?? `email-${index}`,
            sender: email?.sender_name ?? email?.from_name ?? email?.sender ?? 'Unknown Sender',
            senderEmail: email?.sender_email ?? email?.from_email ?? email?.email ?? '',
            subject: email?.subject ?? 'No Subject',
            preview: email?.preview ?? email?.snippet ?? email?.body_preview ?? email?.text?.substring(0, 150) ?? '',
            content: email?.content ?? email?.body ?? email?.text ?? email?.preview ?? '',
            timestamp: email?.timestamp ?? email?.date ?? email?.time ?? 'Recently',
            isUnread: email?.is_unread ?? email?.unread ?? false,
            needsReply: true,
            threadId: email?.thread_id ?? email?.id ?? '',
            threadHistory: email?.thread_history ?? ''
          }))
        } else if (Array.isArray(agentData?.messages)) {
          fetchedEmails = agentData.messages.map((email: any, index: number) => ({
            id: email?.id ?? email?.thread_id ?? email?.message_id ?? `email-${index}`,
            sender: email?.sender_name ?? email?.from_name ?? email?.sender ?? 'Unknown Sender',
            senderEmail: email?.sender_email ?? email?.from_email ?? email?.email ?? '',
            subject: email?.subject ?? 'No Subject',
            preview: email?.preview ?? email?.snippet ?? email?.body_preview ?? email?.text?.substring(0, 150) ?? '',
            content: email?.content ?? email?.body ?? email?.text ?? email?.preview ?? '',
            timestamp: email?.timestamp ?? email?.date ?? email?.time ?? 'Recently',
            isUnread: email?.is_unread ?? email?.unread ?? false,
            needsReply: true,
            threadId: email?.thread_id ?? email?.id ?? '',
            threadHistory: email?.thread_history ?? ''
          }))
        } else if (Array.isArray(agentData?.items)) {
          fetchedEmails = agentData.items.map((email: any, index: number) => ({
            id: email?.id ?? email?.thread_id ?? email?.message_id ?? `email-${index}`,
            sender: email?.sender_name ?? email?.from_name ?? email?.sender ?? 'Unknown Sender',
            senderEmail: email?.sender_email ?? email?.from_email ?? email?.email ?? '',
            subject: email?.subject ?? 'No Subject',
            preview: email?.preview ?? email?.snippet ?? email?.body_preview ?? email?.text?.substring(0, 150) ?? '',
            content: email?.content ?? email?.body ?? email?.text ?? email?.preview ?? '',
            timestamp: email?.timestamp ?? email?.date ?? email?.time ?? 'Recently',
            isUnread: email?.is_unread ?? email?.unread ?? false,
            needsReply: true,
            threadId: email?.thread_id ?? email?.id ?? '',
            threadHistory: email?.thread_history ?? ''
          }))
        }

        if (fetchedEmails.length > 0) {
          setEmails(fetchedEmails)
          setSelectedEmail(fetchedEmails[0])
          const now = new Date()
          setLastFetched(now.toLocaleTimeString())
          setFetchError('')
        } else {
          setFetchError('No emails found in your inbox. Try sending yourself a test email first.')
        }
      } else {
        setFetchError('Failed to fetch emails. Please try again.')
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
      setFetchError('An error occurred while fetching emails. Please check your Gmail connection and try again.')
    } finally {
      setIsFetchingEmails(false)
      setActiveAgentId(null)
    }
  }

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email)
    setShowDraft(false)
    setDraftContent('')
    setDraftMetadata(null)
  }

  const handleGenerateDraft = async () => {
    if (!selectedEmail) return

    setIsGenerating(true)
    setActiveAgentId(AGENT_ID)
    setShowDraft(true)

    try {
      const message = `Generate a professional reply to this email:

From: ${selectedEmail.sender} <${selectedEmail.senderEmail}>
Subject: ${selectedEmail.subject}
Content: ${selectedEmail.content}

${selectedEmail.threadHistory ? `Previous thread: ${selectedEmail.threadHistory}` : ''}`

      const result = await callAIAgent(message, AGENT_ID)

      if (result?.success && result?.response?.result) {
        const agentData = result.response.result as DraftResponse
        setDraftContent(agentData?.draft_reply ?? 'Draft reply could not be generated.')
        setDraftMetadata({
          summary: agentData?.summary,
          tone: agentData?.tone,
          confidence: agentData?.confidence
        })
      } else {
        setDraftContent('Failed to generate draft. Please try again.')
        setDraftMetadata(null)
      }
    } catch (error) {
      console.error('Error generating draft:', error)
      setDraftContent('An error occurred while generating the draft.')
      setDraftMetadata(null)
    } finally {
      setIsGenerating(false)
      setActiveAgentId(null)
    }
  }

  const handleSendReply = async () => {
    if (!draftContent || !selectedEmail) return

    setIsSending(true)

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSending(false)
    setShowDraft(false)
    setDraftContent('')
    setDraftMetadata(null)

    // Mark email as no longer needing reply
    setEmails(prev => prev.map(e =>
      e.id === selectedEmail.id ? { ...e, needsReply: false } : e
    ))
  }

  const handleSaveDraft = async () => {
    // Simulate saving draft
    await new Promise(resolve => setTimeout(resolve, 500))
    setShowDraft(false)
  }

  const handleDiscardDraft = () => {
    setShowDraft(false)
    setDraftContent('')
    setDraftMetadata(null)
  }

  return (
    <div style={THEME_VARS} className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-semibold tracking-wide text-foreground">
                  Smart Email Assistant
                </h1>
                <p className="text-xs text-muted-foreground">AI-powered email management with Gmail</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {emails.length === 0 ? (
          <Card className="border-border bg-card shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-3 font-serif text-2xl font-semibold tracking-wide text-foreground">
                Welcome to Smart Email Assistant
              </h2>
              <p className="mb-6 max-w-md text-center leading-relaxed text-muted-foreground">
                Connect to your Gmail inbox to start managing emails with AI. Generate professional replies, analyze email content, and streamline your workflow.
              </p>
              <Button
                onClick={handleFetchEmails}
                disabled={isFetchingEmails}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
              >
                {isFetchingEmails ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Fetching Your Emails...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Fetch My Emails
                  </>
                )}
              </Button>
              {fetchError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{fetchError}</span>
                </div>
              )}
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm text-muted-foreground">
                  Click &quot;Fetch My Emails&quot; to load your inbox
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left Panel - Email List */}
            <div className="lg:col-span-2">
              <Card className="border-border bg-card shadow-lg">
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-serif text-xl tracking-wide">Inbox</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFetchEmails}
                      disabled={isFetchingEmails}
                      className="border-border bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {isFetchingEmails ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fetch My Emails
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-border bg-background pl-10"
                    />
                  </div>
                  {lastFetched && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last fetched: {lastFetched}
                    </div>
                  )}
                  {fetchError && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      <span>{fetchError}</span>
                    </div>
                  )}
                </CardHeader>
                <Separator className="bg-border" />
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2 p-4">
                    {Array.isArray(filteredEmails) && filteredEmails.length > 0 ? (
                      filteredEmails.map((email) => (
                        <button
                          key={email.id}
                          onClick={() => handleEmailClick(email)}
                          className={`w-full rounded-lg border p-4 text-left transition-all ${
                            selectedEmail?.id === email.id
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className={`font-medium ${email.isUnread ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                                {email.sender}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {email.isUnread && (
                                <Badge variant="default" className="bg-accent text-accent-foreground">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>
                          <h4 className={`mb-1 text-sm ${email.isUnread ? 'font-semibold' : 'font-medium'}`}>
                            {email.subject}
                          </h4>
                          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {email.preview}
                          </p>
                          <span className="text-xs text-muted-foreground">{email.timestamp}</span>
                        </button>
                      ))
                    ) : (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        No emails found matching your search
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Right Panel - Email Detail & Draft */}
            <div className="lg:col-span-3">
              {selectedEmail ? (
                <div className="space-y-6">
                  {/* Email Detail */}
                  <Card className="border-border bg-card shadow-lg">
                    <CardHeader>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="mb-2 font-serif text-2xl tracking-wide leading-relaxed">
                            {selectedEmail.subject}
                          </CardTitle>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{selectedEmail.sender}</span>
                            </div>
                            {selectedEmail.senderEmail && (
                              <>
                                <span>•</span>
                                <span>{selectedEmail.senderEmail}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{selectedEmail.timestamp}</span>
                          </div>
                        </div>
                        {selectedEmail.needsReply && (
                          <Badge variant="outline" className="border-accent text-accent">
                            Needs Reply
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <Separator className="bg-border" />
                    <CardContent className="pt-6">
                      <div className="mb-6 whitespace-pre-wrap leading-relaxed text-foreground">
                        {selectedEmail.content}
                      </div>
                      {!showDraft && (
                        <Button
                          onClick={handleGenerateDraft}
                          disabled={isGenerating}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating Draft...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Draft Reply
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Draft Editor */}
                  {showDraft && (
                    <Card className="border-primary/50 bg-card shadow-xl">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="font-serif text-xl tracking-wide">Draft Reply</CardTitle>
                            <CardDescription className="mt-1">
                              Review and edit your AI-generated response
                            </CardDescription>
                          </div>
                          {draftMetadata && (
                            <div className="flex gap-2">
                              {draftMetadata.tone && (
                                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                                  {draftMetadata.tone}
                                </Badge>
                              )}
                              {typeof draftMetadata.confidence === 'number' && (
                                <Badge variant="outline" className="border-accent">
                                  {Math.round(draftMetadata.confidence * 100)}% confident
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        {draftMetadata?.summary && (
                          <div className="mt-3 rounded-lg bg-muted/50 p-3">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              <span className="font-medium text-foreground">Summary:</span> {draftMetadata.summary}
                            </p>
                          </div>
                        )}
                      </CardHeader>
                      <Separator className="bg-border" />
                      <CardContent className="pt-6">
                        {isGenerating ? (
                          <div className="space-y-3">
                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                            <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-full animate-pulse rounded bg-muted" />
                            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                          </div>
                        ) : (
                          <>
                            <Textarea
                              value={draftContent}
                              onChange={(e) => setDraftContent(e.target.value)}
                              className="min-h-[250px] border-border bg-background font-sans leading-relaxed"
                              placeholder="Your draft reply will appear here..."
                            />
                            <div className="mt-6 flex gap-3">
                              <Button
                                onClick={handleSendReply}
                                disabled={isSending || !draftContent}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                {isSending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Reply
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleSaveDraft}
                                variant="secondary"
                                disabled={isSending}
                                className="bg-secondary text-secondary-foreground"
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Save Draft
                              </Button>
                              <Button
                                onClick={handleDiscardDraft}
                                variant="outline"
                                disabled={isSending}
                                className="border-border"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Discard
                              </Button>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="border-border bg-card shadow-lg">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Mail className="mb-4 h-16 w-16 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Select an email to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Agent Status */}
        <Card className="mt-6 border-border bg-card/50 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-accent" />
                <div>
                  <h4 className="text-sm font-medium text-foreground">Email Assistant Agent</h4>
                  <p className="text-xs text-muted-foreground">
                    Fetches Gmail emails and generates professional draft replies
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeAgentId === AGENT_ID ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-xs font-medium text-accent">Processing</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="text-xs text-muted-foreground">Ready</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
