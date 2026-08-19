'use client'

import { useState } from 'react'
import {
  PortalHeader,
  PortalTabs,
  PortalRaiseButton,
  PortalProjectHero,
  PortalMilestones,
  PortalRecentUpdates,
  PortalNewTicketPanel,
  PortalUpdatesPage,
  PortalFilesPage,
  PortalDocumentsPage,
  PortalSupportPage,
  PortalTicketThread,
  PortalSettingsPage,
} from '@/components/client-portal'
import type {
  PortalTab,
  Milestone,
  PortalUpdate,
  PortalUpdateFull,
  PortalFile,
  PortalDocument,
  PortalTicket,
  PortalNotification,
} from '@/components/client-portal'

const MOCK_PROJECT = {
  name: 'NovaBuild Client Portal',
  status: 'in_progress',
  serviceType: 'SaaS MVP',
  startDate: 'Jul 1, 2026',
  deadline: 'Oct 10, 2026',
  completionPct: 62,
  nextMilestone: { title: 'Backend Development', date: 'Aug 30' },
  stats: [
    { value: 2, label: 'Updates' },
    { value: 3, label: 'Files shared' },
    { value: 2, label: 'Open requests', variant: 'warning' as const },
  ],
}

const MOCK_MILESTONES: Milestone[] = [
  {
    id: '1',
    title: 'Requirements Discovery',
    state: 'completed',
    completedDate: 'Jul 15',
  },
  {
    id: '2',
    title: 'UI Design Approval',
    state: 'completed',
    completedDate: 'Aug 1',
  },
  {
    id: '3',
    title: 'Backend Development',
    state: 'active',
    dueDate: 'Aug 30',
  },
  {
    id: '4',
    title: 'User Testing',
    state: 'upcoming',
    dueDate: 'Sep 15',
  },
  {
    id: '5',
    title: 'Final Delivery',
    state: 'upcoming',
    dueDate: 'Oct 10',
  },
]

const MOCK_UPDATES: PortalUpdate[] = [
  {
    id: '1',
    content:
      "Backend API development is progressing well. We've completed the authentication module and are now working on the project dashboard endpoints. On track for the Aug 30 milestone.",
    date: 'August 12, 2026',
  },
  {
    id: '2',
    content:
      'UI designs have been finalized and approved. The development team will start implementation tomorrow.',
    date: 'August 1, 2026',
  },
]

const MOCK_UPDATES_FULL: PortalUpdateFull[] = [
  {
    id: '1',
    content:
      "Backend API development is progressing well. We've completed the authentication module and are now working on the project dashboard endpoints. On track for the Aug 30 milestone.",
    date: 'August 12, 2026',
    time: '11:24 AM',
  },
  {
    id: '2',
    content:
      'UI designs have been finalized and approved. The development team will start implementation tomorrow. You can review the final designs in the Files tab.',
    date: 'August 1, 2026',
    time: '2:15 PM',
  },
]

const MOCK_FILES: PortalFile[] = [
  {
    id: '1',
    name: 'NovaBuild_Design_Specs.pdf',
    size: '2.4 MB',
    sharedDate: 'Aug 1',
    mimeType: 'application/pdf',
    url: '#',
  },
  {
    id: '2',
    name: 'Project_Timeline.xlsx',
    size: '145 KB',
    sharedDate: 'Jul 15',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    url: '#',
  },
  {
    id: '3',
    name: 'Homepage_Mockup.png',
    size: '880 KB',
    sharedDate: 'Aug 3',
    mimeType: 'image/png',
    url: '#',
  },
]

const MOCK_DOCUMENTS: PortalDocument[] = [
  {
    id: '1',
    type: 'proposal',
    title: 'NovaBuild Portal Project Proposal',
    sentDate: 'July 10, 2026',
    viewed: true,
    content: `# NovaBuild Portal Project Proposal

**Prepared by:** Forgex Systems
**Date:** July 10, 2026
**Project:** NovaBuild Client Portal

---

## Overview

We're pleased to present this proposal for the NovaBuild Client Portal — a bespoke, modern web application designed to give your team and clients seamless project visibility and communication.

## Scope of Work

The engagement covers the following deliverables:

1. Client-facing portal with project progress, milestones, and file sharing
2. Support ticket system for client requests and communication
3. Document management for contracts, proposals, and shared assets
4. Real-time updates feed from the Forgex team

## Timeline

Phase 1 — Discovery & Design: 2 weeks
Phase 2 — Development: 6 weeks
Phase 3 — Testing & Launch: 2 weeks`,
    content_type: 'editor' as const,
  },
  {
    id: '2',
    type: 'contract',
    title: 'NovaBuild Development Contract',
    sentDate: 'July 12, 2026',
    viewed: true,
    content: `# NovaBuild Development Contract

**Client:** NovaBuild Construction
**Agency:** Forgex Systems
**Date:** July 12, 2026

---

## Terms of Engagement

This agreement outlines the terms under which Forgex Systems will deliver the NovaBuild Client Portal project.

## Payment Terms

- 30% upfront upon contract signing
- 40% at mid-project milestone
- 30% upon final delivery

## Intellectual Property

All code and assets delivered become the property of NovaBuild Construction upon final payment.`,
    content_type: 'editor' as const,
  },
  {
    id: '3',
    type: 'welcome',
    title: 'Welcome to the Forgex Client Portal',
    sentDate: 'July 10, 2026',
    viewed: true,
    content: `# Welcome to the Forgex Client Portal

**Dear James,**

Welcome to your dedicated project portal. We've set this up so you can track your project progress, communicate with our team, and access all your documents in one place.

---

## What You Can Do Here

- Track your project progress and milestones in real time
- Read updates posted by the Forgex team
- Download shared files and documents
- Raise support requests directly with our team

## Getting Started

Your project is already set up and ready to go. If you have any questions, use the Raise a Request button at any time.

We look forward to delivering something great together.

**The Forgex Team**`,
    content_type: 'editor' as const,
  },
]

