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

export const api = {
  get: (path: string) =>
    fetchWithRefresh(`${API_BASE}${path}`).then((r) => r.json()),

  post: (path: string, body?: unknown) =>
    fetchWithRefresh(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => r.json()),

  patch: (path: string, body?: unknown) =>
    fetchWithRefresh(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => r.json()),
}
