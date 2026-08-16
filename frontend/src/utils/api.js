const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '')
const developmentOrigin = `http://${window.location.hostname}:8000`

export const API_ORIGIN = configuredOrigin || (
  window.location.port === '5173' ? developmentOrigin : window.location.origin
)
export const API_BASE = `${API_ORIGIN}/api`

export async function apiFetch(input, init = {}) {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
  })

  if (response.status === 401 && !String(input).includes('/api/auth/')) {
    window.dispatchEvent(new CustomEvent('aiwardrobe:unauthorized'))
  }

  return response
}

export function toImageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${normalized}`
}
