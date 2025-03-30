import { useState } from "react";
import { useSettingStore } from "@/store/setting";
import { shuffle } from "radash";

function useModel() {
  const [modelList, setModelList] = useState<string[]>([]);

  async function refresh(): Promise<string[]> {
    const {
      apiKey = "",
      apiProxy,
      accessPassword,
    } = useSettingStore.getState();
    const apiKeys = shuffle(apiKey.split(","));

    if (apiKey || accessPassword) {
      const response = await fetch(
        apiKeys[0]
          ? `${
              apiProxy || "https://generativelanguage.googleapis.com"
            }/v1beta/models`
          : "/api/ai/google/v1beta/models",
        {
          headers: {
            "x-goog-api-key": apiKeys[0] ? apiKeys[0] : accessPassword,
          },
        }
      );
      const { models = [] } = await response.json();
      const newModelList = (models as Model[])
        .filter(
          (item) =>
            item.name.startsWith("models/gemini") &&
            item.supportedGenerationMethods.includes("generateContent")
        )
        .map((item) => item.name.replace("models/", ""));
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

export default useModel;
