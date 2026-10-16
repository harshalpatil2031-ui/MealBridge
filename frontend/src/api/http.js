import { clearSession, getAccessToken } from './session.js'

/**
 * Minimal fetch wrapper for the MealBridge API.
 *
 * Reads the base URL from `import.meta.env.VITE_API_URL` so the frontend
 * can point at a different host in production without code changes.
 *
 * Every response is parsed as JSON. Non-2xx responses throw an Error whose
 * message is the server's `detail` string (or a joined list when FastAPI /
 * Pydantic returns an array of validation errors).
 *
 * Network-level failures (server offline, DNS timeout) are caught and
 * rethrown with a human-readable message so callers never see a raw
 * TypeError.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string}  path    – absolute path starting with `/`
 * @param {object}  [opts]
 * @param {object}  [opts.body]   – will be JSON-stringified
 * @param {object}  [opts.params] – appended as ?key=value query parameters
 * @param {AbortSignal} [opts.signal] – for AbortController cancellation
 * @returns {Promise<any>} parsed JSON
 */
export async function request(method, path, { body, params, signal } = {}) {
  const url = new URL(path, BASE_URL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), 12_000);
  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) abortFromCaller();
  else signal?.addEventListener('abort', abortFromCaller, { once: true });
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    throw new Error('Cannot reach the server. Check that the backend is running.');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Server returned ${response.status} with no JSON body.`);
  }

  if (!response.ok) {
    let message;
    if (typeof data.detail === 'string') {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      // Pydantic validation errors: [{loc, msg, type}, …]
      message = data.detail.map(e => e.msg || JSON.stringify(e)).join('; ');
    } else {
      message = `Request failed (${response.status})`;
    }
    if (response.status === 401 && token && !path.startsWith('/auth/')) {
      clearSession();
      window.location.assign('/login');
    }
    throw new Error(message);
  }

  return data;
}
