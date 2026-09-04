import { create } from "zustand";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme");
  return stored === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme): void {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

interface UiState {
  isSidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: true,
  theme: getInitialTheme(),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme: Theme = state.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      return { theme: nextTheme };
    }),
}));
