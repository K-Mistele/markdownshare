import { Button } from "@/src/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card";
import {
	ArrowRightIcon,
	EditIcon,
	EyeIcon,
	LockIcon,
	ShareIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
	return (
		<div className="flex flex-col min-h-screen">
			{/* Navigation */}
			<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-14 items-center">
					<div className="mr-4 hidden md:flex">
						<Link href="/" className="mr-6 flex items-center space-x-2">
							<EditIcon className="h-6 w-6" />
							<span className="hidden font-bold sm:inline-block">
								MarkdownShare
							</span>
						</Link>
					</div>
					<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
						<nav className="flex items-center space-x-6 text-sm font-medium">
							<Link
								href="/docs"
								className="transition-colors hover:text-foreground/80"
							>
								Docs
							</Link>
							<Link
								href="/explore"
								className="transition-colors hover:text-foreground/80"
							>
								Explore
							</Link>
						</nav>
						<div className="flex items-center space-x-2">
							<Button variant="ghost" asChild>
								<Link href="/auth/signin">Sign In</Link>
							</Button>
							<Button asChild>
								<Link href="/auth/signup">Get Started</Link>
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="container flex-1 space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
				<div className="mx-auto flex max-w-[980px] flex-col items-center gap-2 text-center">
					<h1 className="text-3xl font-heading font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
						Collaborative Markdown Editing
						<br className="hidden sm:inline" />
						Made Simple
					</h1>
					<p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
						Create, edit, and share markdown documents with real-time
						collaboration. Support for MDX, syntax highlighting, comments, and
						powerful sharing controls.
					</p>
					<div className="flex gap-4 mt-6">
						<Button size="lg" asChild>
							<Link href="/auth/signup">
								Get Started <ArrowRightIcon className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="/demo">Try Demo</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="container space-y-6 py-8 md:py-12 lg:py-24">
				<div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
					<h2 className="text-3xl font-heading font-bold leading-tight tracking-tighter md:text-5xl">
						Everything you need
					</h2>
					<p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
						Powerful features for modern markdown collaboration
					</p>
				</div>
				<div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
					<Card>
						<CardHeader>
							<UsersIcon className="h-10 w-10 text-primary" />
							<CardTitle>Real-time Collaboration</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Work together with your team in real-time. See cursors,
								selections, and changes as they happen.
							</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<EditIcon className="h-10 w-10 text-primary" />
							<CardTitle>Rich Editor</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Powerful markdown editor with syntax highlighting, live preview,
								and full MDX support.
							</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<ShareIcon className="h-10 w-10 text-primary" />
							<CardTitle>Smart Sharing</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Public, private, or link-only sharing with password protection
								and access controls.
							</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<EyeIcon className="h-10 w-10 text-primary" />
							<CardTitle>Beautiful Rendering</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Syntax-highlighted code blocks, mathematical expressions, and
								rich media support.
							</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<LockIcon className="h-10 w-10 text-primary" />
							<CardTitle>Secure by Default</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Enterprise-grade security with role-based access control and
								data encryption.
							</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<div className="flex items-center space-x-2">
								<div className="h-10 w-10 rounded bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
									MDX
								</div>
							</div>
							<CardTitle>Full MDX Support</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Write interactive content with React components, charts, and
								custom elements.
							</CardDescription>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* CTA Section */}
			<section className="container py-8 md:py-12 lg:py-24">
				<div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
					<h2 className="text-3xl font-heading font-bold leading-tight tracking-tighter md:text-5xl">
						Ready to get started?
					</h2>
					<p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
						Join thousands of teams already using MarkdownShare for their
						documentation and collaboration needs.
					</p>
					<Button size="lg" asChild className="mt-4">
						<Link href="/auth/signup">
							Create Your First Document{" "}
							<ArrowRightIcon className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t py-6 md:py-0">
				<div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
					<div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
						<EditIcon className="h-6 w-6" />
						<p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
							Built with{" "}
							<Link
								href="https://nextjs.org"
								className="font-medium underline underline-offset-4"
							>
								Next.js
							</Link>{" "}
							and{" "}
							<Link
								href="https://ui.shadcn.com"
								className="font-medium underline underline-offset-4"
							>
								shadcn/ui
							</Link>
							.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
