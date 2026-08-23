/**
 * Reads a clip's duration from the browser's own demuxer. Best effort — resolves
 * null for anything the browser can't decode metadata for, so a missing duration
 * never blocks an upload.
 */
export function probeVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const element = document.createElement('video')
    let settled = false

    const finish = (value: number | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      element.removeAttribute('src')
      element.load()
      URL.revokeObjectURL(url)
      resolve(value)
    }

    const timeout = setTimeout(() => finish(null), 10_000)

    element.preload = 'metadata'
    element.muted = true
    element.onloadedmetadata = () => {
      const duration = element.duration
      finish(
        Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
      )
    }
    element.onerror = () => finish(null)
    element.src = url
  })
}
