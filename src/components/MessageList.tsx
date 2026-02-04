import React, { useState } from 'react'
import type { Message } from '../types/chat'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onFeedback: (index: number, feedback: 'positive' | 'negative') => void
  onRegenerate?: (index: number) => void
  onEdit?: (index: number, newContent: string) => void
  streamingMessageId?: string | null
}

type RendererProps = {
  content: string
}

type TextPart = {
  type: 'text'
  content: string
}

type CodePart = {
  type: 'code'
  content: string
  language: string
}

type RenderPart = TextPart | CodePart

// Copy button component
const CopyButton: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors z-10"
      title="Copy code"
    >
      {copied ? (
        <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

// Simple fallback renderer for problematic content
const FallbackRenderer: React.FC<RendererProps> = ({ content }) => {
  const renderContent = (text: string): RenderPart[] => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const parts: RenderPart[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        })
      }

      parts.push({
        type: 'code',
        language: match[1] || '',
        content: match[2]
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      })
    }

    return parts.length ? parts : [{ type: 'text', content: text }]
  }

  const parts = renderContent(content)

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <div key={index} className="bg-gray-800 rounded p-3 overflow-x-auto relative group">
              {part.language && <div className="text-sm text-gray-400 mb-2">{part.language}</div>}
              <CopyButton code={part.content} />
              <pre className="text-xs whitespace-pre-wrap">
                <code>{part.content}</code>
              </pre>
            </div>
          )
        } else {
          const textContent = part.content.split('\n').map((line, lineIndex) => (
            <div key={lineIndex} className={line.trim() === '' ? 'h-4' : 'text-sm'}>
              {line || '\u00A0'}
            </div>
          ))

          return <div key={index}>{textContent}</div>
        }
      })}
    </div>
  )
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onFeedback,
  onRegenerate,
  onEdit,
  streamingMessageId
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const handleSaveEdit = (index: number) => {
    if (onEdit && editContent.trim()) {
      onEdit(index, editContent)
    }
    setEditingId(null)
    setEditContent('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  return (
    <div className="flex-1 overflow-auto px-2 sm:px-4 py-2">
      <div className="mx-auto w-full max-w-4xl">

        {messages.map((message, index) => {
          const isStreaming = streamingMessageId === message.id
          
          return (
            <div
              key={message.id}
              className={`mb-4 group min-w-0 ${
                message.role === 'user'
                  ? 'ml-auto w-full max-w-[95%] sm:max-w-[92%]'
                  : message.role === 'system'
                    ? 'mx-auto w-full max-w-[95%] sm:max-w-[92%]'
                    : 'mr-auto w-full max-w-[95%] sm:max-w-[92%]'

              }`}
            >
              <div
                className={`relative p-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600/60 text-white rounded-br-none'
                    : message.role === 'system'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-700 text-white rounded-bl-none'
                }`}
              >
                {message.timestamp && (
                  <div className="text-xs text-white/70 mb-1 flex justify-between items-center">
                    <span>
                      {message.role === 'user'
                        ? 'You'
                        : message.role === 'assistant'
                          ? 'Assistant'
                          : 'System'}{' '}
                      • {formatTime(message.timestamp)}
                      {isStreaming && (
                        <span className="ml-2 inline-flex items-center">
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </span>
                      )}
                    </span>
                    
                    {/* Copy button for all messages */}
                    {!isStreaming && (
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                        title="Copy message"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {editingId === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-gray-800 text-white p-2 rounded outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(index)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="">
                    <>
                      <FallbackRenderer content={message.content || ''} />
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-white/70 animate-pulse" />
                      )}
                    </>
                  </div>
                )}

                {/* Action buttons */}
                {message.role === 'assistant' && editingId !== message.id && !isStreaming && (
                  <div className="flex mt-2 space-x-1 justify-end">
                    <button
                      onClick={() => onFeedback(index, 'positive')}
                      className={`justify-center rounded p-1! ${
                        message.feedback === 'positive'
                          ? 'bg-green-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      title="Mark as helpful"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onFeedback(index, 'negative')}
                      className={`rounded p-1! ${
                        message.feedback === 'negative' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      title="Mark as unhelpful"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2"
                        />
                      </svg>
                    </button>
                    {onRegenerate && (
                      <button
                        onClick={() => onRegenerate(index)}
                        className="p-1 rounded bg-gray-700 hover:bg-gray-600"
                        title="Regenerate response"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Edit button for user messages */}
                {message.role === 'user' && editingId !== message.id && onEdit && (
                  <button
                    onClick={() => handleStartEdit(message.id, message.content)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                    title="Edit message"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {isLoading && !streamingMessageId && (
          <div className="flex justify-start items-center my-4 pl-4">
            <div className="flex space-x-2">
              {[0, 400, 800].map((delay, i) => (
                <div
                  key={i}
                  className="h-3 w-3 bg-gray-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
