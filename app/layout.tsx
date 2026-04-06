import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { AppProviders } from "./providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const lora = Lora({
	variable: "--font-lora",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Fire Wave",
	description: "Auto Agent to use computer",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale}>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
			>
				<NextIntlClientProvider messages={messages}>
					<AppProviders>{children}</AppProviders>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
