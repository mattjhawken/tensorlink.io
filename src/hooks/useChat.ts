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
    onRemoveMessages: (ids: string[]) => void,
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

    // Add user message immediately so the user sees it
    onMessageAdd(userMessage);
    setIsLoading(true);

    // Build the messages array for the API call
    const apiMessages = [...messages, userMessage];

    // Create assistant placeholder id now but don't add it yet
    const assistantMessageId = crypto.randomUUID();

    try {
      // Add empty assistant message placeholder now that we're about to stream
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      onMessageAdd(assistantMessage);
      setStreamingMessageId(assistantMessageId);

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

      if (onStreamFinalize) {
        onStreamFinalize(assistantMessageId);
      }

      return { success: true };
    } catch (error) {
      console.error("🔴 API Error:", error);
      setStreamingMessageId(null);

      // Remove the ghost user message and empty assistant placeholder
      onRemoveMessages([userMessage.id, assistantMessageId]);

      // Extract the API error detail if available
      let errorMessage = "Failed to send message. Please try again.";
      if (error instanceof Error) {
        // Try to parse detail out of "API error: 503 - {"detail":"..."}"
        const match = error.message.match(/- ({.*})/s);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            if (typeof parsed.detail === "string") {
              errorMessage = parsed.detail;
            }
          } catch {
            // fall through to default
          }
        }
      }

      return { success: false, error, errorMessage, restoredInput: messageContent };
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
