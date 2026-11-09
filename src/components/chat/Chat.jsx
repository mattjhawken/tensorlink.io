import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MdSend, MdStop, MdThumbUp, MdThumbDown, MdContentCopy, MdCheck, MdKeyboardArrowDown, MdPsychology, MdLanguage, MdHistory } from 'react-icons/md'
import { useStore, resolveFeatures } from './store.jsx'
import { streamChat } from './api.js'
import { retrieve, resolveProvider, formatContext } from './rag/index.js'

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.warn('Copy failed:', err)
    }
  }
  return (
    <button onClick={copy} className={`rounded-md p-1.5 text-[#8B93A7] transition-colors hover:bg-white/10 hover:text-[#EDEFF4] ${className}`} title="Copy">
      {copied ? <MdCheck className="text-emerald-400" size={15} /> : <MdContentCopy size={15} />}
    </button>
  )
}

// Fenced code blocks get a language tag + copy button; everything else in
// the markdown renders through the .msg-prose CSS in index.css.
function CodeBlock({ className, children }) {
  const match = /language-(\w+)/.exec(className || '')
  const code = String(children).replace(/\n$/, '')
  if (!match) return <code className={className}>{children}</code>
  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-3 py-1.5 -mb-1 text-[10px] uppercase tracking-wide text-[#5B6272]">
        <span>{match[1]}</span>
        <CopyButton text={code} className="opacity-0 group-hover:opacity-100" />
      </div>
      <pre>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

function ReasoningBlock({ text, streaming }) {
  const [open, setOpen] = useState(false)
  const show = open || streaming
  return (
    <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.02]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-[#8B93A7] hover:text-[#EDEFF4]"
      >
        <MdPsychology size={14} />
        <span>{streaming ? 'Thinking…' : 'Reasoning'}</span>
        <MdKeyboardArrowDown className={`ml-auto transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>
      {show && (
        <div className="max-h-60 overflow-y-auto whitespace-pre-wrap px-3 pb-2 text-xs leading-relaxed text-[#8B93A7]">{text}</div>
      )}
    </div>
  )
}

function FeatureChip({ icon: Icon, label, active, dim, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        dim
          ? 'border-white/5 text-[#3B4152] hover:text-[#5B6272]'
          : active
            ? 'border-[#4FD8C4]/40 bg-[#4FD8C4]/15 text-[#4FD8C4]'
            : 'border-white/10 text-[#8B93A7] hover:border-white/20 hover:text-[#EDEFF4]'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function formatMessageTime(ms) {
  const d = new Date(ms)
  const now = new Date()
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return time
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
  return `${date}, ${time}`
}

function MessageBubble({ message, index, isStreaming, onFeedback, onOpenChat }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-3 sm:px-4`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] sm:max-w-[75%] rounded-2xl bg-[#1F232C] px-4 py-3'
            : 'w-full px-1 sm:px-3 py-1'
        }
      >
        {message.reasoning && <ReasoningBlock text={message.reasoning} streaming={isStreaming && !message.content} />}
        <div className="msg-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
            {message.content}
          </ReactMarkdown>
        </div>

        {message.sources?.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5B6272]">
            <MdHistory size={12} />
            <span>Used earlier chats:</span>
            {message.sources.map((s) => (
              <button
                key={s.chatId}
                onClick={() => onOpenChat?.(s.chatId)}
                className="max-w-[160px] truncate rounded-full border border-white/10 px-2 py-0.5 text-[#8B93A7] hover:border-white/20 hover:text-[#EDEFF4]"
                title={s.title}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {message.timestamp && (
          <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-[#8B93A7]" title={new Date(message.timestamp).toLocaleString()}>
              <span className="font-medium text-[#9AA2B4]">{isUser ? 'You' : isSystem ? 'System' : 'Assistant'}</span>
              <span className="mx-1.5 text-[#5B6272]">·</span>
              {formatMessageTime(message.timestamp)}
              {isStreaming && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#4FD8C4] animate-pulse align-middle" />}
            </span>

            {!isStreaming && (
              <div className="flex items-center gap-0.5">
                {message.role === 'assistant' && (
                  <>
                    <button
                      onClick={() => onFeedback(index, message.feedback === 'positive' ? null : 'positive')}
                      className={`rounded-md p-1.5 transition-colors ${message.feedback === 'positive' ? 'text-emerald-400 bg-emerald-400/10' : 'text-[#8B93A7] hover:bg-white/10'}`}
                      title="Mark as helpful"
                    >
                      <MdThumbUp size={14} />
                    </button>
                    <button
                      onClick={() => onFeedback(index, message.feedback === 'negative' ? null : 'negative')}
                      className={`rounded-md p-1.5 transition-colors ${message.feedback === 'negative' ? 'text-red-400 bg-red-400/10' : 'text-[#8B93A7] hover:bg-white/10'}`}
                      title="Mark as unhelpful"
                    >
                      <MdThumbDown size={14} />
                    </button>
                  </>
                )}
                <CopyButton text={message.content} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const WELCOME = {
  id: 'welcome',
  role: 'system',
  content:
    '## Welcome to tensorlink.io\n\nAn AI experience powered by local data and peer-to-peer computing, with opt-in privacy-enhancing features. Select an existing chat or start a new one.',
  timestamp: Date.now(),
}

export default function Chat({ onNavigateToSettings }) {
  const { activeChat, activeChatId, createChat, addMessage, updateMessage, setChatFeature, chats, selectChat, apiUrl, nodeUrl, settings, models } = useStore()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [streamingIndex, setStreamingIndex] = useState(null)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)
  const endRef = useRef(null)
  const abortControllerRef = useRef(null)
  const [pendingFeatures, setPendingFeatures] = useState({}) // toggles set before the first message creates a chat

  const currentModel = models.find((m) => m.id === settings.model)
  const overrides = activeChat ? activeChat.features : pendingFeatures
  const features = useMemo(() => resolveFeatures(overrides, settings.features), [overrides, settings.features])
  // Only an explicit `false` from the backend disables a toggle; unknown = assume supported.
  const available = {
    reasoning: currentModel?.supports_reasoning !== false,
    webSearch: currentModel?.supports_web_search !== false,
    rag: !!resolveProvider({ nodeUrl, settings }),
  }
  const activeFeatures = useMemo(
    () => ({
      reasoning: features.reasoning && available.reasoning,
      webSearch: features.webSearch && available.webSearch,
      rag: features.rag && available.rag,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [features, available.reasoning, available.webSearch, available.rag]
  )

  const toggleFeature = (key) => {
    const next = !features[key]
    if (activeChatId) setChatFeature(activeChatId, key, next)
    else setPendingFeatures((p) => ({ ...p, [key]: next }))
  }

  const messages = activeChat ? activeChat.messages : [WELCOME]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingIndex])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [activeChatId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [input])

  const handleFeedback = useCallback(
    (index, feedback) => {
      if (!activeChatId) return
      updateMessage(activeChatId, index, { feedback })
    },
    [activeChatId, updateMessage]
  )

  const composerRef = useRef(null)
  const [composerH, setComposerH] = useState(160)

  useEffect(() => {
    const el = composerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setComposerH(el.offsetHeight))
    ro.observe(el)
    setComposerH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending) return
    
    let chatId = activeChatId
    if (!chatId) {
      chatId = createChat(pendingFeatures).id
      setPendingFeatures({})
    }

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() }
    addMessage(chatId, userMessage)
    setInput('')
    setIsSending(true)
    setError('')

    // Check for relevent
    let ragHits = []
    if (activeFeatures.rag) {
      try {
        ragHits = (await retrieve(text, { settings, nodeUrl, apiUrl }, { excludeChatId: chatId })).hits
      } catch (err) {
        console.warn('History retrieval failed:', err)
      }
    }

    const history = [...messages, userMessage].filter((m) => m.role !== 'system' || m.id !== 'welcome')
    const sources = [...new Map(ragHits.map((h) => [h.chatId, { chatId: h.chatId, title: h.title }])).values()]
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      ...(sources.length ? { sources } : {}),
    }
    addMessage(chatId, assistantMessage)
    const assistantIndex = history.length
    setStreamingIndex(assistantIndex)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      await streamChat(
        {
          apiUrl,
          nodeUrl,
          nodeConnected: !!nodeUrl,
          model: settings.model,
          messages: ragHits.length ? [{ role: 'system', content: formatContext(ragHits) }, ...history] : history,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          features: activeFeatures,
          topP: settings.topP
        },
        (partial, reasoning) =>
          updateMessage(chatId, assistantIndex, reasoning ? { content: partial, reasoning } : { content: partial }),
        { signal: controller.signal }
      )
    } catch (err) {
      if (err.name === 'AbortError') {
        // User hit Stop
        // NOTE: this only stops the client from reading the response;
        // Once we implement cancel endpoint, call it here.
      } else {
        updateMessage(chatId, assistantIndex, {
          content: err.message?.includes('requested')
            ? err.message
            : `Sorry — I couldn't reach a model. ${err.message || 'Please try again.'}`,
        })
        setError(err.message || 'Failed to send message.')
      }
    } finally {
      setIsSending(false)
      setStreamingIndex(null)
      abortControllerRef.current = null
    }
  }, [input, isSending, activeChatId, createChat, addMessage, updateMessage, messages, apiUrl, nodeUrl, settings, pendingFeatures, activeFeatures])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const fade = `linear-gradient(to bottom, black calc(100% - ${composerH + 72}px), transparent calc(92%))`

  return (
    <div className="relative h-[calc(100dvh-43px)] sm:h-[calc(100dvh-51px)]">
      {/* Messages: full height, scrolling behind the input, fading out from the input's top edge down */}
      <div
        className="absolute inset-0 overflow-y-auto pt-4"
        style={{ paddingBottom: composerH + 16, WebkitMaskImage: fade, maskImage: fade }}
      >
        <div className="mx-auto w-full max-w-6xl space-y-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              index={index}
              isStreaming={streamingIndex === index}
              onFeedback={handleFeedback}
              onOpenChat={(id) => chats.some((c) => c.id === id) && selectChat(id)}
            />
          ))}
          {isSending && streamingIndex === null && (
            <div className="flex justify-start px-3 sm:px-4">
              <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-[#151922] px-4 py-3">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-[#5B6272] animate-pulse" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input overlay: clicks and scrolling pass through everywhere except the card itself */}
      <div ref={composerRef} className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 pt-1 sm:pb-5">
        {error && (
          <div className="pointer-events-auto mx-auto mb-2 w-full max-w-3xl rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div
          onClick={(e) => !e.target.closest('button') && textareaRef.current?.focus()}
          className="pointer-events-auto mx-auto w-full max-w-3xl cursor-text rounded-2xl border border-white/10 bg-[#12151c] shadow-lg shadow-black/30 transition-colors focus-within:border-[#4FD8C4]/40 focus-within:ring-2 focus-within:ring-[#4FD8C4]/20"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            rows={1}
            className="block w-full resize-none overflow-y-auto bg-transparent px-4 pb-1 pt-3 text-sm text-[#EDEFF4] placeholder:text-[#5B6272] focus:outline-none"
          />

          <div className="flex items-end justify-between gap-2 px-2.5 pb-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <FeatureChip
                icon={MdPsychology}
                label="Reasoning"
                active={features.reasoning && available.reasoning}
                dim={!available.reasoning}
                title={available.reasoning ? 'Let the model think step by step before answering' : "This model doesn't support reasoning"}
                onClick={() => available.reasoning && toggleFeature('reasoning')}
              />
              <FeatureChip
                icon={MdLanguage}
                label="Web search"
                active={features.webSearch && available.webSearch}
                dim={!available.webSearch}
                title={available.webSearch ? 'Let the model search the web — queries leave the Tensorlink network' : "This model doesn't support web search"}
                onClick={() => available.webSearch && toggleFeature('webSearch')}
              />
              <FeatureChip
                icon={MdHistory}
                label="Chat history"
                active={features.rag && available.rag}
                dim={!available.rag}
                title={available.rag ? 'Let the model draw on your earlier chats' : 'Set up chat history search in Settings first'}
                onClick={() => (available.rag ? toggleFeature('rag') : onNavigateToSettings?.())}
              />
            </div>

            <button
              onClick={isSending ? handleStop : handleSend}
              disabled={!isSending && !input.trim()}
              title={isSending ? 'Stop generating' : 'Send'}
              className={`shrink-0 rounded-full p-2.5 transition-colors ${
                isSending
                  ? 'bg-red-400/15 text-red-300 hover:bg-red-400/25'
                  : !input.trim()
                    ? 'bg-white/5 text-[#5B6272] cursor-not-allowed'
                    : 'bg-[#4FD8C4] text-[#0A0D13] hover:bg-[#6EE2D1]'
              }`}
            >
              {isSending ? <MdStop size={18} /> : <MdSend size={18} />}
            </button>
          </div>
        </div>

        <p className="mx-auto mt-2 hidden max-w-3xl px-1 text-center text-[11px] text-[#5B6272] sm:block">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  )
}
