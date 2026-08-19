'use client'

import { useState, use, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  PortalHeader,
  PortalTabs,
  PortalRaiseButton,
  PortalPWAPrompt,
  PortalProjectHero,
  PortalMilestones,
  PortalRecentUpdates,
  PortalUpdatesPage,
  PortalFilesPage,
  PortalDocumentsPage,
  PortalSupportPage,
  PortalTicketThread,
  PortalNewTicketPanel,
  PortalSettingsPage,
} from '@/components/client-portal'
import type {
  PortalTab,
  PortalTicket,
  PortalDocument,
  PortalNotification,
} from '@/components/client-portal'
import {
  usePortalOverview,
  usePortalUpdates,
  usePortalFiles,
  usePortalDocuments,
  usePortalTickets,
  usePortalTicketMessages,
  usePortalActions,
} from '@/hooks/usePortal'
import { useNotifications } from '@/hooks/useNotifications'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui'

function initialsFrom(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

interface PortalProjectShellProps {
  children: ReactNode
  projectName: string
  projectStatus: string
  clientName: string
  clientInitials: string
  notifications: PortalNotification[]
  onMarkAllRead: () => void
  onGoToSettings: () => void
  onSignOut: () => void
  activeTab: PortalTab
  onTabChange: (tab: PortalTab) => void
  openTickets: number
  ticketPanelOpen: boolean
  onOpenTicketPanel: () => void
  onCloseTicketPanel: () => void
  onSubmitTicket: (data: {
    subject: string
    priority: 'low' | 'medium' | 'high'
    description: string
    attachments: {
      name: string
      url: string
      size: number
      mimeType: string
    }[]
  }) => Promise<void>
  projectId?: string
  onNotificationClick?: (notification: PortalNotification) => void
}

function PortalProjectShell({
  children,
  projectName,
  projectStatus,
  clientName,
  clientInitials,
  notifications,
  onMarkAllRead,
  onGoToSettings,
  onSignOut,
  activeTab,
  onTabChange,
  openTickets,
  ticketPanelOpen,
  onOpenTicketPanel,
  onCloseTicketPanel,
  onSubmitTicket,
  projectId,
  onNotificationClick,
}: PortalProjectShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-page)' }}>
      <PortalHeader
        projectName={projectName}
        projectStatus={projectStatus}
        clientName={clientName}
        clientInitials={clientInitials}
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        onGoToSettings={onGoToSettings}
        onSignOut={onSignOut}
        projectId={projectId}
        onNotificationClick={onNotificationClick}
      />
      <PortalTabs
        active={activeTab}
        onChange={onTabChange}
        openTickets={openTickets}
      />
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-8">
        {children}
      </div>
      <PortalRaiseButton onClick={onOpenTicketPanel} />
      <PortalPWAPrompt />
      <PortalNewTicketPanel
        open={ticketPanelOpen}
        onClose={onCloseTicketPanel}
        onSubmit={onSubmitTicket}
      />
    </div>
  )
}

