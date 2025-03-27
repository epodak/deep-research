import { create } from "zustand";
import { pick } from "radash";

export type TaskStore = {
  question: string;
  questions: string;
  finalReport: string;
  query: string;
  title: string;
  suggestion: string;
  tasks: SearchTask[];
  feedback: string;
};

type TaskFunction = {
  update: (tasks: SearchTask[]) => void;
  setTitle: (title: string) => void;
  setSuggestion: (suggestion: string) => void;
  setQuery: (query: string) => void;
  updateTask: (query: string, task: Partial<SearchTask>) => void;
  setQuestion: (question: string) => void;
  updateQuestions: (questions: string) => void;
  updateFinalReport: (report: string) => void;
  setFeedback: (feedback: string) => void;
  clear: () => void;
  reset: () => void;
  backup: () => TaskStore;
  restore: (taskStore: TaskStore) => void;
};

const defaultValues: TaskStore = {
  question: "",
  questions: "",
  finalReport: "",
  query: "",
  title: "",
  suggestion: "",
  tasks: [],
  feedback: "",
};

export const useTaskStore = create<TaskStore & TaskFunction>((set, get) => ({
  ...defaultValues,
  update: (tasks) => set(() => ({ tasks: [...tasks] })),
  setTitle: (title) => set(() => ({ title })),
  setSuggestion: (suggestion) => set(() => ({ suggestion })),
  setQuery: (query) => set(() => ({ query })),
  updateTask: (query, task) => {
    const newTasks = get().tasks.map((item) => {
      return item.query === query ? { ...item, ...task } : item;
    });
    set(() => ({ tasks: [...newTasks] }));
  },
  setQuestion: (question) => set(() => ({ question })),
  updateQuestions: (questions) => set(() => ({ questions })),
  updateFinalReport: (report) => set(() => ({ finalReport: report })),
  setFeedback: (feedback) => set(() => ({ feedback })),
  clear: () => set(() => ({ tasks: [] })),
  reset: () => set(() => ({ ...defaultValues })),
  backup: () => {
    return {
      ...pick(get(), Object.keys(defaultValues) as (keyof TaskStore)[]),
    } as TaskStore;
  },
  restore: (taskStore) => set(() => ({ ...taskStore })),
}));
