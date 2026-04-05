import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
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
	title: "Xuebantong - Smart Learning Platform",
	description:
		"AI-powered learning platform with idioms, language learning, writing enhancement, and Feynman technique",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
			>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
