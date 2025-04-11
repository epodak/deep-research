"use client";
import { useLayoutEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Password } from "@/components/Internal/PasswordInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import useModel from "@/hooks/useModelList";
import { useSettingStore } from "@/store/setting";
import {
  GEMINI_BASE_URL,
  OPENROUTER_BASE_URL,
  OPENAI_BASE_URL,
  ANTHROPIC_BASE_URL,
  DEEPSEEK_BASE_URL,
  XAI_BASE_URL,
  OLLAMA_BASE_URL,
  TAVILY_BASE_URL,
  FIRECRAWL_BASE_URL,
  EXA_BASE_URL,
  BOCHA_BASE_URL,
  SEARXNG_BASE_URL,
} from "@/constants/urls";
import {
  filterThinkingModelList,
  filterNetworkingModelList,
  filterOpenRouterModelList,
  filterDeepSeekModelList,
  filterOpenAIModelList,
  getCustomModelList,
} from "@/utils/models";
import { researchStore } from "@/utils/storage";
import { cn } from "@/utils/style";
import { omit, capitalize } from "radash";

type SettingProps = {
  open: boolean;
  onClose: () => void;
};

const BUILD_MODE = process.env.NEXT_PUBLIC_BUILD_MODE;
const VERSION = process.env.NEXT_PUBLIC_VERSION;
const DISABLED_AI_PROVIDER = process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER || "";
const DISABLED_SEARCH_PROVIDER =
  process.env.NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER || "";
const MODEL_LIST = process.env.NEXT_PUBLIC_MODEL_LIST || "";

const formSchema = z.object({
  provider: z.string(),
  mode: z.string().optional(),
  apiKey: z.string().optional(),
  apiProxy: z.string().optional(),
  thinkingModel: z.string(),
  networkingModel: z.string(),
  openRouterApiKey: z.string().optional(),
  openRouterApiProxy: z.string().optional(),
  openRouterThinkingModel: z.string().optional(),
  openRouterNetworkingModel: z.string().optional(),
  openAIApiKey: z.string().optional(),
  openAIApiProxy: z.string().optional(),
  openAIThinkingModel: z.string().optional(),
  openAINetworkingModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  anthropicApiProxy: z.string().optional(),
  anthropicThinkingModel: z.string().optional(),
  anthropicNetworkingModel: z.string().optional(),
  deepseekApiKey: z.string().optional(),
  deepseekApiProxy: z.string().optional(),
  deepseekThinkingModel: z.string().optional(),
  deepseekNetworkingModel: z.string().optional(),
  xAIApiKey: z.string().optional(),
  xAIApiProxy: z.string().optional(),
  xAIThinkingModel: z.string().optional(),
  xAINetworkingModel: z.string().optional(),
  openAICompatibleApiKey: z.string().optional(),
  openAICompatibleApiProxy: z.string().optional(),
  openAICompatibleThinkingModel: z.string().optional(),
  openAICompatibleNetworkingModel: z.string().optional(),
  ollamaApiProxy: z.string().optional(),
  ollamaThinkingModel: z.string().optional(),
  ollamaNetworkingModel: z.string().optional(),
  accessPassword: z.string().optional(),
  enableSearch: z.string(),
  searchProvider: z.string().optional(),
  tavilyApiKey: z.string().optional(),
  tavilyApiProxy: z.string().optional(),
  firecrawlApiKey: z.string().optional(),
  firecrawlApiProxy: z.string().optional(),
  exaApiKey: z.string().optional(),
  exaApiProxy: z.string().optional(),
  bochaApiKey: z.string().optional(),
  bochaApiProxy: z.string().optional(),
  searxngApiProxy: z.string().optional(),
  parallelSearch: z.number().min(1).max(5),
  searchMaxResult: z.number().min(1).max(10),
  language: z.string().optional(),
  theme: z.string().optional(),
});

