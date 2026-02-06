import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types/chat'
import type { CSSProperties } from 'react'

const prismStyle: { [key: string]: CSSProperties } = oneDark

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onFeedback: (index: number, feedback: 'positive' | 'negative') => void
  onRegenerate?: (index: number) => void
  onEdit?: (index: number, newContent: string) => void
  streamingMessageId?: string | null
}

// Copy button component
const CopyButton: React.FC<{ code: string; className?: string }> = ({ 
  code, 
  className = '' 
}) => {
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
      className={`p-1.5 rounded bg-gray-700/80 hover:bg-gray-600 transition-all duration-200 ${className}`}
      title="Copy code"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

// Markdown renderer with syntax highlighting
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Code blocks with syntax highlighting
        code({ className, children, style, ref, ...props }) {
          const match = /language-(\w+)/.exec(className || '')

          // Inline code (no language)
          if (!match) {
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-gray-800/60 text-blue-300 font-mono text-[0.813rem] border border-gray-700/30"
                {...props}
              >
                {children}
              </code>
            )
          }

          // Block code
          const codeContent = String(children).replace(/\n$/, '')
          const language = match[1]

          return (
            <div className="relative group my-3 rounded-lg overflow-hidden bg-[#282c34] border border-gray-700/50">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {language}
                </span>
                <CopyButton
                  code={codeContent}
                  className="opacity-0 group-hover:opacity-100"
                />
              </div>

              <SyntaxHighlighter
                style={prismStyle}
                language={language}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                  fontSize: '0.813rem',
                  lineHeight: '1.5',
                }}
                {...props}
              >
                {codeContent}
              </SyntaxHighlighter>
            </div>
          )
        },
        
        // Paragraphs
        p({ children }) {
          return <p className="mb-3 last:mb-0 leading-relaxed text-[0.938rem]">{children}</p>
        },
        
        // Headings
        h1({ children }) {
          return <h1 className="text-xl font-semibold mb-3 mt-4 first:mt-0 text-white">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-white">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-white">{children}</h3>
        },
        
        // Lists
        ul({ children }) {
          return <ul className="mb-3 ml-4 space-y-1 list-disc marker:text-gray-500">{children}</ul>
        },
        ol({ children }) {
          return <ol className="mb-3 ml-4 space-y-1 list-decimal marker:text-gray-500">{children}</ol>
        },
        li({ children }) {
          return <li className="leading-relaxed text-[0.938rem] pl-1">{children}</li>
        },
        
        // Blockquotes
        blockquote({ children }) {
          return (
            <blockquote className="border-l-3 border-blue-500/50 pl-4 py-1 my-3 italic text-gray-300 bg-gray-800/30 rounded-r">
              {children}
            </blockquote>
          )
        },
        
        // Links
        a({ href, children }) {
          return (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300 transition-colors"
            >
              {children}
            </a>
          )
        },
        
        // Tables
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-gray-800/50">{children}</thead>
        },
        th({ children }) {
          return (
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 border-b border-gray-700">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700/50">
              {children}
            </td>
          )
        },
        
        // Horizontal rule
        hr() {
          return <hr className="my-4 border-gray-700/50" />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
  )
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  onFeedback,
  onRegenerate,
  onEdit,
  streamingMessageId,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
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
                className={`relative pt-2.5 pb-1.5 px-3 sm:px-4 rounded-lg shadow-lg transition-all duration-200 ${
                  message.role === 'user'
                    ? 'bg-blue-600/70 text-white rounded-br-none backdrop-blur-sm'
                    : message.role === 'system'
                    ? 'bg-gray-600/70 text-white backdrop-blur-sm'
                    : 'bg-gray-800/90 text-white rounded-bl-none backdrop-blur-sm border border-gray-700/50'
                }`}
              >
                {/* Header with timestamp and copy button */}
                {message.timestamp && (
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                    <span className="text-xs text-white/70 font-medium">
                      {message.role === 'user'
                        ? 'You'
                        : message.role === 'assistant'
                        ? 'Assistant'
                        : 'System'}{' '}
                      • {formatTime(message.timestamp)}
                      {isStreaming && (
                        <span className="ml-2 inline-flex items-center">
                          <svg
                            className="animate-spin h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        </span>
                      )}
                    </span>

                    {/* Copy button */}
                    {!isStreaming && (
                      <button
                        onClick={() => handleCopyMessage(message.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                        title="Copy message"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Message content */}
                {editingId === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-gray-800 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] font-mono text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(index)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="message-content">
                    <MarkdownRenderer content={message.content || ''} />
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-white/70 animate-pulse rounded-sm" />
                    )}
                  </div>
                )}

                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' &&
                  editingId !== message.id &&
                  !isStreaming && (
                    <div className="flex pt-2 space-x-1 justify-end border-white/10">
                      <button
                        onClick={() => onFeedback(index, 'positive')}
                        className={`p-1.5 rounded transition-all duration-200 ${
                          message.feedback === 'positive'
                            ? 'bg-green-600 shadow-lg'
                            : 'bg-gray-700/80 hover:bg-gray-600'
                        }`}
                        title="Mark as helpful"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                        className={`p-1.5 rounded transition-all duration-200 ${
                          message.feedback === 'negative'
                            ? 'bg-red-600 shadow-lg'
                            : 'bg-gray-700/80 hover:bg-gray-600'
                        }`}
                        title="Mark as unhelpful"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
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
                          className="p-1.5 rounded bg-gray-700/80 hover:bg-gray-600 transition-all duration-200"
                          title="Regenerate response"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
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
                {message.role === 'user' &&
                  editingId !== message.id &&
                  onEdit && (
                    <button
                      onClick={() =>
                        handleStartEdit(message.id, message.content)
                      }
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                      title="Edit message"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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

        {/* Loading indicator */}
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
