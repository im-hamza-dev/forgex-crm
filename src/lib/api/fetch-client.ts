// Client-side fetch wrapper — adds base URL and handles errors
// All services/ files use this, never raw fetch

type FetchOptions = RequestInit & { params?: Record<string, string> }

export async function fetchClient<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...rest } = options
  const url = new URL(path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((body as { error?: string }).error ?? 'Request failed')
  }

  return res.json() as Promise<T>
}
