import { useSettingStore } from "@/store/setting";
import {
  TAVILY_BASE_URL,
  FIRECRAWL_BASE_URL,
  SEARXNG_BASE_URL,
} from "@/constants/urls";
import { pick, shuffle } from "radash";

type TavilySearchOptions = {
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  days?: number;
  maxResults?: number;
  includeImages?: boolean;
  includeImageDescriptions?: boolean;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeDomains?: undefined | Array<string>;
  excludeDomains?: undefined | Array<string>;
  maxTokens?: undefined | number;
  timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d";
  chunksPerSource?: undefined | number;
  timeout?: number;
  [key: string]: any;
};

type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate: string;
};

interface FirecrawlSearchOptions {
  limit?: number;
  tbs?: string;
  filter?: string;
  lang?: string;
  country?: string;
  location?: string;
  origin?: string;
  timeout?: number;
  scrapeOptions?: { formats: ("markdown" | "html" | "rawHtml" | "text")[] };
}

interface FirecrawlDocument<T = unknown> {
  url?: string;
  markdown?: string;
  html?: string;
  rawHtml?: string;
  links?: string[];
  extract?: T;
  json?: T;
  screenshot?: string;
  compare?: {
    previousScrapeAt: string | null;
    changeStatus: "new" | "same" | "changed" | "removed";
    visibility: "visible" | "hidden";
  };
  // v1 search only
  title?: string;
  description?: string;
}

type BochaSearchOptions = {
  freshness?:
    | "oneDay"
    | "oneWeek"
    | "oneMonth"
    | "oneYear"
    | "noLimit"
    | string;
  summary?: boolean;
  count?: number;
  page?: number;
};

type BochaSearchResult = {
  id: string | null;
  name: string;
  url: string;
  displayUrl: string;
  snippet: string;
  summary?: string;
  siteName: string;
  siteIcon: string;
  dateLastCrawled: string;
  cachedPageUrl: string | null;
  language: string | null;
  isFamilyFriendly: boolean | null;
  isNavigational: boolean | null;
};

type SearxngSearchOptions = {
  categories?: string[];
  engines?: string[];
  lang?: "auto" | string;
  pageno?: number;
  time_range?: "day" | "month" | "year";
  format?: "json" | "csv" | "rss";
  results_on_new_tab?: 0 | 1;
  image_proxy?: boolean;
  autocomplete?: string;
  safesearch?: 0 | 1 | 2;
};

type SearxngSearchResult = {
  url: string;
  title: string;
  content?: string;
  engine: string;
  parsed_url: string[];
  template: "default.html" | "videos.html" | "images.html";
  engines: string[];
  positions: number[];
  publishedDate?: Date | null;
  thumbnail?: null | string;
  is_onion?: boolean;
  score: number;
  category: string;
  length?: null | string;
  duration?: null | string;
  iframe_src?: string;
  source?: string;
  metadata?: string;
  resolution?: null | string;
  img_src?: string;
  thumbnail_src?: string;
  img_format?: "jpeg" | "Culture Snaxx" | "png";
};

function useWebSearch() {
  async function tavily(query: string, options: TavilySearchOptions = {}) {
    const {
      mode,
      tavilyApiKey,
      tavilyApiProxy,
      searchMaxResult,
      accessPassword,
    } = useSettingStore.getState();

    const tavilyApiKeys = shuffle(tavilyApiKey.split(","));
    const response = await fetch(
      mode === "local"
        ? `${tavilyApiProxy || TAVILY_BASE_URL}/search`
        : "/api/search/tavily/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            mode === "local" ? tavilyApiKeys[0] : accessPassword
          }`,
        },
        body: JSON.stringify({
          query,
          searchDepth: "basic",
          topic: "general",
          days: 3,
          maxResults: Number(searchMaxResult),
          includeImages: false,
          includeImageDescriptions: false,
          includeAnswer: false,
          includeRawContent: false,
          chunksPerSource: 3,
          ...options,
        }),
      }
    );
    const { results } = await response.json();
    return (results as TavilySearchResult[])
      .filter((item) => item.content && item.url)
      .map((result) => pick(result, ["title", "content", "url"])) as Source[];
  }

  async function firecrawl(
    query: string,
    options: FirecrawlSearchOptions = {}
  ) {
    const {
      mode,
      firecrawlApiKey,
      firecrawlApiProxy,
      searchMaxResult,
      language,
      accessPassword,
    } = useSettingStore.getState();

    const firecrawlApiKeys = shuffle(firecrawlApiKey.split(","));
    const languageMeta = language.split("-");
    const response = await fetch(
      mode === "local"
        ? `${firecrawlApiProxy || FIRECRAWL_BASE_URL}/v1/search`
        : "/api/search/firecrawl/v1/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            mode === "local" ? firecrawlApiKeys[0] : accessPassword
          }`,
        },
        body: JSON.stringify({
          query,
          lang: languageMeta[0].toLowerCase(),
          country: languageMeta[1].toLowerCase(),
          limit: searchMaxResult,
          origin: "api",
          scrapeOptions: {
            formats: ["markdown"],
          },
          timeout: 60000,
          ...options,
        }),
      }
    );
    const { data } = await response.json();
    return (data as FirecrawlDocument[])
      .filter((item) => item.description && item.url)
      .map((result) => ({
        content: result.markdown || result.description,
        url: result.url,
        title: result.title,
      })) as Source[];
  }

  async function bocha(query: string, options: BochaSearchOptions = {}) {
    const {
      mode,
      bochaApiKey,
      bochaApiProxy,
      searchMaxResult,
      accessPassword,
    } = useSettingStore.getState();

    const bochaApiKeys = shuffle(bochaApiKey.split(","));
    const response = await fetch(
      mode === "local"
        ? `${bochaApiProxy || TAVILY_BASE_URL}/v1/web-search`
        : "/api/search/bocha/v1/web-search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            mode === "local" ? bochaApiKeys[0] : accessPassword
          }`,
        },
        body: JSON.stringify({
          query,
          freshness: "noLimit",
          summary: true,
          count: searchMaxResult,
          ...options,
        }),
      }
    );
    const { data } = await response.json();
    const results = data.webPages?.value || [];
    return (results as BochaSearchResult[])
      .filter((item) => item.snippet && item.url)
      .map((result) => ({
        content: result.summary || result.snippet,
        url: result.url,
        title: result.name,
      })) as Source[];
  }

  async function searxng(query: string, options: SearxngSearchOptions = {}) {
    const { mode, searxngApiProxy, accessPassword } =
      useSettingStore.getState();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (mode === "proxy") headers["Authorization"] = `Bearer ${accessPassword}`;
    const params = {
      q: query,
      categories: ["general", "web"],
      engines: ["google", "bing", "duckduckgo", "brave", "arxiv"],
      lang: "auto",
      format: "json",
      autocomplete: "google",
      ...options,
    };
    const searchQuery = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchQuery.append(key, value.toString());
    }
    const response = await fetch(
      `${
        mode === "local"
          ? `${searxngApiProxy || SEARXNG_BASE_URL}/search`
          : "/api/search/searxng/search"
      }?${searchQuery.toString()}`,
      {
        method: "POST",
        headers,
      }
    );
    const { results = [] } = await response.json();
    return (results as SearxngSearchResult[])
      .filter((item) => item.content && item.url)
      .map((result) => pick(result, ["title", "content", "url"])) as Source[];
  }

  return {
    tavily,
    firecrawl,
    bocha,
    searxng,
  };
}

export default useWebSearch;
