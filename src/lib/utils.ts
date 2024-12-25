import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ClassValue } from "class-variance-authority/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
