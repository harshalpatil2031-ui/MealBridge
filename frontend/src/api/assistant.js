import { request } from './http.js'

export function getAssistantStatus() {
  return request('GET', '/assistant/status')
}

export function chatWithAssistant({ message, history = [], donationId }) {
  return request('POST', '/assistant/chat', {
    body: {
      message,
      history,
      donation_id: donationId,
    },
  })
}
