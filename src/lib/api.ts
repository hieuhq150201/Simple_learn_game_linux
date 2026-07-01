const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function fetchWithRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    credentials: 'include',
  })

  if (res.status === 401) {
    // try refresh
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (refreshed.ok) {
      // retry original request
      return fetch(input, { ...init, credentials: 'include' })
    }
  }

  return res
}

const toJson = async (r: Response) => {
  if (!r.ok) {
    const body = await r.json().catch(() => ({})) as Record<string, unknown>
    throw new Error((body.message as string) ?? `HTTP ${r.status}`)
  }
  if (r.status === 204 || r.headers.get('content-length') === '0') return null
  return r.json()
}

export const api = {
  get: (path: string) =>
    fetchWithRefresh(`${API_BASE}${path}`).then(toJson),

  post: (path: string, body?: unknown) =>
    fetchWithRefresh(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(toJson),

  patch: (path: string, body?: unknown) =>
    fetchWithRefresh(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then(toJson),

  delete: (path: string) =>
    fetchWithRefresh(`${API_BASE}${path}`, { method: 'DELETE' }).then(toJson),
}
