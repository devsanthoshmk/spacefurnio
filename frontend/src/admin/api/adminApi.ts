import { TOKEN_KEY } from '@/admin/utils/constants'

function resolveWorkerUrl(): string {
  const envUrl = import.meta.env.VITE_WORKER_URL || import.meta.env.VITE_API_URL
  if (import.meta.env.PROD) {
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/$/, '')
    }
    return 'https://backend.thepreview.workers.dev'
  }
  return (envUrl || 'http://localhost:8787').replace(/\/$/, '')
}

const WORKER_URL = resolveWorkerUrl()

const AUTH_BYPASS_PATHS = ['/auth/login', '/auth/refresh', '/auth/register', '/api/admin/team/accept-invite']

interface RequestOptions {
  method: string
  body?: string
  headers?: Record<string, string>
  credentials?: RequestCredentials
}

class AdminApiClient {
  private token: string | null = null
  private refreshPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY)
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY)
    }
    return this.token
  }

  setToken(token: string | null): void {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token)
      } else {
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  clearAuth(): void {
    this.setToken(null)
  }

  private async doRefresh(): Promise<void> {
    const res = await fetch(`${WORKER_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) throw new Error('Refresh failed')
    const data = await res.json() as { token?: string; access_token?: string }
    const newToken = data?.token ?? data?.access_token
    if (newToken) {
      this.setToken(newToken)
    }
  }

  private redirectToLogin(): void {
    this.clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login'
    }
  }

  private async request<T>(path: string, options: RequestOptions, retryCount = 0): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const url = path.startsWith('http') ? path : `${WORKER_URL}${path}`
    const credentials = options.credentials ?? (path.startsWith('/auth') ? 'include' : 'same-origin')
    const res = await fetch(url, { ...options, headers, credentials })

    const shouldBypassRefresh = AUTH_BYPASS_PATHS.some(bp => path.startsWith(bp))
    if (res.status === 401 && retryCount < 1 && !shouldBypassRefresh) {
      try {
        if (!this.refreshPromise) {
          this.refreshPromise = this.doRefresh().finally(() => {
            this.refreshPromise = null
          })
        }
        await this.refreshPromise
        return this.request<T>(path, options, retryCount + 1)
      } catch {
        this.redirectToLogin()
        throw new Error('Session expired. Please log in again.')
      }
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`
      try {
        const errorData = await res.json() as { message?: string; error?: string }
        message = errorData.message || errorData.error || message
      } catch {
        // use default
      }
      const err = new Error(message) as Error & { status: number }
      err.status = res.status
      throw err
    }

    if (res.status === 204) {
      return { success: true } as T
    }

    return res.json() as Promise<T>
  }

  get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    let url = path
    if (params) {
      const qs = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          qs.set(k, String(v))
        }
      }
      const str = qs.toString()
      if (str) url = `${path}?${str}`
    }
    return this.request<T>(url, { method: 'GET' })
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const adminApi = new AdminApiClient()
export default adminApi
