export function isThinkingModel(model: string) {
  return model.includes("thinking") || model.startsWith("gemini-2.5-pro");
}

export function isNetworkingModel(model: string) {
  return (
    (model.startsWith("gemini-2.0-flash") &&
      !model.includes("lite") &&
      !model.includes("thinking") &&
      !model.includes("image")) ||
    model.startsWith("gemini-2.5-pro")
  );
}

export function filterThinkingModelList(modelList: string[]) {
  const thinkingModelList: string[] = [];
  const nonThinkingModelList: string[] = [];
  modelList.forEach((model) => {
    if (isThinkingModel(model)) {
      thinkingModelList.push(model);
    } else {
      nonThinkingModelList.push(model);
    }
  });
  return [thinkingModelList, nonThinkingModelList];
}

export function filterNetworkingModelList(modelList: string[]) {
  const networkingModelList: string[] = [];
  const nonNetworkingModelList: string[] = [];
  modelList.filter((model) => {
    if (isNetworkingModel(model)) {
      networkingModelList.push(model);
    } else {
      nonNetworkingModelList.push(model);
    }
  });
  return [networkingModelList, nonNetworkingModelList];
}
