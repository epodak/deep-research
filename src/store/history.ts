import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import type { TaskStore } from "./task";
import { researchStore } from "@/utils/storage";
import { customAlphabet } from "nanoid";
import { clone, pick } from "radash";

type HistoryStore = {
  history: ResearchHistory[];
};

type HistoryFunction = {
  save: (taskStore: TaskStore) => void;
  load: (id: string) => TaskStore | void;
  remove: (id: string) => void;
};

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

export const useHistoryStore = create(
  persist<HistoryStore & HistoryFunction>(
    (set, get) => ({
      history: [],
      save: (taskStore) => {
        // Only tasks with a title and final report are saved to the history
        if (taskStore.title && taskStore.finalReport) {
          const newHistory: ResearchHistory = {
            id: nanoid(),
            createdAt: Date.now(),
            ...clone(taskStore),
          };
          set((state) => ({ history: [newHistory, ...state.history] }));
        }
      },
      load: (id) => {
        const current = get().history.find((item) => item.id === id);
        if (current) return clone(current);
      },
      remove: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
    }),
    {
      name: "historyStore",
      version: 1,
      storage: {
        getItem: async (key: string) => {
          return await researchStore.getItem<
            StorageValue<HistoryStore & HistoryFunction>
          >(key);
        },
        setItem: async (
          key: string,
          store: StorageValue<HistoryStore & HistoryFunction>
        ) => {
          return await researchStore.setItem(key, {
            state: pick(store.state, ["history"]),
            version: store.version,
          });
        },
        removeItem: async (key: string) => await researchStore.removeItem(key),
      },
    }
  )
);
