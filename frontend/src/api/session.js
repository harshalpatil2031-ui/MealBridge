const SESSION_KEY = 'mb_session'

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.access_token, user: session.user, expiresAt: session.expires_at }))
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!session?.token || !session?.user) return null
    if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function getCurrentUser() {
  return getSession()?.user || null
}

export function getAccessToken() {
  return getSession()?.token || null
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('mb_user')
}
