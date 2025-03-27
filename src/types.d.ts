interface Source {
  sourceType: "url";
  id: string;
  url: string;
  title?: string;
}

interface SearchTask {
  state: "unprocessed" | "processing" | "completed";
  query: string;
  researchGoal: string;
  learning: string;
  sources: Source[];
}

interface ResearchHistory {
  id: string;
  createdAt: number;
  title: string;
  question: string;
  questions: string;
  finalReport: string;
  query: string;
  suggestion: string;
  tasks: SearchTask[];
  feedback: string;
}

interface PartialJson {
  value: JSONValue | undefined;
  state:
    | "undefined-input"
    | "successful-parse"
    | "repaired-parse"
    | "failed-parse";
}

interface GeminiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}
