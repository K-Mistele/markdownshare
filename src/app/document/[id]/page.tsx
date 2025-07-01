"use client";

import { MarkdownEditor } from "@/src/components/editor/markdown-editor";
import { authClient } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DocumentPageProps {
	params: {
		id: string;
	};
}

interface Document {
	id: string;
	title: string;
	content: string;
	author_id: string;
	visibility: "public" | "private" | "link_only" | "password_protected";
	created_at: string;
	updated_at: string;
}

export default function DocumentPage({ params }: DocumentPageProps) {
	const [document, setDocument] = useState<Document | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [user, setUser] = useState<any>(null);
	const [canEdit, setCanEdit] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const checkAuthAndFetch = async () => {
			const session = await authClient.getSession();
			if (session?.data) {
				setUser(session.data.user);
			}
			await fetchDocument();
		};

		checkAuthAndFetch();
	}, [params.id]);

	const fetchDocument = async () => {
		try {
			const response = await fetch(`/api/documents/${params.id}`);
			if (response.ok) {
				const data = await response.json();
				setDocument(data.document);

				// Check if user can edit (author or has write permission)
				const session = await authClient.getSession();
				if (session?.data) {
					setCanEdit(data.document.author_id === session.data.user.id);
				}
			} else if (response.status === 404) {
				router.push("/dashboard");
			} else if (response.status === 401) {
				router.push("/auth/signin");
			}
		} catch (error) {
			console.error("Error fetching document:", error);
			router.push("/dashboard");
		} finally {
			setLoading(false);
		}
	};

	// Mock document data for fallback
	const mockDocument = document || {
		id: params.id,
		title: "Sample Document",
		content: `# Welcome to MarkdownShare

This is a collaborative markdown editor with real-time features.

## Features

- **Real-time collaboration** - Work together with your team
- **Rich markdown support** - Write beautiful documents
- **Comments and mentions** - Discuss and review content
- **Flexible sharing** - Control who can view and edit

## Getting Started

Start editing this document to see the collaboration features in action!

\`\`\`typescript
// You can even include code blocks
function hello(name: string) {
  return \`Hello, \${name}!\`
}
\`\`\`

> This is a blockquote to show more markdown features.

### Todo List

- [x] Set up the editor
- [ ] Add real-time collaboration
- [ ] Implement comments
- [ ] Add sharing controls

**Happy editing!** 🚀`,
		author_id: "user-1",
		visibility: "private" as const,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	const handleSave = async (content: string, title: string) => {
		if (!canEdit) {
			console.warn("User cannot edit this document");
			return;
		}

		setSaving(true);
		try {
			const response = await fetch(`/api/documents/${params.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title, content }),
			});

			if (response.ok) {
				const data = await response.json();
				setDocument(data.document);
			} else {
				throw new Error("Failed to save document");
			}
		} catch (error) {
			console.error("Error saving document:", error);
			throw error;
		} finally {
			setSaving(false);
		}
	};

	const handleContentChange = (content: string) => {
		// This will handle real-time synchronization in the future
		// For now, we'll just update local state
		if (document) {
			setDocument({ ...document, content });
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-6xl">
				<div className="flex items-center justify-center h-64">
					<div className="text-muted-foreground">Loading document...</div>
				</div>
			</div>
		);
	}

	if (!document) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-6xl">
				<div className="flex items-center justify-center h-64">
					<div className="text-muted-foreground">Document not found</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<MarkdownEditor
				initialContent={document.content}
				title={document.title}
				onSave={handleSave}
				onContentChange={handleContentChange}
				readOnly={!canEdit}
			/>
		</div>
	);
}
