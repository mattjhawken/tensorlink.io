import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, ChatInfo } from "../types/chat";
import { chatStorage } from "../utils/chatStorage";
import { chatEvents } from "../utils/chatEvents";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatInfo | null>(null);
  const streamingContentRef = useRef<{ [key: string]: string }>({});

  // Load messages when selected chat changes
  const loadSelectedChat = useCallback(() => {
    const selectedIndex = chatStorage.getSelectedChatIndex();

    if (selectedIndex !== null) {
      const chats = chatStorage.getChats();
      const chat = chats[selectedIndex];

      if (!chat) return;

      setSelectedChat((prev) => {
        if (prev?.id === chat.id) return prev;
        return chat;
      });

      setMessages((prev) => {
        if (selectedChat?.id === chat.id) return prev;
        return chat.messages || [];
      });
    } else {
      setSelectedChat(null);
      setMessages([]);
    }
  }, [selectedChat]);

  // Load on mount and subscribe to changes
  useEffect(() => {
    loadSelectedChat();

    // Subscribe to chat events
    const unsubscribe = chatEvents.subscribe(loadSelectedChat);

    return unsubscribe;
  }, [loadSelectedChat]);

  // Refresh selected chat from storage
  const refreshSelectedChat = useCallback(() => {
    const selectedIndex = chatStorage.getSelectedChatIndex();
    if (selectedIndex !== null) {
      const chats = chatStorage.getChats();
      const chat = chats[selectedIndex];
      if (chat) {
        setSelectedChat(chat);
        setMessages(chat.messages || []);
      }
    }
  }, []);

  // Add a message and save to storage
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const updated = [...prev, message];

      setSelectedChat((chat) => {
        if (!chat) return chat;

        chatStorage.updateChat(chat.id, {
          messages: updated,
          ...(chat.title === "New Chat" &&
            message.role === "user" &&
            prev.length === 0 && {
              title:
                message.content.slice(0, 50) +
                (message.content.length > 50 ? "..." : ""),
            }),
        });

        return chat;
      });

      return updated;
    });
  }, []);

  // Update streaming content for a specific message
  const updateStreamingMessage = useCallback(
    (messageId: string, chunk: string) => {
      // Accumulate in ref for performance
      if (!streamingContentRef.current[messageId]) {
        streamingContentRef.current[messageId] = "";
      }
      streamingContentRef.current[messageId] += chunk;

      // Update state to trigger re-render
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: streamingContentRef.current[messageId],
            };
          }
          return msg;
        });
      });
    },
    [],
  );

  // Save streaming updates to storage after stream completes
  const finalizeStreamingMessage = useCallback((messageId?: string) => {
    // Clear the ref for this message
    if (messageId && streamingContentRef.current[messageId]) {
      delete streamingContentRef.current[messageId];
    }

    setSelectedChat((chat) => {
      if (!chat) return chat;

      setMessages((currentMessages) => {
        chatStorage.updateChat(chat.id, {
          messages: currentMessages,
        });
        return currentMessages;
      });

      return chat;
    });
  }, []);

  // Update a message and save to storage
  const updateMessage = useCallback(
    (index: number, updates: Partial<Message>) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };

        setSelectedChat((chat) => {
          if (!chat) return chat;

          chatStorage.updateChat(chat.id, {
            messages: updated,
          });

          return chat;
        });

        return updated;
      });
    },
    [],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (selectedChat) {
      chatStorage.updateChat(selectedChat.id, {
        messages: [],
      });
    }
  }, [selectedChat]);

  return {
    messages,
    selectedChat,
    addMessage,
    updateMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    setMessages,
    clearMessages,
    refreshSelectedChat,
  };
};
