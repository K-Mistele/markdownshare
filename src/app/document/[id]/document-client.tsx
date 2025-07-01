"use client";

import { use } from "react";
import { MarkdownEditor } from "@/src/components/editor/markdown-editor";
import { updateDocument } from "@/src/lib/actions";
import { useState } from "react";

interface Document {
	id: string;
	title: string;
	content: string;
	authorId: string | null;
	visibility: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}

interface User {
	id: string;
	name: string;
	email: string;
	avatarUrl?: string;
}

interface DocumentClientProps {
	documentPromise: Promise<Document | null>;
	canEditPromise: Promise<boolean>;
	user: User | null;
}

export function DocumentClient({ documentPromise, canEditPromise, user }: DocumentClientProps) {
	const [saving, setSaving] = useState(false);

	// Use the React 19 'use' hook to unwrap the promises
	// These will suspend the component until the promises resolve
	const document = use(documentPromise);
	const canEdit = use(canEditPromise);

	// Handle document not found
	if (!document) {
		throw new Error("Document not found");
	}

	const [localDocument, setLocalDocument] = useState(document);

	const handleSave = async (content: string, title: string) => {
		if (!canEdit) {
			console.warn("User cannot edit this document");
			return;
		}

		setSaving(true);
		try {
			// Use server action for updating document directly
			const updatedDocument = await updateDocument(document.id, { 
				title, 
				content 
			});
			
			if (updatedDocument) {
				setLocalDocument(updatedDocument);
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