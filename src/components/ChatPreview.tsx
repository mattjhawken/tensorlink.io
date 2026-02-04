import { isEmpty } from 'lodash'
import { twMerge } from 'tailwind-merge'
import type { ComponentProps } from 'react'
import type { ChatInfo } from '../types/chat'
import { useChatsList } from '../hooks/useChatList'
import { cn, formatDateFromMs } from '../utils'
import { useEffect, useState } from 'react'

export type ChatPreviewProps = ChatInfo & {
  isActive?: boolean
  searchQuery?: string
} & ComponentProps<'div'>

export const ChatPreview = ({
  title,
  content,
  lastEditTime,
  isActive = false,
  searchQuery = '',
  className,
  ...props
}: ChatPreviewProps) => {
  const date = formatDateFromMs(lastEditTime)

  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchQuery) return text

    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'))
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-white">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  return (
    <div
      className={cn(
        'cursor-pointer px-2.5 py-1 rounded-md transition-colors duration-75',
        {
          'bg-zinc-400/75': isActive,
          'hover:bg-zinc-500/75': !isActive
        },
        className
      )}
      {...props}
    >
      <h3 className="mt-1 font-bold truncate">{highlightText(title)}</h3>
      <span className="inline-block w-full mb-1 text-xs font-light text-left text-white/60">{date}</span>
    </div>
  )
}

export type ChatPreviewListProps = ComponentProps<'ul'> & {
  onSelect?: () => void
}

export const ChatPreviewList = ({ 
  onSelect, 
  className,
  ...props 
}: ChatPreviewListProps) => {
  const { chats, selectedChatIndex, handleChatSelect, refreshChats } = useChatsList({ onSelect })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alphabetical'>('recent')

  // Refresh chats periodically to catch updates
  useEffect(() => {
    refreshChats()
  }, [refreshChats])

  if (!chats) return null

  // Filter chats based on search
  const filteredChats = searchQuery
    ? chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats

  // Sort chats
  const sortedChats = [...filteredChats].sort((a, b) => {
    const aTime = a.lastEditTime || 0
    const bTime = b.lastEditTime || 0

    switch (sortBy) {
      case 'alphabetical':
        return a.title.localeCompare(b.title)
      case 'oldest':
        return aTime - bTime
      case 'recent':
      default:
        return bTime - aTime
    }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search and filter controls */}
      <div className="px-2 pb-3 space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          className="w-full bg-zinc-800 text-white text-sm rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/40"
        />
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/60">
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical')}
            className="bg-zinc-800 text-white text-xs rounded px-2 py-1 outline-none cursor-pointer"
          >
            <option value="recent">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">A–Z</option>
          </select>
        </div>
      </div>

      {/* Chat list */}
      {isEmpty(sortedChats) ? (
        <ul className={twMerge('text-center pt-4 px-4', className)} {...props}>
          <span className="text-white/60 text-sm">
            {searchQuery ? 'No chats found' : 'No chats yet!'}
          </span>
        </ul>
      ) : (
        <ul className={twMerge('overflow-y-auto flex-1', className)} {...props}>
          {sortedChats.map(chat => {
            // Find original index for selection
            const originalIndex = chats.findIndex(c => c.id === chat.id)
            return (
              <ChatPreview
                key={chat.id}
                isActive={selectedChatIndex === originalIndex}
                onClick={handleChatSelect(originalIndex)}
                searchQuery={searchQuery}
                {...chat}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}
