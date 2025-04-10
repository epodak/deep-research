import { useState } from "react";
import { useSettingStore } from "@/store/setting";
import {
  GEMINI_BASE_URL,
  OPENROUTER_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
} from "@/constants/urls";
import { shuffle } from "radash";

interface GeminiModel {
  name: string;
  description: string;
  displayName: string;
  inputTokenLimit: number;
  maxTemperature?: number;
  outputTokenLimit: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  supportedGenerationMethods: string[];
  version: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
    is_moderated: boolean;
  };
  pricing: {
    prompt: string;
    completion: string;
    image: string;
    request: string;
    input_cache_read: string;
    input_cache_write: string;
    web_search: string;
    internal_reasoning: string;
  };
  per_request_limits: Record<string, string> | null;
}

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface AnthropicModel {
  id: string;
  display_name: string;
  type: string;
  created_at: string;
}

function useModelList() {
  const [modelList, setModelList] = useState<string[]>([]);
  const { mode } = useSettingStore.getState();

  async function refresh(provider: string): Promise<string[]> {
    if (provider === "google") {
      const {
        apiKey = "",
        apiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !apiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(apiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${apiProxy || GEMINI_BASE_URL}${
              apiProxy.endsWith("/v1beta") ? "" : "/v1beta"
            }/models`
          : "/api/ai/google/v1beta/models",
        {
          headers: {
            "x-goog-api-key": mode === "local" ? apiKeys[0] : accessPassword,
          },
        }
      );
      const { models = [] } = await response.json();
      const newModelList = (models as GeminiModel[])
        .filter(
          (item) =>
            item.name.startsWith("models/gemini") &&
            item.supportedGenerationMethods.includes("generateContent")
        )
        .map((item) => item.name.replace("models/", ""));
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "openrouter") {
      const {
        openRouterApiKey = "",
        openRouterApiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !openRouterApiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(openRouterApiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${openRouterApiProxy || `${OPENROUTER_BASE_URL}/api`}${
              openRouterApiProxy.endsWith("/v1") ? "" : "/v1"
            }/models`
          : "/api/ai/openrouter/v1/models",
        {
          headers: {
            authorization: `Bearer ${
              mode === "local" ? apiKeys[0] : accessPassword
            }`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenRouterModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "openai") {
      const {
        openAIApiKey = "",
        openAIApiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !openAIApiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(openAIApiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${openAIApiProxy || OPENAI_BASE_URL}${
              openAIApiProxy.endsWith("/v1") ? "" : "/v1"
            }/models`
          : "/api/ai/openai/v1/models",
        {
          headers: {
            authorization: `Bearer ${
              mode === "local" ? apiKeys[0] : accessPassword
            }`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[])
        .map((item) => item.id)
        .filter(
          (id) =>
            !(
              id.startsWith("text") ||
              id.startsWith("tts") ||
              id.startsWith("whisper") ||
              id.startsWith("dall-e")
            )
        );
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "anthropic") {
      const {
        anthropicApiKey = "",
        anthropicApiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !anthropicApiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(anthropicApiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${anthropicApiProxy || ANTHROPIC_BASE_URL}${
              anthropicApiProxy.endsWith("/v1") ? "" : "/v1"
            }/models`
          : "/api/ai/anthropic/v1/models",
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": mode === "local" ? apiKeys[0] : accessPassword,
            "Anthropic-Version": "2023-06-01",
            // Avoid cors error
            "anthropic-dangerous-direct-browser-access": "true",
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as AnthropicModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "deepseek") {
      const {
        deepseekApiKey = "",
        deepseekApiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !deepseekApiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(deepseekApiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${deepseekApiProxy || DEEPSEEK_BASE_URL}${
              deepseekApiProxy.endsWith("/v1") ? "" : "/v1"
            }/models`
          : "/api/ai/deepseek/v1/models",
        {
          headers: {
            authorization: `Bearer ${
              mode === "local" ? apiKeys[0] : accessPassword
            }`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else if (provider === "xai") {
      const {
        xAIApiKey = "",
        xAIApiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !xAIApiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(xAIApiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${xAIApiProxy || XAI_BASE_URL}${
              xAIApiProxy.endsWith("/v1") ? "" : "/v1"
            }/models`
          : "/api/ai/xai/v1/models",
        {
          headers: {
            authorization: `Bearer ${
              mode === "local" ? apiKeys[0] : accessPassword
            }`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[])
        .map((item) => item.id)
        .filter((id) => !id.includes("image"));
      setModelList(newModelList);
      return newModelList;
    }
    if (provider === "openaicompatible") {
      const {
        openAICompatibleApiKey = "",
        openAICompatibleApiProxy,
        accessPassword,
      } = useSettingStore.getState();
      if (
        (mode === "local" && !openAICompatibleApiKey) ||
        (mode === "proxy" && !accessPassword)
      ) {
        return [];
      }
      const apiKeys = shuffle(openAICompatibleApiKey.split(","));
      const response = await fetch(
        mode === "local"
          ? `${openAICompatibleApiProxy || OPENAI_BASE_URL}${
              openAICompatibleApiProxy.endsWith("/v1") ? "" : "/v1"
            }/models`
          : "/api/ai/openaicompatible/v1/models",
        {
          headers: {
            authorization: `Bearer ${
              mode === "local" ? apiKeys[0] : accessPassword
            }`,
          },
        }
      );
      const { data = [] } = await response.json();
      const newModelList = (data as OpenAIModel[]).map((item) => item.id);
      setModelList(newModelList);
      return newModelList;
    } else {
      return [];
    }
  }
  return {
    modelList,
    refresh,
  };
}

export default useModelList;
