import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        {
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200": variant === "default",
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": variant === "success",
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200": variant === "warning",
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": variant === "destructive",
          "border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
