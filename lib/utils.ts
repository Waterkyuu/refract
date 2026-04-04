import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
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

export { cn, formatRelativeDate };
