"use client";

import { useState, useTransition } from "react";
import { toggleModuleAction } from "@/lib/modules/actions";

interface ModuleToggleProps {
  moduleId: string;
  name: string;
  description: string;
  isCore: boolean;
  isEnabled: boolean;
  dependencies: string[];
}

export function ModuleToggle({
  moduleId,
  name,
  description,
  isCore,
  isEnabled,
  dependencies,
}: ModuleToggleProps) {
  const [enabled, setEnabled] = useState(isEnabled);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (isCore) return;

    const newState = !enabled;
    setError(null);

    startTransition(async () => {
      const result = await toggleModuleAction(moduleId, newState);
      if (result.error) {
        setError(result.error);
      } else {
        setEnabled(newState);
      }
    });
  }

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</h3>
          {isCore && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Always on
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        {dependencies.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Requires: {dependencies.join(", ")}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
      <button
        onClick={handleToggle}
        disabled={isCore || isPending}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
        }`}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${name}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
