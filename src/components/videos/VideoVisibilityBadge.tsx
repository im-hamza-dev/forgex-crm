import { Badge } from '@/components/ui'

export function VideoVisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <Badge variant={isPublic ? 'success' : 'muted'} size="sm">
      {isPublic ? 'Public' : 'Private'}
    </Badge>
  )
}
