import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createMistral } from "@ai-sdk/mistral";
import { createAzure } from "@ai-sdk/azure";
import { createOllama } from "ollama-ai-provider";
import { useSettingStore } from "@/store/setting";
import {
  GEMINI_BASE_URL,
  OPENROUTER_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  MISTRAL_BASE_URL,
  OLLAMA_BASE_URL,
  POLLINATIONS_BASE_URL,
} from "@/constants/urls";
import { multiApiKeyPolling } from "@/utils/model";
import { generateSignature } from "@/utils/signature";
import { completePath } from "@/utils/url";

function useModelProvider() {
  function createProvider(model: string, settings?: any) {
    const { mode, provider, accessPassword } = useSettingStore.getState();
    const accessKey = generateSignature(accessPassword, Date.now());

    switch (provider) {
      case "google":
        const { apiKey = "", apiProxy } = useSettingStore.getState();
        const key = multiApiKeyPolling(apiKey);
        const google = createGoogleGenerativeAI(
          mode === "local"
            ? {
                baseURL: completePath(apiProxy || GEMINI_BASE_URL, "/v1beta"),
                apiKey: key,
              }
            : {
                baseURL: "/api/ai/google/v1beta",
                apiKey: accessKey,
              }
        );
        return google(model, settings);
      case "openai":
        const { openAIApiKey = "", openAIApiProxy } =
          useSettingStore.getState();
        const openAIKey = multiApiKeyPolling(openAIApiKey);
        const openai = createOpenAI(
          mode === "local"
            ? {
                baseURL: completePath(openAIApiProxy || OPENAI_BASE_URL, "/v1"),
                apiKey: openAIKey,
              }
            : {
                baseURL: "/api/ai/openai/v1",
                apiKey: accessKey,
              }
        );
        return model.startsWith("gpt-4o")
          ? openai.responses(model)
          : openai(model, settings);
      case "anthropic":
        const { anthropicApiKey = "", anthropicApiProxy } =
          useSettingStore.getState();
        const anthropicKey = multiApiKeyPolling(anthropicApiKey);
        const anthropic = createAnthropic(
          mode === "local"
            ? {
                baseURL: completePath(
                  anthropicApiProxy || ANTHROPIC_BASE_URL,
                  "/v1"
                ),
                apiKey: anthropicKey,
                headers: {
                  // Avoid cors error
                  "anthropic-dangerous-direct-browser-access": "true",
                },
              }
            : {
                baseURL: "/api/ai/anthropic/v1",
                apiKey: accessKey,
              }
        );
        return anthropic(model, settings);
      case "deepseek":
        const { deepseekApiKey = "", deepseekApiProxy } =
          useSettingStore.getState();
        const deepseekKey = multiApiKeyPolling(deepseekApiKey);
        const deepseek = createDeepSeek(
          mode === "local"
            ? {
                baseURL: completePath(
                  deepseekApiProxy || DEEPSEEK_BASE_URL,
                  "/v1"
                ),
                apiKey: deepseekKey,
              }
            : {
                baseURL: "/api/ai/deepseek/v1",
                apiKey: accessKey,
              }
        );
        return deepseek(model, settings);
      case "xai":
        const { xAIApiKey = "", xAIApiProxy } = useSettingStore.getState();
        const xAIKey = multiApiKeyPolling(xAIApiKey);
        const xai = createXai(
          mode === "local"
            ? {
                baseURL: completePath(xAIApiProxy || XAI_BASE_URL, "/v1"),
                apiKey: xAIKey,
              }
            : {
                baseURL: "/api/ai/xai/v1",
                apiKey: accessKey,
              }
        );
        return xai(model, settings);
      case "mistral":
        const { mistralApiKey = "", mistralApiProxy } =
          useSettingStore.getState();
        const mistralKey = multiApiKeyPolling(mistralApiKey);
        const mistral = createMistral(
          mode === "local"
            ? {
                baseURL: completePath(
                  mistralApiProxy || MISTRAL_BASE_URL,
                  "/v1"
                ),
                apiKey: mistralKey,
              }
            : {
                baseURL: "/api/ai/mistral/v1",
                apiKey: accessKey,
              }
        );
        return mistral(model, settings);
      case "azure":
        const {
          azureApiKey = "",
          azureResourceName,
          azureApiVersion,
        } = useSettingStore.getState();
        const azureKey = multiApiKeyPolling(azureApiKey);
        const azure = createAzure(
          mode === "local"
            ? {
                baseURL: `https://${azureResourceName}.openai.azure.com/openai/deployments`,
                apiKey: azureKey,
                apiVersion: azureApiVersion,
              }
            : {
                baseURL: "/api/ai/azure",
                apiKey: accessKey,
                apiVersion: azureApiVersion,
              }
        );
        return azure(model, settings);
      case "openrouter":
        const { openRouterApiKey = "", openRouterApiProxy } =
          useSettingStore.getState();
        const openRouterKey = multiApiKeyPolling(openRouterApiKey);
        const openrouter = createOpenRouter(
          mode === "local"
            ? {
                baseURL: completePath(
                  openRouterApiProxy || OPENROUTER_BASE_URL,
                  "/api/v1"
                ),
                apiKey: openRouterKey,
              }
            : {
                baseURL: "/api/ai/openrouter/api/v1",
                apiKey: accessKey,
              }
        );
        return openrouter(model, settings);
      case "openaicompatible":
        const { openAICompatibleApiKey = "", openAICompatibleApiProxy } =
          useSettingStore.getState();
        const openAICompatibleKey = multiApiKeyPolling(openAICompatibleApiKey);
        const openaicompatible = createOpenAI(
          mode === "local"
            ? {
                baseURL: completePath(
                  openAICompatibleApiProxy || OPENAI_BASE_URL,
                  "/v1"
                ),
                apiKey: openAICompatibleKey,
                compatibility: "compatible",
              }
            : {
                baseURL: "/api/ai/openaicompatible/v1",
                apiKey: accessKey,
                compatibility: "compatible",
              }
        );
        return openaicompatible(model, settings);
      case "pollinations":
        const { pollinationsApiProxy } = useSettingStore.getState();
        const pollinations = createOpenAI(
          mode === "local"
            ? {
                baseURL: completePath(
                  pollinationsApiProxy || POLLINATIONS_BASE_URL,
                  "/v1"
                ),
                apiKey: "",
                compatibility: "compatible",
                fetch: async (input, init) => {
                  const headers = (init?.headers || {}) as Record<
                    string,
                    string
                  >;
                  delete headers["Authorization"];
                  return await fetch(input, {
                    ...init,
                    headers,
                    credentials: "omit",
                  });
                },
              }
            : {
                baseURL: "/api/ai/pollinations",
                apiKey: accessKey,
                compatibility: "compatible",
              }
        );
        return pollinations(model, settings);
      case "ollama":
        const { ollamaApiProxy } = useSettingStore.getState();
        const ollamaHeaders: Record<string, string> = {};
        if (mode === "proxy")
          ollamaHeaders["Authorization"] = `Bearer ${accessKey}`;
        const ollama = createOllama({
          baseURL:
            mode === "local"
              ? completePath(ollamaApiProxy || OLLAMA_BASE_URL, "/api")
              : "/api/ai/ollama/api",
          headers: ollamaHeaders,
          fetch: async (input, init) => {
            return await fetch(input, {
              ...init,
              credentials: "omit",
            });
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
      case "mistral":
        const { mistralThinkingModel, mistralNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: mistralThinkingModel,
          networkingModel: mistralNetworkingModel,
        };
      case "azure":
        const { azureThinkingModel, azureNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: azureThinkingModel,
          networkingModel: azureNetworkingModel,
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
      case "pollinations":
        const { pollinationsThinkingModel, pollinationsNetworkingModel } =
          useSettingStore.getState();
        return {
          thinkingModel: pollinationsThinkingModel,
          networkingModel: pollinationsNetworkingModel,
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

  function hasApiKey(): boolean {
    const { provider } = useSettingStore.getState();

    switch (provider) {
      case "google":
        const { apiKey } = useSettingStore.getState();
        return apiKey.length > 0;
      case "openai":
        const { openAIApiKey } = useSettingStore.getState();
        return openAIApiKey.length > 0;
      case "anthropic":
        const { anthropicApiKey } = useSettingStore.getState();
        return anthropicApiKey.length > 0;
      case "deepseek":
        const { deepseekApiKey } = useSettingStore.getState();
        return deepseekApiKey.length > 0;
      case "xai":
        const { xAIApiKey } = useSettingStore.getState();
        return xAIApiKey.length > 0;
      case "mistral":
        const { mistralApiKey } = useSettingStore.getState();
        return mistralApiKey.length > 0;
      case "azure":
        const { azureApiKey } = useSettingStore.getState();
        return azureApiKey.length > 0;
      case "openrouter":
        const { openRouterApiKey } = useSettingStore.getState();
        return openRouterApiKey.length > 0;
      case "openaicompatible":
        const { openAICompatibleApiKey } = useSettingStore.getState();
        return openAICompatibleApiKey.length > 0;
      case "pollinations":
      case "ollama":
        return true;
      default:
        throw new Error("Unsupported Provider: " + provider);
    }
  }

  return {
    createProvider,
    getModel,
    hasApiKey,
  };
}

export default useModelProvider;
