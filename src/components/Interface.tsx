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

export const Interface = () => {
  const { 
    selectedChat, 
    messages, 
    addMessage, 
    updateMessage, 
    updateStreamingMessage,
    finalizeStreamingMessage,
    refreshSelectedChat 
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
    isConnectingTensorlink,
    tensorlinkStats,
    connectToTensorlink,
    getTensorlinkStats
  } = useChatSettings()
  const { isLoading, isSending, streamingMessageId, sendMessage } = useChat()

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
      // Wait a bit for the chat to be created and selected
      await new Promise(resolve => setTimeout(resolve, 50))
      refreshSelectedChat()
    }

    // Pass the streaming callbacks
    const result = await sendMessage(
      inputMessage,
      messages,
      chatSettings,
      addMessage,
      updateStreamingMessage,
      finalizeStreamingMessage 
    )

    if (result?.success) {
      setInputMessage('')
    } else {
      // Only add error message here to avoid duplicates
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "system",
        content: "Error: Failed to send message. Please try again.",
        timestamp: Date.now(),
      };

      addMessage(errorMessage)
    }
  }

  const handleFeedback = (index: number, feedback: 'positive' | 'negative') => {
    updateMessage(index, { feedback })
  }

  const handleConnectionResult = (result: { success: boolean; message: string }) => {
    const systemMessage: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content: result.message,
      timestamp: Date.now()
    }
    addMessage(systemMessage)
  }

  // Show welcome message if no chat is selected
  const displayMessages: Message[] = selectedChat 
    ? messages 
    : [
        {
          id: crypto.randomUUID(),
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
            getTensorlinkStats={getTensorlinkStats}
            setShowSettings={setShowSettings}
            isConnectingTensorlink={isConnectingTensorlink}
            connectToTensorlink={connectToTensorlink}
            onConnectionResult={handleConnectionResult}
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