function convertModelName(name: string) {
  return name
    .replaceAll("/", "-")
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

let preLoading = false;

function Setting({ open, onClose }: SettingProps) {
  const { t } = useTranslation();
  const { mode, provider, searchProvider, update } = useSettingStore();
  const { modelList, refresh } = useModel();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const thinkingModelList = useMemo(() => {
    const { provider } = useSettingStore.getState();
    if (provider === "google") {
      return filterThinkingModelList(modelList);
    } else if (provider === "openrouter") {
      return filterOpenRouterModelList(modelList);
    } else if (provider === "deepseek") {
      return filterDeepSeekModelList(modelList);
    }
    return [[], modelList];
  }, [modelList]);
  const networkingModelList = useMemo(() => {
    const { provider } = useSettingStore.getState();
    if (provider === "google") {
      return filterNetworkingModelList(modelList);
    } else if (provider === "openrouter") {
      return filterOpenRouterModelList(modelList);
    } else if (provider === "openai") {
      return filterOpenAIModelList(modelList);
    }
    return [[], modelList];
  }, [modelList]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return new Promise((resolve) => {
        const state = useSettingStore.getState();
        resolve({ ...omit(state, ["update"]) });
      });
    },
  });

  const isDisabledAIProvider = useCallback(
    (provider: string) => {
      const disabledAIProviders =
        mode === "proxy" && DISABLED_AI_PROVIDER.length > 0
          ? DISABLED_AI_PROVIDER.split(",")
          : [];
      return disabledAIProviders.includes(provider);
    },
    [mode]
  );

  const isDisabledAIModel = useCallback(
    (model: string) => {
      if (mode === "local") return false;
      const { availableModelList, disabledModelList } = getCustomModelList(
        MODEL_LIST.length > 0 ? MODEL_LIST.split(",") : []
      );
      const isAvailableModel = availableModelList.some(
        (availableModel) => availableModel === model
      );
      if (isAvailableModel) return false;
      if (disabledModelList.includes("all")) return true;
      return disabledModelList.some((disabledModel) => disabledModel === model);
    },
    [mode]
  );

  const isDisabledSearchProvider = useCallback(
    (provider: string) => {
      const disabledSearchProviders =
        mode === "proxy" && DISABLED_SEARCH_PROVIDER.length > 0
          ? DISABLED_SEARCH_PROVIDER.split(",")
          : [];
      return disabledSearchProviders.includes(provider);
    },
    [mode]
  );

  function handleClose(open: boolean) {
    if (!open) onClose();
  }

  function handleSubmit(values: z.infer<typeof formSchema>) {
    update(values);
    onClose();
  }

  const fetchModelList = useCallback(async () => {
    const { provider } = useSettingStore.getState();
    try {
      setIsRefreshing(true);
      await refresh(provider);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  function handleModeChange(mode: string) {
    update({ mode });
  }

  async function handleProviderChange(provider: string) {
    update({ provider });
    await fetchModelList();
  }

  async function handleSearchProviderChange(searchProvider: string) {
    update({ searchProvider });
  }

  async function updateSetting(key: string, value?: string | number) {
    update({ [key]: value });
    await fetchModelList();
  }

  function handleReset() {
    toast.warning(t("setting.resetSetting"), {
      description: t("setting.resetSettingWarning"),
      duration: 5000,
      action: {
        label: t("setting.confirm"),
        onClick: async () => {
          const { reset } = useSettingStore.getState();
          reset();
          await researchStore.clear();
        },
      },
    });
  }

  useLayoutEffect(() => {
    if (open && !preLoading) {
      fetchModelList();
      preLoading = true;
    }
  }, [open, fetchModelList]);

  useLayoutEffect(() => {
    if (open && mode === "") {
      const { apiKey, accessPassword, update } = useSettingStore.getState();
      const requestMode = !apiKey && accessPassword ? "proxy" : "local";
      update({ mode: requestMode });
      form.setValue("mode", requestMode);
    }
  }, [open, mode, form]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md print:hidden">
        <DialogHeader>
          <DialogTitle>{t("setting.title")}</DialogTitle>
          <DialogDescription>{t("setting.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <Tabs defaultValue="llm">
              <TabsList
                className={cn("w-full mb-2", {
                  hidden: BUILD_MODE === "export",
                })}
              >
                <TabsTrigger className="w-1/3" value="llm">
                  {t("setting.model")}
                </TabsTrigger>
                <TabsTrigger className="w-1/3" value="search">
                  {t("setting.search")}
                </TabsTrigger>
                <TabsTrigger className="w-1/3" value="general">
                  {t("setting.general")}
                </TabsTrigger>
              </TabsList>
              <TabsContent className="space-y-4" value="llm">
                <div className={BUILD_MODE === "export" ? "hidden" : ""}>
                  <FormField
                    control={form.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.mode")}
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleModeChange(value);
                            }}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-sm:max-h-48">
                              <SelectItem value="local">
                                {t("setting.local")}
                              </SelectItem>
                              <SelectItem value="proxy">
                                {t("setting.proxy")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.provider")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleProviderChange(value);
                          }}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {!isDisabledAIProvider("google") ? (
                              <SelectItem value="google">
                                Google AI Studio
                              </SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("openai") ? (
                              <SelectItem value="openai">OpenAI</SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("anthropic") ? (
                              <SelectItem value="anthropic">
                                Anthropic
                              </SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("deepseek") ? (
                              <SelectItem value="deepseek">DeepSeek</SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("xai") ? (
                              <SelectItem value="xai">xAI Grok</SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("openrouter") ? (
                              <SelectItem value="openrouter">
                                OpenRouter
                              </SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("openaicompatible") ? (
                              <SelectItem value="openaicompatible">
                                {t("setting.openAICompatible")}
                              </SelectItem>
                            ) : null}
                            {!isDisabledAIProvider("ollama") ? (
                              <SelectItem value="ollama">Ollama</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className={mode === "proxy" ? "hidden" : ""}>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "google",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "apiKey",
                                  form.getValues("apiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="apiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={GEMINI_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "apiProxy",
                                  form.getValues("apiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "openrouter",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="openRouterApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "openRouterApiKey",
                                  form.getValues("openRouterApiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="openRouterApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={OPENROUTER_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "openRouterApiProxy",
                                  form.getValues("openRouterApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "openai",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="openAIApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "openAIApiKey",
                                  form.getValues("openAIApiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="openAIApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={OPENAI_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "openAIApiProxy",
                                  form.getValues("openAIApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "anthropic",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="anthropicApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "anthropicApiKey",
                                  form.getValues("anthropicApiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="anthropicApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={ANTHROPIC_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "anthropicApiProxy",
                                  form.getValues("anthropicApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "deepseek",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="deepseekApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "deepseekApiKey",
                                  form.getValues("deepseekApiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deepseekApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={DEEPSEEK_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "deepseekApiProxy",
                                  form.getValues("deepseekApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "xai",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="xAIApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "xAIApiKey",
                                  form.getValues("xAIApiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="xAIApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={XAI_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "xAIApiProxy",
                                  form.getValues("xAIApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "openaicompatible",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="openAICompatibleApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.apiKeyPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "openAICompatibleApiKey",
                                  form.getValues("openAICompatibleApiKey")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="openAICompatibleApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={t("setting.apiUrlPlaceholder")}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "openAICompatibleApiProxy",
                                  form.getValues("openAICompatibleApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: provider !== "ollama",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="ollamaApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={OLLAMA_BASE_URL}
                              {...field}
                              onBlur={() =>
                                updateSetting(
                                  "ollamaApiProxy",
                                  form.getValues("ollamaApiProxy")
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: mode === "local" || BUILD_MODE === "export",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="accessPassword"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.accessPassword")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl className="col-span-3">
                          <Password
                            type="text"
                            placeholder={t("setting.accessPasswordPlaceholder")}
                            {...field}
                            onBlur={() =>
                              updateSetting(
                                "accessPassword",
                                form.getValues("accessPassword")
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "google",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="thinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {thinkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {thinkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {thinkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="networkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {networkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {networkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {networkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "openrouter",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="openRouterThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {thinkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {thinkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {thinkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openRouterNetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {networkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {networkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {networkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "openai",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="openAIThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {thinkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {thinkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {thinkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openAINetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {networkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {networkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {networkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "anthropic",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="anthropicThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {modelList.map((name) => {
                                  return !isDisabledAIModel(name) ? (
                                    <SelectItem key={name} value={name}>
                                      {convertModelName(name)}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="anthropicNetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {modelList.map((name) => {
                                  return !isDisabledAIModel(name) ? (
                                    <SelectItem key={name} value={name}>
                                      {convertModelName(name)}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "deepseek",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="deepseekThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {thinkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {thinkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {thinkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deepseekNetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {networkingModelList[0].length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel>
                                      {t("setting.recommendedModels")}
                                    </SelectLabel>
                                    {networkingModelList[0].map((name) => {
                                      return !isDisabledAIModel(name) ? (
                                        <SelectItem key={name} value={name}>
                                          {convertModelName(name)}
                                        </SelectItem>
                                      ) : null;
                                    })}
                                  </SelectGroup>
                                ) : null}
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("setting.basicModels")}
                                  </SelectLabel>
                                  {networkingModelList[1].map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "xai",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="xAIThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {modelList.map((name) => {
                                  return !isDisabledAIModel(name) ? (
                                    <SelectItem key={name} value={name}>
                                      {convertModelName(name)}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="xAINetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {modelList.map((name) => {
                                  return !isDisabledAIModel(name) ? (
                                    <SelectItem key={name} value={name}>
                                      {convertModelName(name)}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "openaicompatible",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="openAICompatibleThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 flex gap-2">
                            <Input
                              className={cn("flex-1", {
                                hidden: modelList.length > 0,
                              })}
                              placeholder={t("setting.modelListPlaceholder")}
                              {...field}
                            />
                            <div
                              className={cn("flex-1", {
                                hidden: modelList.length === 0,
                              })}
                            >
                              <Select
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "setting.modelListLoadingPlaceholder"
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent className="max-sm:max-h-72">
                                  {modelList.map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              <RefreshCw
                                className={isRefreshing ? "animate-spin" : ""}
                              />
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="openAICompatibleNetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full flex gap-2">
                            <Input
                              className={cn("flex-1", {
                                hidden: modelList.length > 0,
                              })}
                              placeholder={t("setting.modelListPlaceholder")}
                              {...field}
                            />
                            <div
                              className={cn("flex-1", {
                                hidden: modelList.length === 0,
                              })}
                            >
                              <Select
                                defaultValue={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "setting.modelListLoadingPlaceholder"
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent className="max-sm:max-h-72">
                                  {modelList.map((name) => {
                                    return !isDisabledAIModel(name) ? (
                                      <SelectItem key={name} value={name}>
                                        {convertModelName(name)}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              <RefreshCw
                                className={isRefreshing ? "animate-spin" : ""}
                              />
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div
                  className={cn("space-y-4", {
                    hidden: provider !== "ollama",
                  })}
                >
                  <FormField
                    control={form.control}
                    name="ollamaThinkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.thinkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {modelList.map((name) => {
                                  return !isDisabledAIModel(name) ? (
                                    <SelectItem key={name} value={name}>
                                      {convertModelName(name)}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ollamaNetworkingModel"
                    render={({ field }) => (
                      <FormItem className="from-item">
                        <FormLabel className="col-span-1">
                          {t("setting.networkingModel")}
                          <span className="ml-1 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="col-span-3 w-full">
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                className={cn({
                                  hidden: modelList.length === 0,
                                })}
                              >
                                <SelectValue
                                  placeholder={t(
                                    "setting.modelListLoadingPlaceholder"
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-sm:max-h-72">
                                {modelList.map((name) => {
                                  return !isDisabledAIModel(name) ? (
                                    <SelectItem key={name} value={name}>
                                      {convertModelName(name)}
                                    </SelectItem>
                                  ) : null;
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              className={cn("w-full", {
                                hidden: modelList.length > 0,
                              })}
                              type="button"
                              variant="outline"
                              disabled={isRefreshing}
                              onClick={() => fetchModelList()}
                            >
                              {isRefreshing ? (
                                <>
                                  <RefreshCw className="animate-spin" />{" "}
                                  {t("setting.modelListLoading")}
                                </>
                              ) : (
                                <>
                                  <RefreshCw /> {t("setting.refresh")}
                                </>
                              )}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent className="space-y-4" value="search">
                <FormField
                  control={form.control}
                  name="enableSearch"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.webSearch")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              {t("setting.enable")}
                            </SelectItem>
                            <SelectItem value="0">
                              {t("setting.disable")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="searchProvider"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.searchProvider")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          disabled={form.getValues("enableSearch") === "0"}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleSearchProviderChange(value);
                          }}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="model">
                              {t("setting.modelBuiltin")}
                            </SelectItem>
                            {!isDisabledSearchProvider("tavily") ? (
                              <SelectItem value="tavily">Tavily</SelectItem>
                            ) : null}
                            {!isDisabledSearchProvider("firecrawl") ? (
                              <SelectItem value="firecrawl">
                                Firecrawl
                              </SelectItem>
                            ) : null}
                            {!isDisabledSearchProvider("exa") ? (
                              <SelectItem value="exa">Exa</SelectItem>
                            ) : null}
                            {!isDisabledSearchProvider("bocha") ? (
                              <SelectItem value="bocha">
                                {t("setting.bocha")}
                              </SelectItem>
                            ) : null}
                            {!isDisabledSearchProvider("searxng") ? (
                              <SelectItem value="searxng">SearXNG</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className={mode === "proxy" ? "hidden" : ""}>
                  <div
                    className={cn("space-y-4", {
                      hidden: searchProvider !== "tavily",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="tavilyApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.searchApiKeyPlaceholder")}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tavilyApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={TAVILY_BASE_URL}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: searchProvider !== "firecrawl",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="firecrawlApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.searchApiKeyPlaceholder")}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="firecrawlApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={FIRECRAWL_BASE_URL}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: searchProvider !== "tavily",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="exaApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.searchApiKeyPlaceholder")}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exaApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={EXA_BASE_URL}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: searchProvider !== "bocha",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="bochaApiKey"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiKeyLabel")}
                            <span className="ml-1 text-red-500">*</span>
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Password
                              type="text"
                              placeholder={t("setting.searchApiKeyPlaceholder")}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bochaApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={BOCHA_BASE_URL}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div
                    className={cn("space-y-4", {
                      hidden: searchProvider !== "searxng",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="searxngApiProxy"
                      render={({ field }) => (
                        <FormItem className="from-item">
                          <FormLabel className="col-span-1">
                            {t("setting.apiUrlLabel")}
                          </FormLabel>
                          <FormControl className="col-span-3">
                            <Input
                              placeholder={SEARXNG_BASE_URL}
                              disabled={form.getValues("enableSearch") === "0"}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="parallelSearch"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.parallelSearch")}
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <div className="flex h-10">
                          <Slider
                            className="flex-1"
                            value={[field.value]}
                            max={5}
                            min={1}
                            step={1}
                            disabled={form.getValues("enableSearch") === "0"}
                            onValueChange={(values) =>
                              field.onChange(values[0])
                            }
                          />
                          <span className="w-[14%] text-center text-sm leading-10">
                            {field.value}
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="searchMaxResult"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.searchResults")}
                      </FormLabel>
                      <FormControl className="col-span-3">
                        <div className="flex h-10">
                          <Slider
                            className="flex-1"
                            value={[field.value]}
                            max={10}
                            min={1}
                            step={1}
                            disabled={form.getValues("enableSearch") === "0"}
                            onValueChange={(values) =>
                              field.onChange(values[0])
                            }
                          />
                          <span className="w-[14%] text-center text-sm leading-10">
                            {field.value}
                          </span>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent className="space-y-4" value="general">
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">
                        {t("setting.language")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en-US">English</SelectItem>
                            <SelectItem value="zh-CN">简体中文</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem className="from-item">
                      <FormLabel className="col-span-1">{t("theme")}</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">
                              {t("setting.system")}
                            </SelectItem>
                            <SelectItem value="light">
                              {t("setting.light")}
                            </SelectItem>
                            <SelectItem value="dark">
                              {t("setting.dark")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="from-item">
                  <Label>{t("setting.version")}</Label>
                  <div className="col-span-3 text-center leading-10">
                    {`v${VERSION}`}
                    <small className="ml-1">
                      (
                      <a
                        className="hover:underline hover:underline-offset-4 hover:text-blue-500"
                        href="https://github.com/u14app/deep-research"
                        target="_blank"
                      >
                        {t("setting.checkForUpdate")}
                      </a>
                      )
                    </small>
                  </div>
                </div>
                <div className="from-item">
                  <Label>{t("setting.resetSetting")}</Label>
                  <Button
                    className="col-span-3 hover:text-red-500"
                    type="button"
                    variant="ghost"
                    onClick={() => handleReset()}
                  >
                    {t("setting.resetAllSettings")}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
        <DialogFooter className="mt-2 flex-row sm:justify-between sm:space-x-0 gap-3">
          <Button className="flex-1" variant="outline" onClick={onClose}>
            {t("setting.cancel")}
          </Button>
          <Button
            className="flex-1"
            type="submit"
            onClick={form.handleSubmit(handleSubmit)}
          >
            {t("setting.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Setting;
