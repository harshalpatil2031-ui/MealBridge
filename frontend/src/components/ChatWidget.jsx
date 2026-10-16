import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { chatWithAssistant, getAssistantStatus } from '../api/assistant.js'

const quickReplies = ['Latest donation status', 'Show recovery details', 'How does matching work?']
const initialMessage = 'Hi! I can explain current donation statuses and recovery details from MealBridge. What would you like to know?'

export default function ChatWidget() {
  const location = useLocation()
  const params = useParams()
  const donationId = params.id || new URLSearchParams(location.search).get('donationId') || undefined
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState([{ from: 'assistant', text: initialMessage }])
  const [assistantStatus, setAssistantStatus] = useState({ loading: true, configured: false, message: '' })
  const listRef = useRef(null)

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages, typing, open])

  useEffect(() => {
    let active = true
    getAssistantStatus()
      .then(status => { if (active) setAssistantStatus({ loading: false, ...status }) })
      .catch(() => { if (active) setAssistantStatus({ loading: false, configured: false, message: 'The MealBridge backend is unavailable.' }) })
    return () => { active = false }
  }, [])

  async function send(value = input) {
    const text = value.trim()
    if (!text || typing) return
    setMessages(current => [...current, { from: 'user', text }])
    setInput('')
    setTyping(true)
    try {
      const history = messages.slice(-8).map(message => ({
        role: message.from,
        content: message.text,
      }))
      const response = await chatWithAssistant({ message: text, history, donationId })
      setMessages(current => [...current, { from: 'assistant', text: response.reply }])
    } catch (error) {
      setMessages(current => [...current, {
        from: 'assistant',
        text: error.message || 'I could not reach the assistant. Please try again.',
      }])
    } finally {
      setTyping(false)
    }
  }

  const statusText = assistantStatus.loading
    ? 'Checking connection…'
    : assistantStatus.configured
      ? `Connected · ${assistantStatus.provider}`
      : 'Not connected · IBM setup needed'

  return <div className="chat-widget">
    {open && <section className="chat-panel" aria-label="MealBridge AI chat">
      <header className="chat-header"><div className="chat-avatar">✦</div><div><strong>MealBridge Assistant</strong><span><i className={assistantStatus.configured ? 'online-dot' : 'offline-dot'} /> {statusText}</span></div>
        <button aria-label="Close chat" onClick={() => setOpen(false)}>×</button></header>
      <div className="chat-messages" ref={listRef} aria-live="polite">
        {messages.map((message, index) => <div key={`${index}-${message.from}`} className={`chat-message ${message.from}`}>{message.text}</div>)}
        {typing && <div className="chat-message assistant typing-dots" aria-label="Assistant is typing"><i /><i /><i /></div>}
      </div>
      <div className="chat-quick-replies">{quickReplies.map(reply => <button key={reply} disabled={typing} onClick={() => send(reply)}>{reply}</button>)}</div>
      <form className="chat-composer" onSubmit={event => { event.preventDefault(); send() }}>
        <input aria-label="Message MealBridge AI" value={input} onChange={event => setInput(event.target.value)} placeholder="Ask about a donation…" />
        <button aria-label="Send message" disabled={!input.trim() || typing}>➤</button>
      </form>
      <p className="chat-disclaimer">{assistantStatus.configured ? 'Your question and selected donation details are sent to IBM watsonx.ai for an explanation. Verify statuses before acting.' : 'Add IBM watsonx.ai settings to backend/.env to enable live answers.'}</p>
    </section>}
    <button className="chat-launcher" aria-label={open ? 'Close chat' : 'Open MealBridge AI chat'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? '×' : '💬'}</button>
  </div>
}
