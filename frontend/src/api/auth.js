import { request } from './http.js'
import { clearSession, getAccessToken } from './session.js'
export { clearSession, getAccessToken, getCurrentUser, getSession, saveSession } from './session.js'

export function login(credentials) {
  return request('POST', '/auth/login', { body: credentials })
}

export function registerAccount(profile) {
  return request('POST', '/auth/register', { body: profile })
}

export async function logout() {
  try {
    if (getAccessToken()) await request('POST', '/auth/logout')
  } catch {
    // The local session is cleared even if the server cannot be reached.
  } finally {
    clearSession()
  }
}
