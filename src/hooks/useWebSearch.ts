import { useSettingStore } from "@/store/setting";
import { TAVILY_BASE_URL, FIRECRAWL_BASE_URL } from "@/constants/urls";
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
        } as TavilySearchOptions),
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
        } as FirecrawlSearchOptions),
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

  return {
    tavily,
    firecrawl,
  };
}

export default useWebSearch;
