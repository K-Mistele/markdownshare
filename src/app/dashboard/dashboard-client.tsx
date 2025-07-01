"use client";

import { Button } from "@/src/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/src/components/ui/card";
import {
	EyeIcon,
	FileTextIcon,
	LinkIcon,
	LockIcon,
	PlusIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";

interface Document {
	id: string;
	title: string;
	content: string;
	visibility: "public" | "private" | "link_only" | "password_protected";
	updatedAt: string;
	authorId: string;
	createdAt: string;
	version: number;
}

interface User {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
}

interface DashboardClientProps {
	documents: Document[];
	user: User;
}

export function DashboardClient({ documents, user }: DashboardClientProps) {
	// Mock data for collaboration counts - this will be replaced with actual data later
	const documentsWithMockCollaborators = documents.map((doc) => ({
		...doc,
		collaborators: Math.floor(Math.random() * 5) + 1, // Random number for demo
	}));

	const getVisibilityIcon = (visibility: string) => {
		switch (visibility) {
			case "public":
				return <EyeIcon className="h-4 w-4" />;
			case "private":
				return <LockIcon className="h-4 w-4" />;
			case "link_only":
				return <LinkIcon className="h-4 w-4" />;
			default:
				return <FileTextIcon className="h-4 w-4" />;
		}
	};

	const getVisibilityText = (visibility: string) => {
		switch (visibility) {
			case "public":
				return "Public";
			case "private":
				return "Private";
			case "link_only":
				return "Link Only";
			case "password_protected":
				return "Password Protected";
			default:
				return "Unknown";
		}
	};

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Your Documents</h1>
					<p className="text-muted-foreground">
						Create, edit, and share your markdown documents
					</p>
				</div>
				<Button asChild>
					<Link href="/document/new">
						<PlusIcon className="h-4 w-4 mr-2" />
						New Document
					</Link>
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{documentsWithMockCollaborators.map((doc) => (
					<Card
						key={doc.id}
						className="hover:shadow-md transition-shadow cursor-pointer"
					>
						<Link href={`/document/${doc.id}`}>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg line-clamp-1">
											{doc.title}
										</CardTitle>
										<CardDescription className="mt-1">
											{new Date(doc.updatedAt).toLocaleDateString()}
										</CardDescription>
									</div>
									<div className="flex items-center gap-2 text-muted-foreground">
										{getVisibilityIcon(doc.visibility)}
										<span className="text-xs">
											{getVisibilityText(doc.visibility)}
										</span>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-sm text-muted-foreground line-clamp-3 mb-4">
									{doc.content
										.split("\n")
										.find((line) => line.trim() && !line.startsWith("#")) ||
										"No preview available"}
								</div>
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<div className="flex items-center gap-1">
										<UsersIcon className="h-3 w-3" />
										{doc.collaborators} collaborator
										{doc.collaborators !== 1 ? "s" : ""}
									</div>
									<div className="flex items-center gap-1">
										<FileTextIcon className="h-3 w-3" />
										{Math.ceil(doc.content.length / 100)} min read
									</div>
								</div>
							</CardContent>
						</Link>
					</Card>
				))}
			</div>

			{documents.length === 0 && (
				<div className="text-center py-12">
					<FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">No documents yet</h3>
					<p className="text-muted-foreground mb-4">
						Create your first document to get started with collaborative editing
					</p>
					<Button asChild>
						<Link href="/document/new">
							<PlusIcon className="h-4 w-4 mr-2" />
							Create Your First Document
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}