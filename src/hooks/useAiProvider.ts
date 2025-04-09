import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createOllama } from "ollama-ai-provider";
import { useSettingStore } from "@/store/setting";
import {
  GEMINI_BASE_URL,
  OPENROUTER_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  OLLAMA_BASE_URL,
} from "@/constants/urls";
import { shuffle } from "radash";

function useModelProvider() {
  function createProvider(model: string, settings?: any) {
    const { mode, provider, accessPassword } = useSettingStore.getState();

    switch (provider) {
      case "google":
        const { apiKey = "", apiProxy } = useSettingStore.getState();
        const apiKeys = shuffle(apiKey.split(","));
        const google = createGoogleGenerativeAI(
          mode === "local"
            ? {
                baseURL: `${apiProxy || GEMINI_BASE_URL}${
                  apiProxy.includes("/v1") ? "" : "/v1beta"
                }`,
                apiKey: apiKeys[0],
              }
            : {
                baseURL: "/api/ai/google/v1beta",
                apiKey: accessPassword,
              }
        );
        return google(model, settings);
      case "openai":
        const { openAIApiKey = "", openAIApiProxy } =
          useSettingStore.getState();
        const openAIApiKeys = shuffle(openAIApiKey.split(","));
        const openai = createOpenAI(
          mode === "local"
            ? {
                baseURL: `${openAIApiProxy || OPENAI_BASE_URL}${
                  openAIApiProxy.includes("/v1") ? "" : "/v1"
                }`,
                apiKey: openAIApiKeys[0],
              }
            : {
                baseURL: "/api/ai/openai/v1",
                apiKey: accessPassword,
              }
        );
        return model.startsWith("gpt-4o")
          ? openai.responses(model)
          : openai(model, settings);
      case "anthropic":
        const { anthropicApiKey = "", anthropicApiProxy } =
          useSettingStore.getState();
        const anthropicApiKeys = shuffle(anthropicApiKey.split(","));
        const anthropic = createAnthropic(
          mode === "local"
            ? {
                baseURL: `${anthropicApiProxy || ANTHROPIC_BASE_URL}${
                  anthropicApiProxy.includes("/v1") ? "" : "/v1"
                }`,
                apiKey: anthropicApiKeys[0],
              }
            : {
                baseURL: "/api/ai/anthropic/v1",
                apiKey: accessPassword,
              }
        );
        return anthropic(model, settings);
      case "deepseek":
        const { deepseekApiKey = "", deepseekApiProxy } =
          useSettingStore.getState();
        const deepseekApiKeys = shuffle(deepseekApiKey.split(","));
        const deepseek = createDeepSeek(
          mode === "local"
            ? {
                baseURL: `${deepseekApiProxy || DEEPSEEK_BASE_URL}${
                  deepseekApiProxy.includes("/v1") ? "" : "/v1"
                }`,
                apiKey: deepseekApiKeys[0],
              }
            : {
                baseURL: "/api/ai/deepseek/v1",
                apiKey: accessPassword,
              }
        );
        return deepseek(model, settings);
      case "xai":
        const { xAIApiKey = "", xAIApiProxy } = useSettingStore.getState();
        const xAIApiKeys = shuffle(xAIApiKey.split(","));
        const xai = createXai(
          mode === "local"
            ? {
                baseURL: `${xAIApiProxy || XAI_BASE_URL}${
                  xAIApiProxy.includes("/v1") ? "" : "/v1"
                }`,
                apiKey: xAIApiKeys[0],
              }
            : {
                baseURL: "/api/ai/xai/v1",
                apiKey: accessPassword,
              }
        );
        return xai(model, settings);
      case "openrouter":
        const { openRouterApiKey = "", openRouterApiProxy } =
          useSettingStore.getState();
        const openRouterApiKeys = shuffle(openRouterApiKey.split(","));
        const openrouter = createOpenRouter(
          mode === "local"
            ? {
                baseURL: `${
                  openRouterApiProxy || `${OPENROUTER_BASE_URL}/api`
                }${openRouterApiProxy.includes("/v1") ? "" : "/v1"}`,
                apiKey: openRouterApiKeys[0],
              }
            : {
                baseURL: "/api/ai/openrouter/v1",
                apiKey: accessPassword,
              }
        );
        return openrouter(model, settings);
      case "openaicompatible":
        const { openAICompatibleApiKey = "", openAICompatibleApiProxy } =
          useSettingStore.getState();
        const openAICompatibleApiKeys = shuffle(
          openAICompatibleApiKey.split(",")
        );
        const openaicompatible = createOpenAI(
          mode === "local"
            ? {
                baseURL: `${openAICompatibleApiProxy || OPENAI_BASE_URL}${
                  openAICompatibleApiProxy.includes("/v1") ? "" : "/v1"
                }`,
                apiKey: openAICompatibleApiKeys[0],
              }
            : { baseURL: "/api/ai/openaicompatible/v1", apiKey: accessPassword }
        );
        return openaicompatible(model, settings);
      case "ollama":
        const { ollamaApiProxy } = useSettingStore.getState();
        const ollama = createOllama({
          baseURL: accessPassword
            ? "/api/ai/ollama"
            : `${ollamaApiProxy || `${OLLAMA_BASE_URL}/api`}`,
          headers: {
            Authorization: accessPassword,
          },
        });
        return ollama(model, settings);
      default:
        throw new Error("Unsupported Provider: " + provider);
    }
  }

  function getModel() {
    const { provider } = useSettingStore.getState();

    switch (provider) {
      case "google":
        const { thinkingModel, networkingModel } = useSettingStore.getState();
        return { thinkingModel, networkingModel };
      case "openai":
        const { openAIThinkingModel, openAINetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: openAIThinkingModel,
          networkingModel: openAINetworkingModel,
        };
      case "anthropic":
        const { anthropicThinkingModel, anthropicNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: anthropicThinkingModel,
          networkingModel: anthropicNetworkingModel,
        };
      case "deepseek":
        const { deepseekThinkingModel, deepseekNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: deepseekThinkingModel,
          networkingModel: deepseekNetworkingModel,
        };
      case "xai":
        const { xAIThinkingModel, xAINetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: xAIThinkingModel,
          networkingModel: xAINetworkingModel,
        };
      case "openrouter":
        const { openRouterThinkingModel, openRouterNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: openRouterThinkingModel,
          networkingModel: openRouterNetworkingModel,
        };
      case "openaicompatible":
        const {
          openAICompatibleThinkingModel,
          openAICompatibleNetworkingModel,
        } = useSettingStore.getState();
        return {
          thinkingModel: openAICompatibleThinkingModel,
          networkingModel: openAICompatibleNetworkingModel,
        };
      case "ollama":
        const { ollamaThinkingModel, ollamaNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: ollamaThinkingModel,
          networkingModel: ollamaNetworkingModel,
        };
      default:
        throw new Error("Unsupported Provider: " + provider);
    }
  }

  return {
    createProvider,
    getModel,
  };
}

export default useModelProvider;
