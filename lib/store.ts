"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CareerMatch,
  ChatMessage,
  LanguageCode,
  ResumeAnalysis,
  RoadmapStage,
  StudentProfile,
} from "./types";
import { api } from "./api";
import { t as translate } from "./i18n";

interface StoreState {
  user: { id: string; email: string; name: string } | null;
  profile: StudentProfile | null;
  matches: CareerMatch[] | null;
  roadmap: RoadmapStage[] | null;
  skillGapReady: boolean;
  loading: boolean;
  theme: "light" | "dark";
  lang: LanguageCode;
  chat: ChatMessage[];
  resumeAnalysis: ResumeAnalysis | null;
  doneTasks: Record<string, string[]>; // stageId -> task list
  selectedProjects: string[];

  hydrate: () => Promise<void>;
  setTheme: (t: "light" | "dark") => void;
  setLang: (l: LanguageCode) => void;
  setProfile: (p: StudentProfile) => void;
  loadMatches: (force?: boolean) => Promise<void>;
  selectCareer: (careerId: string) => Promise<void>;
  toggleTask: (stageId: string, task: string) => void;
  addChat: (m: ChatMessage) => void;
  clearChat: () => void;
  setResumeAnalysis: (a: ResumeAnalysis) => void;
  toggleProject: (id: string) => void;
  logout: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      matches: null,
      roadmap: null,
      skillGapReady: false,
      loading: false,
      theme: "light",
      lang: "en",
      chat: [],
      resumeAnalysis: null,
      doneTasks: {},
      selectedProjects: [],

      hydrate: async () => {
        try {
          const { user } = await api.session();
          if (user) {
            set({ user: { id: user.id, email: user.email, name: user.name } });
            if (user.profile) {
              set({ profile: user.profile, lang: user.profile.language ?? get().lang });
            }
          } else {
            set({ user: null, profile: null, matches: null, roadmap: null });
          }
        } catch {
          /* offline / server restarting */
        }
      },

      setTheme: (theme) => set({ theme }),
      setLang: (lang) => {
        set({ lang });
        const p = get().profile;
        if (p) {
          const updated = { ...p, lang };
          set({ profile: updated });
          api.saveProfile({ language: lang }).catch(() => {});
        }
      },

      setProfile: (profile) => {
        set({ profile });
        api.saveProfile(profile).catch(() => {});
      },

      loadMatches: async (force = false) => {
        if (get().matches && !force) return;
        set({ loading: true });
        try {
          const data = await api.matches();
          set({
            matches: data.matches,
            roadmap: data.roadmap,
            skillGapReady: true,
          });
        } catch {
          /* unauthenticated */
        } finally {
          set({ loading: false });
        }
      },

      selectCareer: async (careerId) => {
        await api.selectCareer(careerId);
        const p = get().profile;
        if (p) set({ profile: { ...p, targetCareerId: careerId } });
        await get().loadMatches(true);
      },

      toggleTask: (stageId, task) => {
        const done = get().doneTasks[stageId] ?? [];
        const next = done.includes(task)
          ? done.filter((t) => t !== task)
          : [...done, task];
        set({ doneTasks: { ...get().doneTasks, [stageId]: next } });
      },

      addChat: (m) => set({ chat: [...get().chat.slice(-60), m] }),
      clearChat: () => set({ chat: [] }),

      setResumeAnalysis: (a) => set({ resumeAnalysis: a }),

      toggleProject: (id) => {
        const sel = get().selectedProjects;
        set({
          selectedProjects: sel.includes(id)
            ? sel.filter((p) => p !== id)
            : [...sel, id],
        });
      },

      logout: async () => {
        await api.auth("logout").catch(() => {});
        set({
          user: null,
          profile: null,
          matches: null,
          roadmap: null,
          chat: [],
          resumeAnalysis: null,
          doneTasks: {},
          selectedProjects: [],
        });
      },
    }),
    {
      name: "acn-ui",
      partialize: (s) => ({
        theme: s.theme,
        lang: s.lang,
        chat: s.chat,
        resumeAnalysis: s.resumeAnalysis,
        doneTasks: s.doneTasks,
        selectedProjects: s.selectedProjects,
      }),
    }
  )
);

export function useT() {
  const lang = useStore((s) => s.lang);
  return (key: string) => translate(lang, key);
}
