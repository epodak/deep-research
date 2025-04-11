import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getCustomModelList } from "@/utils/models";
import { isEqual, shuffle } from "radash";

const NODE_ENV = process.env.NODE_ENV;
const accessPassword = process.env.ACCESS_PASSWORD || "";
// AI provider API key
const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const XAI_API_KEY = process.env.XAI_API_KEY || "";
const OPENAI_COMPATIBLE_API_KEY = process.env.OPENAI_COMPATIBLE_API_KEY || "";
// Search provider API key
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const EXA_API_KEY = process.env.EXA_API_KEY || "";
const BOCHA_API_KEY = process.env.BOCHA_API_KEY || "";
// Disabled Provider
const DISABLED_AI_PROVIDER = process.env.NEXT_PUBLIC_DISABLED_AI_PROVIDER || "";
const DISABLED_SEARCH_PROVIDER =
  process.env.NEXT_PUBLIC_DISABLED_SEARCH_PROVIDER || "";
const MODEL_LIST = process.env.NEXT_PUBLIC_MODEL_LIST || "";

// Limit the middleware to paths starting with `/api/`
export const config = {
  matcher: "/api/:path*",
};

const ERRORS = {
  NO_PERMISSIONS: {
    code: 403,
    message: "No permissions",
    status: "FORBIDDEN",
  },
  NO_API_KEY: {
    code: 500,
    message: "The server does not have an API key.",
    status: "Internal Server Error",
  },
};

export async function middleware(request: NextRequest) {
  if (NODE_ENV === "production") console.debug(request);

  const disabledAIProviders =
    DISABLED_AI_PROVIDER.length > 0 ? DISABLED_AI_PROVIDER.split(",") : [];
  const disabledSearchProviders =
    DISABLED_SEARCH_PROVIDER.length > 0
      ? DISABLED_SEARCH_PROVIDER.split(",")
      : [];

  const hasDisabledGeminiModel = () => {
    if (request.method.toUpperCase() === "GET") return false;
    const { availableModelList, disabledModelList } = getCustomModelList(
      MODEL_LIST.length > 0 ? MODEL_LIST.split(",") : []
    );
    const isAvailableModel = availableModelList.some((availableModel) =>
      request.nextUrl.pathname.includes(`models/${availableModel}:`)
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) =>
      request.nextUrl.pathname.includes(`models/${disabledModel}:`)
    );
  };
  const hasDisabledAIModel = async () => {
    if (request.method.toUpperCase() === "GET") return false;
    const { model = "" } = await request.json();
    const { availableModelList, disabledModelList } = getCustomModelList(
      MODEL_LIST.length > 0 ? MODEL_LIST.split(",") : []
    );
    const isAvailableModel = availableModelList.some(
      (availableModel) => availableModel === model
    );
    if (isAvailableModel) return false;
    if (disabledModelList.includes("all")) return true;
    return disabledModelList.some((disabledModel) => disabledModel === model);
  };

  if (request.nextUrl.pathname.startsWith("/api/ai/google")) {
    const authorization = request.headers.get("x-goog-api-key");
    const isDisabledGeminiModel = hasDisabledGeminiModel();
    if (
      isEqual(authorization, null) ||
      authorization !== accessPassword ||
      disabledAIProviders.includes("google") ||
      isDisabledGeminiModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(GOOGLE_GENERATIVE_AI_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set(
          "x-goog-api-client",
          request.headers.get("x-goog-api-client") || "genai-js/0.24.0"
        );
        requestHeaders.set("x-goog-api-key", apiKeys[0]);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openrouter")) {
    const authorization = request.headers.get("authorization");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledAIProviders.includes("openrouter") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(OPENROUTER_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openai")) {
    const authorization = request.headers.get("authorization");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledAIProviders.includes("openai") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(OPENAI_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/anthropic")) {
    const authorization = request.headers.get("x-api-key");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== accessPassword ||
      disabledAIProviders.includes("anthropic") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(ANTHROPIC_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("x-api-key", apiKeys[0]);
        requestHeaders.set(
          "anthropic-version",
          request.headers.get("anthropic-version") || "2023-06-01"
        );
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/deepseek")) {
    const authorization = request.headers.get("authorization");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledAIProviders.includes("deepseek") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(DEEPSEEK_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/xai")) {
    const authorization = request.headers.get("authorization");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledAIProviders.includes("xai") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(XAI_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/ai/openaicompatible")) {
    const authorization = request.headers.get("authorization");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledAIProviders.includes("openaicompatible") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(OPENAI_COMPATIBLE_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  // The ollama model only verifies access to the backend API
  if (request.nextUrl.pathname.startsWith("/api/ai/ollama")) {
    const authorization = request.headers.get("authorization");
    const isDisabledModel = await hasDisabledAIModel();
    if (
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledAIProviders.includes("ollama") ||
      isDisabledModel
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/tavily")) {
    const authorization = request.headers.get("authorization");
    if (
      request.method.toUpperCase() !== "POST" ||
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledSearchProviders.includes("tavily")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(TAVILY_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/firecrawl")) {
    const authorization = request.headers.get("authorization");
    if (
      request.method.toUpperCase() !== "POST" ||
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledSearchProviders.includes("firecrawl")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(FIRECRAWL_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/exa")) {
    const authorization = request.headers.get("authorization");
    if (
      request.method.toUpperCase() !== "POST" ||
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledSearchProviders.includes("exa")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(EXA_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/bocha")) {
    const authorization = request.headers.get("authorization");
    if (
      request.method.toUpperCase() !== "POST" ||
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledSearchProviders.includes("bocha")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      // Support multi-key polling,
      const apiKeys = shuffle(BOCHA_API_KEY.split(","));
      if (apiKeys[0]) {
        const requestHeaders = new Headers();
        requestHeaders.set(
          "Content-Type",
          request.headers.get("Content-Type") || "application/json"
        );
        requestHeaders.set("Authorization", `Bearer ${apiKeys[0]}`);
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } else {
        return NextResponse.json(
          {
            error: ERRORS.NO_API_KEY,
          },
          { status: 500 }
        );
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/api/search/searxng")) {
    const authorization = request.headers.get("authorization");
    if (
      request.method.toUpperCase() !== "POST" ||
      isEqual(authorization, null) ||
      authorization !== `Bearer ${accessPassword}` ||
      disabledSearchProviders.includes("searxng")
    ) {
      return NextResponse.json(
        { error: ERRORS.NO_PERMISSIONS },
        { status: 403 }
      );
    } else {
      const requestHeaders = new Headers();
      requestHeaders.set(
        "Content-Type",
        request.headers.get("Content-Type") || "application/json"
      );
      requestHeaders.delete("Authorization");
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  return NextResponse.next();
}
