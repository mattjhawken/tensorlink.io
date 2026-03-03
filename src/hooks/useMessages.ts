import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, ChatInfo } from "../types/chat";
import { chatStorage } from "../utils/chatStorage";
import { chatEvents } from "../utils/chatEvents";

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatInfo | null>(null);

  // Ref mirrors selectedChat state so callbacks can read the current value
  // without nesting setState calls inside other setState updaters.
  const selectedChatRef = useRef<ChatInfo | null>(null);
  const streamingContentRef = useRef<{ [key: string]: string }>({});

  const setSelectedChatAndRef = useCallback((chat: ChatInfo | null) => {
    selectedChatRef.current = chat;
    setSelectedChat(chat);
  }, []);

  // Load messages when selected chat changes
  const loadSelectedChat = useCallback(() => {
    const selectedIndex = chatStorage.getSelectedChatIndex();

    if (selectedIndex !== null) {
      const chats = chatStorage.getChats();
      const chat = chats[selectedIndex];

      if (!chat) return;

      if (selectedChatRef.current?.id !== chat.id) {
        setSelectedChatAndRef(chat);
        setMessages(chat.messages || []);
      }
    } else {
      setSelectedChatAndRef(null);
      setMessages([]);
    }
  }, [setSelectedChatAndRef]);

  // Load on mount and subscribe to changes
  useEffect(() => {
    loadSelectedChat();
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
        setSelectedChatAndRef(chat);
        setMessages(chat.messages || []);
      }
    }
  }, [setSelectedChatAndRef]);

  // Add a message and save to storage
  const addMessage = useCallback((message: Message) => {
    let updatedMessages: Message[] = [];

    setMessages((prev) => {
      updatedMessages = [...prev, message];
      return updatedMessages;
    });

    // Runs after setState is queued, not inside it
    const chat = selectedChatRef.current;
    if (chat) {
      chatStorage.updateChat(chat.id, {
        messages: updatedMessages,
        ...(chat.title === "New Chat" &&
          message.role === "user" &&
          updatedMessages.length === 1 && {
            title: message.content.slice(0, 50) + (message.content.length > 50 ? "..." : ""),
          }),
      });
    }
  }, []);

  // Update streaming content for a specific message
  const updateStreamingMessage = useCallback(
    (messageId: string, chunk: string) => {
      if (!streamingContentRef.current[messageId]) {
        streamingContentRef.current[messageId] = "";
      }
      streamingContentRef.current[messageId] += chunk;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: streamingContentRef.current[messageId] }
            : msg,
        ),
      );
    },
    [],
  );

  // Save streaming updates to storage after stream completes
  const finalizeStreamingMessage = useCallback((messageId?: string) => {
    if (messageId && streamingContentRef.current[messageId]) {
      delete streamingContentRef.current[messageId];
    }

    const chat = selectedChatRef.current;
    if (!chat) return;

    // Capture messages first, then call storage outside the updater
    setMessages((currentMessages) => {
      // Schedule storage update after this render cycle
      setTimeout(() => {
        chatStorage.updateChat(chat.id, { messages: currentMessages });
      }, 0);
      return currentMessages;
    });
  }, []);

  // Update a message and save to storage
  const updateMessage = useCallback(
    (index: number, updates: Partial<Message>) => {
      let updatedMessages: Message[] = [];

      setMessages((prev) => {
        updatedMessages = [...prev];
        updatedMessages[index] = { ...updatedMessages[index], ...updates };
        return updatedMessages;
      });

      const chat = selectedChatRef.current;
      if (chat) {
        chatStorage.updateChat(chat.id, { messages: updatedMessages });
      }
    },
    [],
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    const chat = selectedChatRef.current;
    if (chat) {
      chatStorage.updateChat(chat.id, { messages: [] });
    }
  }, []);

  const removeMessages = useCallback((ids: string[]) => {
    let updatedMessages: Message[] = [];

    setMessages((prev) => {
      updatedMessages = prev.filter((msg) => !ids.includes(msg.id));
      return updatedMessages;
    });

    const chat = selectedChatRef.current;
    if (chat) {
      chatStorage.updateChat(chat.id, { messages: updatedMessages });
    }
  }, []);

  return {
    messages,
    selectedChat,
    addMessage,
    removeMessages,
    updateMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    setMessages,
    clearMessages,
    refreshSelectedChat,
  };
};
