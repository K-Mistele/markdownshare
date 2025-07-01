import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "@/src/components/providers";
import { ThemeProvider } from "@/src/components/theme-provider";
import { Toaster } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "MarkdownShare - Collaborative Markdown Editor",
	description:
		"Create, edit, and share markdown documents with real-time collaboration",
	keywords: ["markdown", "editor", "collaboration", "sharing", "MDX"],
	authors: [{ name: "MarkdownShare" }],
	creator: "MarkdownShare",
	openGraph: {
		type: "website",
		locale: "en_US",
		url: "https://markdownshare.app",
		title: "MarkdownShare - Collaborative Markdown Editor",
		description:
			"Create, edit, and share markdown documents with real-time collaboration",
		siteName: "MarkdownShare",
	},
	twitter: {
		card: "summary_large_image",
		title: "MarkdownShare - Collaborative Markdown Editor",
		description:
			"Create, edit, and share markdown documents with real-time collaboration",
		creator: "@markdownshare",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={cn(
					inter.className,
					"min-h-screen bg-background antialiased",
				)}
			>
				<Providers>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<div className="relative flex min-h-screen flex-col">
							<div className="flex-1">{children}</div>
						</div>
						<Toaster />
					</ThemeProvider>
				</Providers>
			</body>
		</html>
	);
}
