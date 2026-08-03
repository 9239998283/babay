"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/store/theme-store";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Цвет фона"
      className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${theme === "light" ? "bg-orange-500 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
      >
        <Sun size={14} />
        {compact ? null : "Белый"}
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${theme === "dark" ? "bg-orange-500 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}
      >
        <Moon size={14} />
        {compact ? null : "Чёрный"}
      </button>
    </div>
  );
}
