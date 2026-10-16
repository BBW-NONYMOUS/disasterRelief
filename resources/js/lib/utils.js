import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes without duplicate/conflicting utilities. */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
