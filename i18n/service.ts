"use server";

import { cookies, headers } from "next/headers";
import { defaultLocale, locales } from "./routing";

const COOKIE_NAME = "NEXT_LOCALE";

// 通过cookie的accept-language 获取用户地区
export async function getUserLocale() {
	// Read cookies
	const locale = (await cookies()).get(COOKIE_NAME)?.value;
	if (locale) return locale;

	// Read the request header accept-language
	const acceptLanguage = (await headers()).get("accept-language");

	// Parse the request header zh-cn,zh; Q = 0.9, en - US; Q = 0.8, en; Q = 0.7
	const parsedLocale = acceptLanguage?.split(",")[0].split("-")[0] ?? ""; // zh

	// If you are not on the list of languages supported by the system, use the default language
	return locales.includes(parsedLocale) ? parsedLocale : defaultLocale;
}

export async function setUserLocale(locale: string) {
	(await cookies()).set(COOKIE_NAME, locale);
}
