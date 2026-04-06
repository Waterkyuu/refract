import { type ClassValue, clsx } from "clsx";
// Common helper function
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
};

const generateId = () => {
	return crypto.randomUUID();
};

type DebounceFunction<T extends (...args: unknown[]) => unknown> = (
	...args: Parameters<T>
) => void;

const debounce = <T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
): DebounceFunction<T> => {
	let timer: ReturnType<typeof setTimeout> | undefined;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
		clearTimeout(timer);

		timer = setTimeout(() => {
			func.apply(this, args);
		}, wait);
	};
};

// Handle copied titles
const duplicateContent = async (content: string) => {
	try {
		await navigator.clipboard.writeText(content);

		toast.success("Copy title successfully");
	} catch (error) {
		console.error("Failed to copy title", error);
		toast.error("Failed to copy title");
	}
};

// Format date to relative time
const formatRelativeDate = (date: Date): string => {
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (diffInDays === 0) {
		return "Today";
	}
	if (diffInDays === 1) {
		return "Yesterday";
	}
	if (diffInDays < 7) {
		return "Last week";
	}
	if (diffInDays < 30) {
		return "Last month";
	}
	return "Older";
};

export { cn, generateId, debounce, duplicateContent, formatRelativeDate };
