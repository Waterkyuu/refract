import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import enMessages from "./messages/en.json";

type TranslationValues = Record<string, string | number>;

const getMessage = (path: string) => {
	const result = path
		.split(".")
		.reduce<unknown>(
			(accumulator, segment) =>
				accumulator && typeof accumulator === "object" && segment in accumulator
					? (accumulator as Record<string, unknown>)[segment]
					: undefined,
			enMessages,
		);

	return typeof result === "string" ? result : path;
};

const formatMessage = (message: string, values?: TranslationValues) => {
	if (!values) {
		return message;
	}

	return Object.entries(values).reduce(
		(result, [key, value]) => result.replace(`{${key}}`, String(value)),
		message,
	);
};

jest.mock("next-intl", () => ({
	NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
	useLocale: () => "en",
	useMessages: () => enMessages,
	useTranslations:
		(namespace?: string) => (key: string, values?: TranslationValues) =>
			formatMessage(
				getMessage(namespace ? `${namespace}.${key}` : key),
				values,
			),
}));

if (typeof globalThis.TransformStream === "undefined") {
	Object.defineProperty(globalThis, "TransformStream", {
		value: class TransformStream {
			readable: unknown;
			writable: unknown;
			constructor() {
				this.readable = {};
				this.writable = {};
			}
		},
		writable: true,
	});
}

if (typeof globalThis.ReadableStream === "undefined") {
	Object.defineProperty(globalThis, "ReadableStream", {
		value: class ReadableStream {
			getReader() {
				return this;
			}
		},
		writable: true,
	});
}

if (typeof globalThis.WritableStream === "undefined") {
	Object.defineProperty(globalThis, "WritableStream", {
		value: class WritableStream {
			getWriter() {
				return this;
			}
		},
		writable: true,
	});
}

if (typeof globalThis.fetch === "undefined") {
	Object.defineProperty(globalThis, "fetch", {
		value: jest.fn(async () => ({
			ok: true,
			status: 200,
			headers: new Headers(),
			json: async () => ({}),
			text: async () => "",
		})),
		writable: true,
	});
}
