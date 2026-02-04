import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateFromMs(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // Less than 24 hours ago
  if (diffInHours < 24) {
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
    }
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // Less than 7 days ago
  if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  // Format as date
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  };

  return date.toLocaleDateString("en-US", options);
}
