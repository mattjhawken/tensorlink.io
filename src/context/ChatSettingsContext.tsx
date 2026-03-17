import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiService } from "../services";
import type { ChatSettings, Model } from "../types/chat";
import type { TensorlinkStats } from "../types/tensorlink";

const SETTINGS_STORAGE_KEY = "chat_settings";

const DEFAULT_SETTINGS: ChatSettings = {
  model: "Qwen/Qwen2.5-7B-Instruct",
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  isTensorlinkConnected: false,
  isModelInitialized: false,
};

const DEFAULT_STATS: TensorlinkStats = {
  validators: 0,
  workers: 0,
  users: 0,
  proposal: 0,
  available_capacity: 0,
  used_capacity: 0,
  models: [],
};

// Load persisted settings from localStorage, merging with defaults
const loadPersistedSettings = (): ChatSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        // Never persist connection state
        isTensorlinkConnected: false,
        isModelInitialized: false,
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
};

// Persist only user-facing settings (not transient connection state)
const persistSettings = (settings: ChatSettings) => {
  const { isTensorlinkConnected, isModelInitialized, ...persistable } = settings;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(persistable));
};

interface ChatSettingsContextValue {
  availableModels: Model[];
  chatSettings: ChatSettings;
  setChatSettings: (settings: ChatSettings) => void;
  isConnectingTensorlink: boolean;
  setIsConnectingTensorlink: (v: boolean) => void;
  tensorlinkStats: TensorlinkStats;
  checkConnectionStatus: () => Promise<void>;
  connectToTensorlink: () => Promise<{ success: boolean; message: string }>;
  getTensorlinkStats: () => Promise<void>;
  requestModel: (hfName: string, requestModel: number) => Promise<{ success: boolean; message: string }>;
  refreshModels: () => Promise<void>;
  isRefreshingModels: boolean;
}

const ChatSettingsContext = createContext<ChatSettingsContextValue | null>(null);

export const ChatSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const [chatSettings, setChatSettingsState] = useState<ChatSettings>(loadPersistedSettings);
  const [isConnectingTensorlink, setIsConnectingTensorlink] = useState(false);
  const [tensorlinkStats, setTensorlinkStats] = useState<TensorlinkStats>(DEFAULT_STATS);

  // Wrap setter so every change is automatically persisted
  const setChatSettings = (settings: ChatSettings) => {
    setChatSettingsState(settings);
    persistSettings(settings);
  };

  useEffect(() => {
    const initializeSettings = async () => {
      await Promise.allSettled([
        refreshModels(),
        checkConnectionStatus(),
      ]);
    };

    initializeSettings();
  }, []);

  const refreshModels = async () => {
    try {
      setIsRefreshingModels(true);
      const models = await ApiService.fetchModels();
      setAvailableModels(models);
    } catch (err) {
      console.error("Failed to refresh models:", err);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  // Auto-select first model if saved model no longer exists
  useEffect(() => {
    if (availableModels.length > 0) {
      const modelExists = availableModels.some((m) => m.id === chatSettings.model);
      if (!modelExists) {
        setChatSettings({ ...chatSettings, model: availableModels[0].id });
      }
    }
  }, [availableModels]);

  const checkConnectionStatus = async () => {
    try {
      const status = await ApiService.checkConnectionStatus();
      setChatSettingsState((prev) => {
        const updated = { ...prev, isTensorlinkConnected: status.connected };
        // Don't persist connection status
        return updated;
      });
    } catch {
      console.error("Failed to check Tensorlink status");
    }
  };

  const getTensorlinkStats = async () => {
    try {
      const stats = await ApiService.getTensorlinkStats();
      setTensorlinkStats(stats);
    } catch {
      console.error("Failed to fetch Tensorlink stats");
      setTensorlinkStats(DEFAULT_STATS);
    }
  };

  const connectToTensorlink = async () => {
    try {
      setIsConnectingTensorlink(true);
      await ApiService.connectToTensorlink();

      setChatSettingsState((prev) => ({ ...prev, isTensorlinkConnected: true }));

      const models = await ApiService.fetchModels();
      setAvailableModels(models);

      return { success: true, message: "Connected to Tensorlink successfully" };
    } catch {
      return { success: false, message: "Failed to connect to Tensorlink" };
    } finally {
      setIsConnectingTensorlink(false);
    }
  };

  const requestModel = async (hfName: string, requestMinutes: number) => {
    return await ApiService.requestModel(hfName, requestMinutes);
  };

  return (
    <ChatSettingsContext.Provider
      value={{
        availableModels,
        chatSettings,
        setChatSettings,
        isConnectingTensorlink,
        setIsConnectingTensorlink,
        tensorlinkStats,
        checkConnectionStatus,
        connectToTensorlink,
        getTensorlinkStats,
        requestModel,
        refreshModels,
        isRefreshingModels
      }}
    >
      {children}
    </ChatSettingsContext.Provider>
  );
};

// Drop-in replacement for useChatSettings — same API, now shared + persisted
export const useChatSettings = (): ChatSettingsContextValue => {
  const ctx = useContext(ChatSettingsContext);
  if (!ctx) {
    throw new Error("useChatSettings must be used within a ChatSettingsProvider");
  }
  return ctx;
};
