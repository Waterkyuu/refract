import "@testing-library/jest-dom";
import {
	ReadableStream,
	TransformStream,
	WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";
import { MessageChannel, MessagePort } from "node:worker_threads";
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
		value: TransformStream,
		writable: true,
	});
}

if (typeof globalThis.ReadableStream === "undefined") {
	Object.defineProperty(globalThis, "ReadableStream", {
		value: ReadableStream,
		writable: true,
	});
}

if (typeof globalThis.WritableStream === "undefined") {
	Object.defineProperty(globalThis, "WritableStream", {
		value: WritableStream,
		writable: true,
	});
}

if (typeof globalThis.fetch === "undefined") {
	Object.defineProperty(globalThis, "fetch", {
		value: jest.fn(async () => ({
			ok: true,
			status: 200,
			headers: {
				get: () => null,
			},
			json: async () => ({}),
			text: async () => "",
		})),
		writable: true,
	});
}

if (typeof globalThis.TextDecoder === "undefined") {
	Object.defineProperty(globalThis, "TextDecoder", {
		value: TextDecoder,
		writable: true,
	});
}

if (typeof globalThis.TextEncoder === "undefined") {
	Object.defineProperty(globalThis, "TextEncoder", {
		value: TextEncoder,
		writable: true,
	});
}

if (typeof globalThis.MessageChannel === "undefined") {
	Object.defineProperty(globalThis, "MessageChannel", {
		value: MessageChannel,
		writable: true,
	});
}

if (typeof globalThis.MessagePort === "undefined") {
	Object.defineProperty(globalThis, "MessagePort", {
		value: MessagePort,
		writable: true,
	});
}
