import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { chatApi } from '../services/api'
import { GlassCard } from '../components/GlassCard'

interface Msg { role: 'user' | 'assistant'; text: string }

const SUGGESTIONS = [
  'Why will this customer churn?',
  "What's the customer's risk level?",
  'What should the company do?',
  'What features affected the prediction?',
]

export function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: "Hi! I'm your retention assistant. Run a prediction, then ask me why a customer is at risk, what's driving it, or what to do about it." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim()) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await chatApi.send(text)
      setMessages((m) => [...m, { role: 'assistant', text: res.data.reply }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Something went wrong reaching the assistant. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="font-display text-2xl font-semibold">AI Assistant</h1>
        <p className="text-white/45 text-sm mt-1">Ask about your most recent churn prediction</p>
      </div>

      <GlassCard className="flex-1 flex flex-col !p-0 overflow-hidden min-h-[520px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === 'user' ? 'bg-white/10' : 'bg-gradient-to-br from-indigo-500 to-cyan-400'
              }`}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-white" />}
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-indigo-500/20 text-white' : 'bg-white/5 text-white/85'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 text-sm bg-white/5 text-white/50">Thinking…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/8 p-4">
          <div className="flex gap-2 flex-wrap mb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/60"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input) }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the prediction…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-4 py-2.5 disabled:opacity-60"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  )
}
