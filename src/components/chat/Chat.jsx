import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MdSend, MdStop, MdThumbUp, MdThumbDown, MdContentCopy, MdCheck, MdKeyboardArrowDown } from 'react-icons/md'
import { useStore } from './store.jsx'
import { fetchModels, streamChat } from './api.js'
import { inputBase } from './ui.jsx'

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

function MessageBubble({ message, index, isStreaming, onFeedback }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-3 sm:px-4`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[#4FD8C4]/15 border border-[#4FD8C4]/25'
            : isSystem
              ? 'bg-white/[0.04] border border-white/10'
              : 'bg-white/[0.03] border border-white/10'
        }`}
      >
        <div className="msg-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>
            {message.content}
          </ReactMarkdown>
        </div>

        {message.timestamp && (
          <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-white/10">
            <span className="text-[11px] text-[#5B6272]">
              {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
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

function ModelSelector({ onNavigateToSettings }) {
  const { apiUrl, nodeUrl, settings, setSettings } = useStore()
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    fetchModels({ apiUrl, nodeUrl, nodeConnected: !!nodeUrl }).then((list) => {
      setModels(list)
      if (!settings.model && list[0]) setSettings({ model: list[0].id })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, nodeUrl])

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = models.find((m) => m.id === settings.model)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm font-medium text-[#EDEFF4] hover:border-white/20 transition-colors"
      >
        <span className="truncate max-w-[160px] sm:max-w-[240px]">{current?.name || 'Select model'}</span>
        <MdKeyboardArrowDown className={`text-[#5B6272] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-lg border border-white/10 bg-[#12151c] shadow-lg p-2">
          <p className="px-2 pb-1.5 text-[10px] tracking-[0.15em] uppercase text-[#5B6272]">Model</p>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSettings({ model: m.id })
                  setOpen(false)
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                  m.id === settings.model ? 'bg-white/10 text-[#EDEFF4]' : 'text-[#9AA2B4] hover:bg-white/[0.06]'
                }`}
              >
                {m.name}
                {m.requires_tensorlink && <span className="ml-1.5 text-[10px] text-[#5B6272]">(Tensorlink)</span>}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setOpen(false)
              onNavigateToSettings?.()
            }}
            className="mt-2 w-full rounded-md border-t border-white/10 pt-2 text-left px-2.5 text-xs text-[#4FD8C4] hover:text-[#6EE2D1] transition-colors"
          >
            Don't see your model? Request one →
          </button>
        </div>
      )}
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
  const { activeChat, activeChatId, createChat, addMessage, updateMessage, apiUrl, nodeUrl, settings } = useStore()
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [streamingIndex, setStreamingIndex] = useState(null)
  const [error, setError] = useState('')
  const textareaRef = useRef(null)
  const endRef = useRef(null)
  const abortControllerRef = useRef(null)

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

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending) return

    let chatId = activeChatId
    if (!chatId) {
      chatId = createChat().id
    }

    const userMessage = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() }
    addMessage(chatId, userMessage)
    setInput('')
    setIsSending(true)
    setError('')

    const history = [...messages, userMessage].filter((m) => m.role !== 'system' || m.id !== 'welcome')
    const assistantMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now() }
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
          messages: history,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        },
        (partial) => updateMessage(chatId, assistantIndex, { content: partial }),
        { signal: controller.signal }
      )
    } catch (err) {
      if (err.name === 'AbortError') {
        // User hit Stop — whatever text had streamed in already stays as
        // the final message, we just don't treat this as a failure.
        // NOTE: this only stops the client from reading the response; it
        // doesn't yet tell the node/API to stop generating. Once a
        // cancel endpoint exists on the backend, call it here too.
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
  }, [input, isSending, activeChatId, createChat, addMessage, updateMessage, messages, apiUrl, nodeUrl, settings])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <ModelSelector onNavigateToSettings={onNavigateToSettings} />
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            index={index}
            isStreaming={streamingIndex === index}
            onFeedback={handleFeedback}
          />
        ))}
        {isSending && streamingIndex === null && (
          <div className="flex justify-start px-4">
            <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 rounded-full bg-[#5B6272] animate-pulse" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="mx-3 mb-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">{error}</div>
      )}

      <div className="p-3 border-t border-white/10">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            rows={1}
            className={`${inputBase} resize-none overflow-y-auto`}
          />
          <button
            onClick={isSending ? handleStop : handleSend}
            disabled={!isSending && !input.trim()}
            title={isSending ? 'Stop generating' : 'Send'}
            className={`shrink-0 rounded-lg p-3 transition-colors ${
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
        <p className="text-[11px] text-[#5B6272] mt-1.5 px-1">Press Enter to send, Shift+Enter for a new line</p>
      </div>
    </div>
  )
}
