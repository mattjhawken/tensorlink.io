import { 
    ChatSettingsComponent,
    MessageInput,
    MessageList
} from '../components'
import { useChat } from '../hooks/useChat'
import { useChatSettings } from '../hooks/useChatSettings'
import { useChats } from "../hooks/useChats"
import { useMessages } from '../hooks/useMessages'
import type { Message } from '../types/chat'
import { useEffect, useRef, useState } from 'react'

interface InterfaceProps {
  onNavigateToSettings?: () => void
}

export const Interface = ({ onNavigateToSettings }: InterfaceProps) => {
  const { 
    selectedChat, 
    messages, 
    addMessage, 
    removeMessages,
    updateMessage, 
    updateStreamingMessage,
    finalizeStreamingMessage,
    refreshSelectedChat,
  } = useMessages()
  const [inputMessage, setInputMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { createEmptyChat } = useChats()
  const {
    availableModels,
    chatSettings,
    setChatSettings,
    // isConnectingTensorlink,
    tensorlinkStats,
    // connectToTensorlink,
    // getTensorlinkStats
  } = useChatSettings()
  const { isLoading, isSending, streamingMessageId, sendMessage } = useChat()
  const welcomeMessageId = useRef(crypto.randomUUID())

  // Refresh messages when component mounts or when a chat might have been selected
  useEffect(() => {
    refreshSelectedChat()
  }, [refreshSelectedChat])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSendMessage = async () => {
    // Create a new chat if none is selected
    let currentChat = selectedChat
    if (!currentChat) {
      currentChat = createEmptyChat()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const result = await sendMessage(
      inputMessage,
      messages,
      chatSettings,
      addMessage,
      removeMessages,
      updateStreamingMessage,
      finalizeStreamingMessage,
    )

    if (result?.success) {
      setInputMessage('')
    } else if (result) {
      // Restore the user's typed message so they don't lose it
      if (result.restoredInput) {
        setInputMessage(result.restoredInput)
      }

      // Show the actual API error (e.g. "Model has been requested, try again")
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: result.errorMessage ?? 'Failed to send message. Please try again.',
        timestamp: Date.now(),
      }
      addMessage(errorMessage)
    }
  }

  const handleFeedback = (index: number, feedback: 'positive' | 'negative' | null) => {
    updateMessage(index, { feedback })
  }

  // const handleConnectionResult = (result: { success: boolean; message: string }) => {
  //   const systemMessage: Message = {
  //     id: crypto.randomUUID(),
  //     role: 'system',
  //     content: result.message,
  //     timestamp: Date.now()
  //   }
  //   addMessage(systemMessage)
  // }

  // Show welcome message if no chat is selected
  const displayMessages: Message[] = selectedChat 
    ? messages 
    : [
        {
          id: welcomeMessageId.current,
          role: 'system',
          content:
            '## Welcome to localhostGPT\n\nAn AI experience powered by local data and peer-to-peer computing with opt-in privacy enhancing features. Select an existing chat or create a new one to start chatting!',
          timestamp: Date.now(),
        },
      ];

  return (
    <div className="flex flex-col h-full">
      {/* Chat controls */}
      <div className="flex justify-between items-center px-3 py-1 border-b border-white/20">
        <div ref={settingsRef}>
          <ChatSettingsComponent
            chatSettings={chatSettings}
            setChatSettings={setChatSettings}
            availableModels={availableModels}
            showSettings={showSettings}
            tensorlinkStats={tensorlinkStats}
            setShowSettings={setShowSettings}
            onNavigateToSettings={onNavigateToSettings}
          />
        </div>
      </div>

      {/* Messages */}
      <MessageList 
        messages={displayMessages} 
        isLoading={isLoading} 
        onFeedback={handleFeedback}
        streamingMessageId={streamingMessageId}
      />

      <div ref={messagesEndRef} />

      {/* Input */}
      <MessageInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        onSend={handleSendMessage}
        disabled={isSending}
        isSending={isSending}
        selectedChat={selectedChat}
      />
    </div>
  )
}
