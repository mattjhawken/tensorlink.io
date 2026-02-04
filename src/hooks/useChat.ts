import { useState } from "react";
import { ApiService } from "../services";
import type { ChatSettings, Message } from "../types/chat";

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );

  const sendMessage = async (
    messageContent: string,
    messages: Message[],
    settings: ChatSettings,
    onMessageAdd: (message: Message) => void,
    onStreamUpdate?: (messageId: string, content: string) => void,
    onStreamFinalize?: (messageId: string) => void,
  ) => {
    if (!messageContent.trim() || isSending) return;

    setIsSending(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageContent,
      timestamp: Date.now(),
    };

    // Add user message immediately
    onMessageAdd(userMessage);
    setIsLoading(true);

    try {
      // Build the messages array for the API call
      // Include previous messages + the new user message
      const apiMessages = [...messages, userMessage];

      // Create assistant message placeholder for streaming
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      // Add empty assistant message
      onMessageAdd(assistantMessage);
      setStreamingMessageId(assistantMessageId);

      // Stream handler
      const handleStreamChunk = (chunk: string) => {
        if (onStreamUpdate) {
          onStreamUpdate(assistantMessageId, chunk);
        }
      };

      await ApiService.sendChatMessage(
        apiMessages,
        settings,
        handleStreamChunk,
      );

      setStreamingMessageId(null);

      // Finalize and save to storage
      if (onStreamFinalize) {
        onStreamFinalize(assistantMessageId);
      }

      return { success: true };
    } catch (error) {
      console.error("🔴 API Error:", error);
      setStreamingMessageId(null);

      // Return error without adding message - let the caller handle it
      return { success: false, error };
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  };

  return {
    isLoading,
    isSending,
    streamingMessageId,
    sendMessage,
  };
};
