"use client";

import { MarkdownEditor } from "@/src/components/editor/markdown-editor";
import { updateDocument } from "@/src/lib/actions";
import { useState, useTransition } from "react";

interface Document {
	id: string;
	title: string;
	content: string;
	authorId: string;
	visibility: "public" | "private" | "link_only" | "password_protected";
	createdAt: string;
	updatedAt: string;
}

interface User {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
}

interface DocumentClientProps {
	document: Document;
	canEdit: boolean;
	user: User | null;
}

export function DocumentClient({ document, canEdit, user }: DocumentClientProps) {
	const [saving, setSaving] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [localDocument, setLocalDocument] = useState(document);

	const handleSave = async (content: string, title: string) => {
		if (!canEdit) {
			console.warn("User cannot edit this document");
			return;
		}

		setSaving(true);
		try {
			// Use server action for updating document
			startTransition(async () => {
				const updatedDocument = await updateDocument(document.id, { 
					title, 
					content 
				});
				
				if (updatedDocument) {
					setLocalDocument(updatedDocument);
				} else {
					throw new Error("Failed to save document");
				}
			});
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
		setLocalDocument(prev => ({ ...prev, content }));
	};

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<MarkdownEditor
				initialContent={localDocument.content}
				title={localDocument.title}
				onSave={handleSave}
				onContentChange={handleContentChange}
				readOnly={!canEdit}
			/>
		</div>
	);
}