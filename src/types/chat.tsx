export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  isTensorlinkConnected: boolean;
  isModelInitialized: boolean;
}

export interface Model {
  id: string;
  name: string;
  requires_tensorlink: boolean;
}

export interface FineTuningJob {
  model: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  created_at: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  feedback?: "positive" | "negative" | null;
}

export interface ChatInfo {
  id: string;
  title: string;
  content: string;
  lastEditTime: number;
  messages: Message[];
}

export type AppView = "chat" | "settings" | "fine-tuning";
