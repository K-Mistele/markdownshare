import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function formatRelativeTime(date: Date | string) {
	const now = new Date();
	const past = new Date(date);
	const diffInMs = now.getTime() - past.getTime();
	const diffInSecs = Math.floor(diffInMs / 1000);
	const diffInMins = Math.floor(diffInSecs / 60);
	const diffInHours = Math.floor(diffInMins / 60);
	const diffInDays = Math.floor(diffInHours / 24);

	if (diffInSecs < 60) {
		return "just now";
	}
	if (diffInMins < 60) {
		return `${diffInMins} minute${diffInMins > 1 ? "s" : ""} ago`;
	}
	if (diffInHours < 24) {
		return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
	}
	if (diffInDays < 7) {
		return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
	}
	return formatDate(date);
}

export function generateId(): string {
	return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	};
}

/**
 * Throws an error if the environment variable is not set
 * @param key - The environment variable key
 * @returns The environment variable value
 */
export function requireEnvironment(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable ${key} is not set`);
	}
	return value;
}

/**
 * Gets an environment variable with an optional fallback value
 * @param key - The environment variable key
 * @param fallback - The fallback value if the environment variable is not set
 * @returns The environment variable value or the fallback value
 */
export function getEnvironment(key: string, fallback: string): string {
	return process.env[key] || fallback;
}
