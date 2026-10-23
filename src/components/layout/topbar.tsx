"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  userName: string;
  companyName: string;
}

export function Topbar({ userName, companyName }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark mode"
          className="h-8 w-8"
        >
          <Sun size={16} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon size={16} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{companyName}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