const MOCK_TICKETS: PortalTicket[] = [
  {
    id: '1',
    subject: 'Dashboard not loading on mobile',
    status: 'open',
    priority: 'high',
    raisedDate: 'Aug 11, 2026',
    lastMessage:
      "Thanks for reporting this, James. We've identified the issue — it's related to a CSS viewport unit bug on iOS Safari. We'll have a ...",
    lastMessageTime: '2 hours ago',
    hasNewReply: false,
  },
  {
    id: '2',
    subject: 'Can we add an export button to the reports?',
    status: 'in_progress',
    priority: 'medium',
    raisedDate: 'Aug 8, 2026',
    lastMessage: 'Yes, please send the quote. CSV would be great for now.',
    lastMessageTime: '2 hours ago',
    hasNewReply: true,
  },
]

const MOCK_TICKET_MESSAGES = [
  {
    id: '1',
    sender: 'client' as const,
    content:
      'The dashboard is not loading on mobile Safari. I just get a blank screen.',
    time: 'Aug 11 · 9:14 AM',
    date: 'August 11, 2026',
  },
  {
    id: '2',
    sender: 'team' as const,
    content:
      "Thanks for reporting this, James. We've identified the issue — it's related to a CSS viewport unit bug on iOS Safari. We'll have a fix deployed within 24 hours.",
    time: 'Aug 11 · 11:32 AM',
  },
]

const MOCK_NOTIFICATIONS: PortalNotification[] = [
  {
    id: '1',
    title: 'New reply on your request',
    body: 'Hamza replied to "Dashboard not loading..."',
    time: '2h ago',
    read: false,
    icon: 'R',
  },
  {
    id: '2',
    title: 'Project update posted',
    body: 'Forgex Team posted a new progress up...',
    time: 'Yesterday',
    read: false,
    icon: 'U',
  },
  {
    id: '3',
    title: 'New file shared',
    body: 'Homepage_Mockup.png was shared with y...',
    time: 'Aug 3',
    read: true,
    icon: 'F',
  },
  {
    id: '4',
    title: 'Document ready to review',
    body: 'NovaBuild Development Contract is ready.',
    time: 'Jul 12',
    read: true,
    icon: 'D',
  },
]

const MOCK_CLIENT = { name: 'James', initials: 'JO' }

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')
  const [ticketPanelOpen, setTicketPanelOpen] = useState(false)
  const [activeTicket, setActiveTicket] = useState<PortalTicket | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page)' }}>
      <PortalHeader
        projectName={MOCK_PROJECT.name}
        projectStatus={MOCK_PROJECT.status}
        clientName={MOCK_CLIENT.name}
        clientInitials={MOCK_CLIENT.initials}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onGoToSettings={() => setShowSettings(true)}
      />

      <PortalTabs
        active={activeTab}
        onChange={(tab) => {
          setShowSettings(false)
          setActiveTicket(null)
          setActiveTab(tab)
        }}
        openTickets={2}
      />

      <div className="max-w-[860px] mx-auto px-6 py-8">
        {showSettings ? (
          <PortalSettingsPage
            clientName={MOCK_CLIENT.name}
            clientInitials={MOCK_CLIENT.initials}
            clientEmail="james@novabuild.co"
            clientCompany="NovaBuild Construction"
            onBack={() => setShowSettings(false)}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-5">
                <PortalProjectHero
                  projectName={MOCK_PROJECT.name}
                  status={MOCK_PROJECT.status}
                  serviceType={MOCK_PROJECT.serviceType}
                  startDate={MOCK_PROJECT.startDate}
                  deadline={MOCK_PROJECT.deadline}
                  completionPct={MOCK_PROJECT.completionPct}
                  nextMilestone={MOCK_PROJECT.nextMilestone}
                  stats={MOCK_PROJECT.stats}
                />
                <PortalMilestones milestones={MOCK_MILESTONES} />
                <PortalRecentUpdates
                  updates={MOCK_UPDATES}
                  onViewAll={() => setActiveTab('updates')}
                />
              </div>
            )}

            {activeTab === 'updates' && (
              <PortalUpdatesPage updates={MOCK_UPDATES_FULL} />
            )}
            {activeTab === 'files' && (
              <PortalFilesPage files={MOCK_FILES} />
            )}
            {activeTab === 'documents' && (
              <PortalDocumentsPage documents={MOCK_DOCUMENTS} />
            )}
            {activeTab === 'support' && !activeTicket && (
              <PortalSupportPage
                tickets={MOCK_TICKETS}
                onRaiseRequest={() => setTicketPanelOpen(true)}
                onOpenTicket={(t) => setActiveTicket(t)}
              />
            )}
            {activeTab === 'support' && activeTicket && (
              <PortalTicketThread
                ticket={activeTicket}
                messages={MOCK_TICKET_MESSAGES}
                onBack={() => setActiveTicket(null)}
                onSend={(content) => {
                  console.log('Send:', content)
                }}
              />
            )}
          </>
        )}
      </div>

      <PortalRaiseButton onClick={() => setTicketPanelOpen(true)} />
      <PortalNewTicketPanel
        open={ticketPanelOpen}
        onClose={() => setTicketPanelOpen(false)}
        onSubmit={(data) => {
          console.log('Ticket submitted:', data)
        }}
      />
    </div>
  )
}
