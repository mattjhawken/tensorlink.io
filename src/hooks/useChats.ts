import { useCallback } from "react";
import type { ChatInfo } from "../types/chat";
import { chatStorage } from "../utils/chatStorage";

export const useChats = () => {
  const createEmptyChat = useCallback(() => {
    const newChat = chatStorage.createChat({
      title: "New Chat",
      content: "",
      messages: [],
    });
    return newChat;
  }, []);

  const deleteChat = useCallback((chatId?: string) => {
    // If no chatId provided, delete the currently selected chat
    if (!chatId) {
      const selectedIndex = chatStorage.getSelectedChatIndex();
      if (selectedIndex !== null) {
        const chats = chatStorage.getChats();
        const selectedChat = chats[selectedIndex];
        if (selectedChat) {
          chatStorage.deleteChat(selectedChat.id);
          chatStorage.clearSelectedChat();
        }
      }
    } else {
      chatStorage.deleteChat(chatId);
    }
  }, []);

  const updateChat = useCallback(
    (chatId: string, updates: Partial<ChatInfo>) => {
      chatStorage.updateChat(chatId, updates);
    },
    [],
  );

  const getSelectedChat = useCallback((): ChatInfo | null => {
    const selectedIndex = chatStorage.getSelectedChatIndex();
    if (selectedIndex !== null) {
      const chats = chatStorage.getChats();
      return chats[selectedIndex] || null;
    }
    return null;
  }, []);

  return {
    createEmptyChat,
    deleteChat,
    updateChat,
    getSelectedChat,
  };
};
