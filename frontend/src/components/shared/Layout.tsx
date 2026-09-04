import type { ReactNode } from "react";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";
import { SearchBar } from "../../features/search/components/SearchBar";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
          <SearchBar />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
