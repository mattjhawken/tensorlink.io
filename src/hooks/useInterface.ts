import type { MDXEditorMethods } from "@mdxeditor/editor";
import { chatStorage } from "../utils/chatStorage";
import { autoSavingTime } from "../constants";
import type { ChatInfo } from "../types/chat";
import { throttle } from "lodash";
import { useRef, useState, useEffect } from "react";

export const useMarkdownEditor = (chatId?: string) => {
  const editorRef = useRef<MDXEditorMethods>(null);
  const [selectedChat, setSelectedChat] = useState<ChatInfo | undefined>(() =>
    chatId ? chatStorage.getChat(chatId) : undefined,
  );

  useEffect(() => {
    if (chatId) {
      setSelectedChat(chatStorage.getChat(chatId));
    }
  }, [chatId]);

  const handleAutoSaving = throttle(
    async (content: string) => {
      if (!selectedChat) return;

      console.info("Auto saving:", selectedChat.title);

      await chatStorage.updateChat(selectedChat.id, {
        content,
      });
    },
    autoSavingTime,
    {
      leading: false,
      trailing: true,
    },
  );

  const handleBlur = async () => {
    if (!selectedChat) return;

    handleAutoSaving.cancel();

    const content = editorRef.current?.getMarkdown();

    if (content != null) {
      await chatStorage.updateChat(selectedChat.id, {
        content,
      });
    }
  };

  return {
    editorRef,
    selectedChat,
    handleAutoSaving,
    handleBlur,
  };
};
