import type {
  ChatSettings,
  FineTuningJob,
  Message,
  Model,
} from "../types/chat";
import type { TensorlinkStats } from "../types/tensorlink";

const API_URL = "https://smartnodes.ddns.net/tensorlink-api";
// const API_URL = "http://192.168.2.54:64747";

export class ApiService {
  static async fetchModels(): Promise<Model[]> {
    try {
      const response = await fetch(`${API_URL}/models`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching models:", error);
      return [
        {
          id: "Qwen/Qwen2.5-7B-Instruct",
          name: "Qwen2.5-7B",
          requires_tensorlink: true,
        },
      ];
    }
  }

  static async getTensorlinkStats(): Promise<TensorlinkStats> {
    try {
      const response = await fetch(`${API_URL}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Tensorlink stats: ${response.status}`);
      }
      const data: TensorlinkStats = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching Tensorlink stats:", error);
      throw error;
    }
  }

  static async getNetworkHistory(days: number = 90): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/network-history?days=${days}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch network history: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching network history:", error);
      throw error;
    }
  }

  static async getModelDemand(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/model-demand`);
      if (!response.ok) {
        throw new Error(`Failed to fetch model demand: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching model demand:", error);
      throw error;
    }
  }

  static async checkConnectionStatus(): Promise<{ connected: boolean }> {
    try {
      const response = await fetch(`${API_URL}/status`);
      if (!response.ok) {
        throw new Error(
          `Failed to check Tensorlink status: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error checking Tensorlink status:", error);
      throw error;
    }
  }

  static async connectToTensorlink(): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/connect`);
      if (!response.ok) {
        throw new Error(`Failed to connect to Tensorlink: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error connecting to Tensorlink:", error);
      throw error;
    }
  }

  static async sendChatMessage(
    messages: Message[],
    settings: ChatSettings,
    onStreamChunk?: (chunk: string) => void,
  ): Promise<{ content: string }> {
    try {
      const payloadMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const useStream = !!onStreamChunk;

      const response = await fetch(`${API_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: settings.model,
          messages: payloadMessages,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          top_p: settings.topP,
          stream: true,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      // Handle streaming response
      if (useStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let buffer = "";
        let fullContent = "";
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                done = true;
                break;
              }

              try {
                const json = JSON.parse(data);
                const token = json.choices?.[0]?.delta?.content;

                if (token) {
                  fullContent += token;
                  onStreamChunk(token);
                }
              } catch (err) {
                console.warn("Stream parse error:", err);
              }
            }
          }
        }

        return { content: fullContent };
      }

      // Handle non-streaming response
      const data = await response.json();
      const content =
        data?.choices?.[0]?.message?.content ?? data?.response ?? "";

      return { content };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  static async initiateFinetuning(
    model: string,
    messages: Message[],
  ): Promise<{ message?: string; job_id?: string }> {
    try {
      const response = await fetch(`${API_URL}/finetune`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          chatHistory: messages.filter((m) => m.role !== "system"),
          feedbackData: messages
            .filter((m) => m.role === "assistant" && m.feedback)
            .map((m, index) => ({ messageId: index, feedback: m.feedback })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate fine-tuning: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error initiating fine-tuning:", error);
      throw error;
    }
  }

  static async getFineTuningStatus(
    jobId: string,
  ): Promise<{ success: boolean; job?: FineTuningJob }> {
    try {
      const response = await fetch(`${API_URL}/finetune/${jobId}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch fine-tuning status: ${response.status}`,
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error polling fine-tuning status:", error);
      throw error;
    }
  }
}
