import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let messageCounter = 0;
export function generateMessageId(): string {
  return `${Date.now()}-${++messageCounter}`;
}
