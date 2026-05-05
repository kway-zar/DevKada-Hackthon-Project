import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, MessageCircle, Send, Stethoscope, X } from 'lucide-react'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ChatLanguage = 'english' | 'tagalog'

const SYSTEM_PROMPT = `You are Gabay, a short health-education assistant for people using FilCare. You only answer about general health, wellness, and public health topics (e.g. what a symptom might mean in broad terms, when to seek urgent care, healthy habits, definitions).

Rules you must follow:
- Never diagnose, prescribe, or give personal treatment plans. Always say only a licensed clinician can diagnose or treat.
- Do not answer questions about the FilCare app, website, features, accounts, bugs, or product suggestions; politely say you only handle general health topics.
- Do not give medical advice tailored to someone's unique situation; keep it educational and encourage professional care.
- Refuse unrelated topics (tech support, politics, entertainment, etc.) briefly.
- Keep replies concise and clear.`

const APP_OR_PRODUCT_RE =
  /\b(filcare|this app|your app|the app|website|login|sign\s*in|sign\s*up|password|dashboard|patient portal|doctor portal|hackathon|feature request|bug report|how do i use)\b/i

function looksOffTopicForGabay(text: string): boolean {
  const t = text.trim()
  if (t.length < 2) return false
  return APP_OR_PRODUCT_RE.test(t)
}

function getApiConfig() {
  const apiKey = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim()
  const base =
    ((import.meta.env.VITE_OPENAI_API_BASE as string | undefined)?.trim() ||
      'https://openrouter.ai/api/v1').replace(/\/$/, '')
  const model =
    (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() ||
    'openai/gpt-4o-mini'
  return { apiKey, base, model }
}

export function GabayChatbot() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<ChatLanguage>('english')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const languageLabel = language === 'english' ? 'English' : 'Tagalog'

  const localized = useMemo(
    () =>
      language === 'english'
        ? {
            initial:
              'Good day! I am Gabay. I can share general health information only, not a doctor\'s diagnosis. What is your health-related question?',
            offTopic:
              'Sorry, I can only help with general health information. I cannot answer questions about the app, website, or product suggestions.',
            noKey:
              'No API key found. Set VITE_OPENAI_API_KEY in FilCare/.env. For OpenRouter also set VITE_OPENAI_API_BASE=https://openrouter.ai/api/v1 and a valid VITE_OPENAI_MODEL.',
            unclear:
              'Sorry, I do not have a clear answer right now. Please consult a licensed doctor.',
            error:
              'There was an error connecting to the AI service. Please check your internet, API key, base URL, or model.',
            typing: 'Typing...',
            onlyInfo: 'This does not replace a doctor. General education only.',
            inputLabel: 'Your question',
            placeholder: 'Ask about health (general only)...',
            emergency:
              'Emergency? Call your local emergency services. Gabay does not provide diagnosis or treatment.',
            open: 'Open Gabay',
            close: 'Close Gabay',
          }
        : {
            initial:
              'Magandang araw! Ako si Gabay. Pangkalahatang impormasyon sa kalusugan lang ang maibibigay ko, hindi diagnosis ng doktor. Ano ang tanong mo tungkol sa kalusugan?',
            offTopic:
              'Pasensya, pangkalahatang impormasyon sa kalusugan lang ang masasagot ko. Hindi ako sumasagot tungkol sa app, website, o product suggestions.',
            noKey:
              'Walang API key. Ilagay ang VITE_OPENAI_API_KEY sa FilCare/.env. Para sa OpenRouter, ilagay din ang VITE_OPENAI_API_BASE=https://openrouter.ai/api/v1 at valid na VITE_OPENAI_MODEL.',
            unclear:
              'Pasensya, wala akong malinaw na sagot ngayon. Kumonsulta sa lisensyadong doktor.',
            error:
              'Nagkaroon ng error sa AI service. Paki-check ang internet, API key, base URL, o model.',
            typing: 'Nagta-type...',
            onlyInfo: 'Hindi ito kapalit ng doktor. Pangkalahatang health education lang.',
            inputLabel: 'Iyong tanong',
            placeholder: 'Magtanong tungkol sa kalusugan (general lamang)...',
            emergency:
              'Emergency? Tumawag sa local emergency services. Hindi nagbibigay ng diagnosis o treatment si Gabay.',
            open: 'Buksan si Gabay',
            close: 'Isara si Gabay',
          },
    [language]
  )

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: localized.initial },
  ])

  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    if (looksOffTopicForGabay(text)) {
      setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: localized.offTopic }])
      setInput('')
      return
    }

    const { apiKey, base, model } = getApiConfig()
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    if (!apiKey) {
      setMessages((m) => [...m, { role: 'assistant', content: localized.noKey }])
      setLoading(false)
      return
    }

    try {
      const history = messages.map((x) => ({ role: x.role, content: x.content }))
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FilCare Gabay',
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          max_tokens: 600,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'system',
              content: `Reply only in ${languageLabel}. Translate when needed. Keep answers healthcare-only and educational.`,
            },
            ...history,
            { role: 'user', content: text },
          ],
        }),
      })

      if (!res.ok) throw new Error(await res.text())

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const reply = data.choices?.[0]?.message?.content?.trim()
      setMessages((m) => [...m, { role: 'assistant', content: reply || localized.unclear }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: localized.error }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, languageLabel, localized])

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">
      {open && (
        <div
          className="pointer-events-auto flex h-[min(75vh,34rem)] max-h-[calc(100vh-6.5rem)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-blue-900/10"
          role="dialog"
          aria-label="Gabay health education chat"
        >
          <div className="flex items-start gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Stethoscope className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">Gabay</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  Health info only
                </span>
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-blue-100">{localized.onlyInfo}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/90 transition hover:bg-white/15 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-3"
          >
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-md bg-blue-600 text-white'
                      : 'rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                  {localized.typing}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-end gap-2">
              <label className="text-[11px] text-gray-500" htmlFor="gabay-language">
                Language
              </label>
              <select
                id="gabay-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as ChatLanguage)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
              >
                <option value="english">English</option>
                <option value="tagalog">Tagalog</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="gabay-input">
                {localized.inputLabel}
              </label>
              <textarea
                id="gabay-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder={localized.placeholder}
                className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none ring-blue-500/30 placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-gray-400">{localized.emergency}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/40 ring-4 ring-white transition hover:scale-105 hover:shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        aria-expanded={open}
        title={open ? localized.close : localized.open}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden />
        ) : (
          <span className="relative flex h-full w-full items-center justify-center">
            <Activity className="h-7 w-7" aria-hidden />
            <MessageCircle
              className="absolute -right-0.5 -top-0.5 h-4 w-4 text-blue-100 drop-shadow"
              aria-hidden
            />
          </span>
        )}
      </button>
    </div>
  )
}
