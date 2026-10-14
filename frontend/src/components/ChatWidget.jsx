import { useEffect, useRef, useState } from 'react'

const quickReplies = ['Check my donation', 'Rescue options?', 'How does split work?']
const replies = {
  status: 'Your latest donation of 60 meals is currently MATCHED with Asha Trust NGO. Pickup expected by 7:30 PM. ✅',
  rescue: 'The Rescue Engine is active! We found 2 alternatives: Asha Trust (35 meals) + Hope Kitchen (25 meals). Both have accepted. 🎯',
  split: 'Your 80-meal donation has been split: Asha Trust gets 50 meals, Hope Kitchen gets 30 meals. Both confirmed pickup. ✂️',
  cancel: 'No worries! The Rescue Engine will automatically find a new recipient within 2 minutes. ⚡',
  help: 'I can help with donation status, rescue options, split donations, and finding recipients. Just ask! 😊',
}

function getReply(text) {
  const query = text.toLowerCase()
  if (/status|donation|pickup|match/.test(query)) return replies.status
  if (/rescue|alternative|option/.test(query)) return replies.rescue
  if (/split|divide/.test(query)) return replies.split
  if (/cancel|decline/.test(query)) return replies.cancel
  if (/help/.test(query)) return replies.help
  return "I'm on it! Let me check the latest donation data for you... 🔍"
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState([{ from: 'assistant', text: 'Hi! I can help you check donation status or explore rescue options. What would you like to know?' }])
  const listRef = useRef(null)

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages, typing, open])

  const send = (value = input) => {
    const text = value.trim()
    if (!text || typing) return
    setMessages(current => [...current, { from: 'user', text }])
    setInput('')
    setTyping(true)
    window.setTimeout(() => {
      setMessages(current => [...current, { from: 'assistant', text: getReply(text) }])
      setTyping(false)
    }, 1000)
  }

  return <div className="chat-widget">
    {open && <section className="chat-panel" aria-label="MealBridge AI chat">
      <header className="chat-header"><div className="chat-avatar">✦</div><div><strong>MealBridge AI</strong><span><i className="online-dot" /> Online · demo assistant</span></div>
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
      <p className="chat-disclaimer">Scripted demo assistant · Responses use sample data</p>
    </section>}
    <button className="chat-launcher" aria-label={open ? 'Close chat' : 'Open MealBridge AI chat'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? '×' : '💬'}</button>
  </div>
}
