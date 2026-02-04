// chatStorage.ts
import type { ChatInfo } from "../types/chat";
import { chatEvents } from "./chatEvents";

const STORAGE_KEY = "localhostgpt_chats";
const SELECTED_CHAT_KEY = "localhostgpt_selected_chat";

export const chatStorage = {
  // Get all chats
  getChats(): ChatInfo[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Save all chats
  saveChats(chats: ChatInfo[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  },

  // Get a specific chat by ID
  getChat(id: string): ChatInfo | undefined {
    const chats = this.getChats();
    return chats.find((chat) => chat.id === id);
  },

  // Create a new chat
  createChat(chat: Omit<ChatInfo, "id" | "lastEditTime">): ChatInfo {
    const chats = this.getChats();
    const newChat: ChatInfo = {
      ...chat,
      id: crypto.randomUUID(),
      lastEditTime: Date.now(),
    };
    chats.unshift(newChat); // Add to beginning
    this.saveChats(chats);

    // Auto-select the new chat
    this.setSelectedChatIndex(0);

    return newChat;
  },

  // Update an existing chat
  updateChat(id: string, updates: Partial<ChatInfo>): void {
    const chats = this.getChats();
    const index = chats.findIndex((chat) => chat.id === id);
    if (index !== -1) {
      chats[index] = {
        ...chats[index],
        ...updates,
        lastEditTime: Date.now(),
      };
      this.saveChats(chats);
      chatEvents.emit(id); // Emit event when chat is updated
    }
  },

  // Delete a chat
  deleteChat(id: string): void {
    const chats = this.getChats();
    const filtered = chats.filter((chat) => chat.id !== id);
    this.saveChats(filtered);
    chatEvents.emit(id); // Emit event when chat is deleted
  },

  // Get selected chat index
  getSelectedChatIndex(): number | null {
    const index = localStorage.getItem(SELECTED_CHAT_KEY);
    return index ? parseInt(index, 10) : null;
  },

  // Set selected chat index
  setSelectedChatIndex(index: number): void {
    localStorage.setItem(SELECTED_CHAT_KEY, index.toString());
    chatEvents.emit(); // Emit event when selection changes
  },

  // Clear selected chat
  clearSelectedChat(): void {
    localStorage.removeItem(SELECTED_CHAT_KEY);
    chatEvents.emit(); // Emit event when selection is cleared
  },
};
