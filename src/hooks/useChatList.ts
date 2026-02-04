import { useState, useEffect, useCallback } from "react";
import type { ChatInfo } from "../types/chat";
import { chatStorage } from "../utils/chatStorage";
import { chatEvents } from "../utils/chatEvents";

interface UseChatListProps {
  onSelect?: () => void;
}

export const useChatsList = ({ onSelect }: UseChatListProps = {}) => {
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [selectedChatIndex, setSelectedChatIndex] = useState<number | null>(
    null,
  );

  // Load chats from localStorage
  const loadChats = useCallback(() => {
    const loadedChats = chatStorage.getChats();
    setChats(loadedChats);

    const savedIndex = chatStorage.getSelectedChatIndex();
    if (savedIndex !== null && savedIndex < loadedChats.length) {
      setSelectedChatIndex(savedIndex);
    } else {
      setSelectedChatIndex(null);
    }
  }, []);

  // Load on mount and subscribe to changes
  useEffect(() => {
    loadChats();

    // Subscribe to chat events
    const unsubscribe = chatEvents.subscribe(() => {
      loadChats();
    });

    return unsubscribe;
  }, [loadChats]);

  // Handle chat selection
  const handleChatSelect = useCallback(
    (index: number) => () => {
      setSelectedChatIndex(index);
      chatStorage.setSelectedChatIndex(index);
      onSelect?.();
    },
    [onSelect],
  );

  // Refresh chats from storage
  const refreshChats = useCallback(() => {
    loadChats();
  }, [loadChats]);

  return {
    chats,
    selectedChatIndex,
    handleChatSelect,
    refreshChats,
  };
};
