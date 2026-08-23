'use client'

import { useState } from 'react'
import { LayoutGrid, List, Plus, Video as VideoIcon } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import {
  Button,
  EmptyState,
  Modal,
  SegmentedControl,
  Skeleton,
  toast,
} from '@/components/ui'
import {
  EditVideoModal,
  NewVideoModal,
  VideoCard,
  VideosTable,
} from '@/components/videos'
import {
  useSoftDeleteVideo,
  useUpdateVideo,
  useVideos,
} from '@/hooks/useVideos'
import { ROUTES } from '@/constants/routes'
import type { Video, VideoEditableFields } from '@/types/videos'

type VideosView = 'table' | 'cards'

export default function VideosPage() {
  const [view, setView] = useState<VideosView>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [editing, setEditing] = useState<Video | null>(null)
  const [deleting, setDeleting] = useState<Video | null>(null)

  const { data: videos = [], isLoading, isError, error } = useVideos()
  const updateVideo = useUpdateVideo()
  const softDeleteVideo = useSoftDeleteVideo()

  const handleCopyLink = async (video: Video) => {
    const url = `${window.location.origin}${ROUTES.VIDEO_PUBLIC(video.slug)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied', url)
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const handleToggleVisibility = async (video: Video) => {
    try {
      await updateVideo.mutateAsync({
        id: video.id,
        data: { is_public: !video.is_public },
      })
      toast.success(
        video.is_public
          ? 'Video is now private — the link no longer works'
          : 'Video is public again',
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to change visibility',
      )
    }
  }

  const handleEditSubmit = async (data: VideoEditableFields) => {
    if (!editing) return
    try {
      await updateVideo.mutateAsync({ id: editing.id, data })
      toast.success('Video updated')
      setEditing(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update video')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      await softDeleteVideo.mutateAsync(deleting.id)
      toast.success('Video deleted')
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete video')
    }
  }

  const rowHandlers = {
    onEdit: setEditing,
    onToggleVisibility: (video: Video) => void handleToggleVisibility(video),
    onCopyLink: (video: Video) => void handleCopyLink(video),
    onDelete: setDeleting,
  }

  return (
    <DashboardShell title="Videos">
      <div className="flex items-center justify-between gap-4 mb-4">
        <SegmentedControl
          options={[
            { value: 'cards', label: 'Cards', icon: <LayoutGrid size={14} /> },
            { value: 'table', label: 'Table', icon: <List size={14} /> },
          ]}
          value={view}
          onChange={(v) => setView(v as VideosView)}
        />
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} />}
          onClick={() => setNewOpen(true)}
          className="rounded-lg shrink-0"
        >
          New Video
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={320} rounded="lg" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-[14px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : 'Failed to load videos'}
        </p>
      )}

      {!isLoading && !isError && videos.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <EmptyState
            icon={<VideoIcon size={22} />}
            title="No videos yet"
            description="Upload a clip and share it with a single link."
            action={{ label: 'New Video', onClick: () => setNewOpen(true) }}
          />
        </div>
      )}

      {!isLoading && !isError && videos.length > 0 && view === 'table' && (
        <VideosTable
          videos={videos}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          {...rowHandlers}
        />
      )}

      {!isLoading && !isError && videos.length > 0 && view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} {...rowHandlers} />
          ))}
        </div>
      )}

      {newOpen && <NewVideoModal onClose={() => setNewOpen(false)} />}

      {editing && (
        <EditVideoModal
          video={editing}
          loading={updateVideo.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(data) => void handleEditSubmit(data)}
        />
      )}

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this video?"
        description={deleting?.title}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={softDeleteVideo.isPending}
              onClick={() => void handleDeleteConfirm()}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          It leaves this list and the share link stops working. The file is kept,
          so it can be restored later if you need it back.
        </p>
      </Modal>
    </DashboardShell>
  )
}