export default function PortalProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<PortalTab>('overview')
  const [ticketPanelOpen, setTicketPanelOpen] = useState(false)
  const [activeTicket, setActiveTicket] = useState<PortalTicket | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const {
    data: overview,
    isLoading: overviewLoading,
    isError,
  } = usePortalOverview(projectId)
  const { data: updates = [] } = usePortalUpdates(projectId)
  const { data: files = [] } = usePortalFiles(projectId)
  const { data: documents = [] } = usePortalDocuments(projectId)
  const { data: tickets = [] } = usePortalTickets(projectId)
  const { data: ticketMessages = [] } = usePortalTicketMessages(
    projectId,
    activeTicket?.id ?? null,
  )
  const {
    createTicket,
    replyToTicket,
    markDocumentViewed,
    updateProfile,
    changePassword,
    reopenTicket,
  } = usePortalActions(projectId)

  const { notifications, markAsRead, markAllAsRead } = useNotifications()

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    if (
      tab === 'support' ||
      tab === 'documents' ||
      tab === 'updates' ||
      tab === 'files'
    ) {
      setActiveTab(tab)
    }
  }, [])

  const project = overview?.project
  const milestones = overview?.milestones ?? []

  const openTicketsCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  ).length

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const heroStats = project
    ? [
        { value: project.stats.updates, label: 'Updates' },
        { value: project.stats.files, label: 'Files shared' },
        {
          value: project.stats.open_tickets,
          label: 'Open requests',
          variant:
            project.stats.open_tickets > 0
              ? ('warning' as const)
              : ('default' as const),
        },
      ]
    : []

  const bellNotifications: PortalNotification[] = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body ?? '',
    time: n.time_ago ?? timeAgo(n.created_at),
    read: n.is_read,
    type: n.type,
    icon:
      n.type === 'ticket_reply' || n.type === 'ticket_opened'
        ? '💬'
        : n.type === 'project_updated'
          ? '📋'
          : n.type === 'client_doc_sent'
            ? '📄'
            : '📎',
  }))

  const handleNotificationClick = (n: PortalNotification) => {
    markAsRead(n.id)
    if (n.type === 'ticket_reply' || n.type === 'ticket_opened') {
      setShowSettings(false)
      setActiveTicket(null)
      setActiveTab('support')
    } else if (n.type === 'client_doc_sent') {
      setShowSettings(false)
      setActiveTicket(null)
      setActiveTab('documents')
    } else if (n.type === 'project_updated') {
      setShowSettings(false)
      setActiveTicket(null)
      setActiveTab('updates')
    }
  }

  const mapTicket = (t: (typeof tickets)[number]): PortalTicket => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    raisedDate: t.raised_date,
    lastMessage: t.last_message ?? '',
    lastMessageTime: t.last_message_time ?? '',
    hasNewReply: t.has_new_reply,
  })

  const mappedDocuments = documents.map((d) => ({
    id: d.id,
    type: d.type as PortalDocument['type'],
    title: d.title,
    sentDate: d.sent_date,
    viewed: d.viewed,
    content_type: d.content_type,
    content: d.markdown_content ?? '',
    file_url: d.file_url,
  }))

  const mappedFiles = files.map((f) => ({
    id: f.id,
    name: f.name,
    size: f.size,
    sharedDate: f.shared_date,
    mimeType: f.mime_type,
    url: f.url,
  }))

  const mappedMilestones = milestones.map((m) => ({
    id: m.id,
    title: m.title,
    state: m.state,
    completedDate: m.completed_date ?? undefined,
    dueDate: m.due_date ?? undefined,
  }))

  const recentUpdates = updates.slice(0, 3).map((u) => ({
    id: u.id,
    content: u.content,
    date: u.date,
  }))

  const fullUpdates = updates.map((u) => ({
    id: u.id,
    content: u.content,
    date: u.date,
    time: u.time,
  }))

  const clientInitials = initialsFrom(
    project?.client_name ?? project?.client_email ?? 'C',
  )

  const shellProps = {
    projectName: project?.name ?? '...',
    projectStatus: project?.status ?? 'in_progress',
    clientName: project?.client_name?.split(' ')[0] ?? '',
    clientInitials,
    notifications: bellNotifications,
    onMarkAllRead: () => markAllAsRead(),
    onGoToSettings: () => setShowSettings(true),
    onSignOut: () => void handleSignOut(),
    activeTab,
    onTabChange: (tab: PortalTab) => {
      setShowSettings(false)
      setActiveTicket(null)
      setActiveTab(tab)
    },
    openTickets: openTicketsCount,
    ticketPanelOpen,
    onOpenTicketPanel: () => setTicketPanelOpen(true),
    onCloseTicketPanel: () => setTicketPanelOpen(false),
    projectId,
    onNotificationClick: handleNotificationClick,
    onSubmitTicket: async (data: {
      subject: string
      priority: 'low' | 'medium' | 'high'
      description: string
      attachments: {
        name: string
        url: string
        size: number
        mimeType: string
      }[]
    }) => {
      try {
        await createTicket.mutateAsync(data)
        toast.success(
          "Request submitted. We'll respond within 1 business day.",
        )
        setTicketPanelOpen(false)
      } catch {
        toast.error('Failed to submit request')
      }
    },
  }

  if (isError) {
    return (
      <PortalProjectShell {...shellProps}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p
            className="text-[15px] font-semibold mb-2"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Couldn’t load this project
          </p>
          <p
            className="text-[13px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Refresh the page or contact Forgex if this keeps happening.
          </p>
        </div>
      </PortalProjectShell>
    )
  }

  if (overviewLoading || !project) {
    return (
      <PortalProjectShell {...shellProps}>
        <div className="flex items-center justify-center py-24">
          <span className="w-6 h-6 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      </PortalProjectShell>
    )
  }

  if (showSettings) {
    return (
      <PortalProjectShell {...shellProps}>
        <PortalSettingsPage
          clientName={project.client_name ?? ''}
          clientInitials={clientInitials}
          clientEmail={project.client_email}
          clientCompany={project.client_company ?? ''}
          onBack={() => setShowSettings(false)}
          onSaveProfile={async (fullName) => {
            try {
              await updateProfile.mutateAsync({ full_name: fullName })
              toast.success('Profile updated')
            } catch {
              toast.error('Failed to update profile')
            }
          }}
          onChangePassword={async (current, newPw) => {
            try {
              await changePassword.mutateAsync({
                currentPassword: current,
                newPassword: newPw,
              })
              toast.success('Password updated')
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Failed to update password',
              )
            }
          }}
          onSignOut={() => void handleSignOut()}
        />
      </PortalProjectShell>
    )
  }

  return (
    <PortalProjectShell {...shellProps}>
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          <PortalProjectHero
            projectName={project.name}
            status={project.status}
            serviceType={project.service_type ?? 'Project'}
            startDate={project.start_date ?? 'TBD'}
            deadline={project.deadline ?? 'TBD'}
            completionPct={project.completion_pct}
            nextMilestone={project.next_milestone}
            stats={heroStats}
          />
          <PortalMilestones milestones={mappedMilestones} />
          <PortalRecentUpdates
            updates={recentUpdates}
            onViewAll={() => setActiveTab('updates')}
          />
        </div>
      )}

      {activeTab === 'updates' && <PortalUpdatesPage updates={fullUpdates} />}

      {activeTab === 'files' && <PortalFilesPage files={mappedFiles} />}

      {activeTab === 'documents' && (
        <PortalDocumentsPage
          documents={mappedDocuments}
          onOpen={(id) => {
            void markDocumentViewed.mutateAsync(id)
          }}
        />
      )}

      {activeTab === 'support' && !activeTicket && (
        <PortalSupportPage
          tickets={tickets.map(mapTicket)}
          onRaiseRequest={() => setTicketPanelOpen(true)}
          onOpenTicket={(t) => setActiveTicket(t)}
        />
      )}
      {activeTab === 'support' && activeTicket && (
        <PortalTicketThread
          ticket={activeTicket}
          messages={ticketMessages.map((m) => ({
            id: m.id,
            sender: m.sender,
            content: m.content,
            time: m.time,
            date: m.date,
            attachments: m.attachments,
          }))}
          onBack={() => setActiveTicket(null)}
          onSend={async (content, attachments) => {
            try {
              await replyToTicket.mutateAsync({
                ticketId: activeTicket.id,
                content,
                attachments,
              })
            } catch {
              toast.error('Failed to send reply')
            }
          }}
          onReopen={async () => {
            try {
              await reopenTicket.mutateAsync(activeTicket.id)
              setActiveTicket((prev) =>
                prev ? { ...prev, status: 'open' } : null,
              )
              toast.success('Request reopened')
            } catch {
              toast.error('Failed to reopen request')
            }
          }}
        />
      )}
    </PortalProjectShell>
  )
}
