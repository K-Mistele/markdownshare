"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { comments, documentCollaborators, documents, users } from "./db/schema";
import { canUserAccessDocument, canUserEditDocument } from "./data";

// Type definitions based on Drizzle schema
type User = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;
type UserUpdate = Partial<UserInsert>;

type Document = typeof documents.$inferSelect;
type DocumentInsert = typeof documents.$inferInsert;
type DocumentUpdate = Partial<DocumentInsert>;

type Comment = typeof comments.$inferSelect;
type CommentInsert = typeof comments.$inferInsert;

type DocumentCollaborator = typeof documentCollaborators.$inferSelect;

// Helper function to get current user session
async function getCurrentUser() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	return session?.user || null;
}

// Helper function to require authentication
async function requireAuth() {
	const user = await getCurrentUser();
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}

// Document mutation operations
export async function createDocument(
	document: DocumentInsert,
): Promise<Document | null> {
	const user = await requireAuth();

	// Ensure the document is created by the authenticated user
	const documentWithAuthor = {
		...document,
		authorId: user.id,
	};

	try {
		const result = await db
			.insert(documents)
			.values(documentWithAuthor)
			.returning();

		return result[0] || null;
	} catch (error) {
		console.error("Error creating document:", error);
		return null;
	}
}

export async function updateDocument(
	id: string,
	updates: DocumentUpdate,
): Promise<Document | null> {
	const user = await requireAuth();

	// Check if user can edit this document
	const canEdit = await canUserEditDocument(id, user.id);
	if (!canEdit) {
		throw new Error("Access denied: insufficient permissions to edit document");
	}

	try {
		const result = await db
			.update(documents)
			.set({ ...updates, updatedAt: new Date().toISOString() })
			.where(eq(documents.id, id))
			.returning();

		return result[0] || null;
	} catch (error) {
		console.error("Error updating document:", error);
		return null;
	}
}

export async function deleteDocument(id: string): Promise<boolean> {
	const user = await requireAuth();

	try {
		// Only the author can delete a document
		const document = await db
			.select({ authorId: documents.authorId })
			.from(documents)
			.where(eq(documents.id, id))
			.limit(1);

		if (!document[0]) {
			console.error("Document not found");
			return false;
		}

		if (document[0].authorId !== user.id) {
			throw new Error("Access denied: only document author can delete");
		}

		await db.delete(documents).where(eq(documents.id, id));
		return true;
	} catch (error) {
		console.error("Error deleting document:", error);
		return false;
	}
}

// User mutation operations
export async function createUser(user: UserInsert): Promise<User | null> {
	// This should typically only be called by the auth system
	// For additional security, we could add a service role check here
	try {
		const result = await db.insert(users).values(user).returning();
		return result[0] || null;
	} catch (error) {
		console.error("Error creating user:", error);
		return null;
	}
}

export async function updateUser(
	id: string,
	updates: UserUpdate,
): Promise<User | null> {
	const user = await requireAuth();

	// Users can only update their own profile
	if (user.id !== id) {
		throw new Error("Access denied: can only update your own profile");
	}

	try {
		const result = await db
			.update(users)
			.set({ ...updates, updatedAt: new Date().toISOString() })
			.where(eq(users.id, id))
			.returning();

		return result[0] || null;
	} catch (error) {
		console.error("Error updating user:", error);
		return null;
	}
}

// Collaboration mutation operations
export async function addCollaborator(
	documentId: string,
	userId: string,
	permission: "read" | "write" | "admin",
): Promise<DocumentCollaborator | null> {
	const user = await requireAuth();

	try {
		// Check if user owns the document or is an admin collaborator
		const document = await db
			.select({ authorId: documents.authorId })
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1);

		if (!document[0]) {
			console.error("Document not found");
			return null;
		}

		const isAuthor = document[0].authorId === user.id;

		if (!isAuthor) {
			// Check if user is an admin collaborator
			const collaboration = await db
				.select({ permission: documentCollaborators.permission })
				.from(documentCollaborators)
				.where(
					and(
						eq(documentCollaborators.documentId, documentId),
						eq(documentCollaborators.userId, user.id),
					),
				)
				.limit(1);

			if (!collaboration[0] || collaboration[0].permission !== "admin") {
				throw new Error(
					"Access denied: only document author or admin collaborators can add collaborators",
				);
			}
		}

		const result = await db
			.insert(documentCollaborators)
			.values({
				documentId,
				userId,
				permission,
			})
			.returning();

		return result[0] || null;
	} catch (error) {
		console.error("Error adding collaborator:", error);
		return null;
	}
}

export async function updateCollaboratorPermission(
	documentId: string,
	userId: string,
	permission: "read" | "write" | "admin",
): Promise<boolean> {
	const user = await requireAuth();

	try {
		// Check if user owns the document or is an admin collaborator
		const document = await db
			.select({ authorId: documents.authorId })
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1);

		if (!document[0]) {
			console.error("Document not found");
			return false;
		}

		const isAuthor = document[0].authorId === user.id;

		if (!isAuthor) {
			// Check if user is an admin collaborator
			const collaboration = await db
				.select({ permission: documentCollaborators.permission })
				.from(documentCollaborators)
				.where(
					and(
						eq(documentCollaborators.documentId, documentId),
						eq(documentCollaborators.userId, user.id),
					),
				)
				.limit(1);

			if (!collaboration[0] || collaboration[0].permission !== "admin") {
				throw new Error(
					"Access denied: only document author or admin collaborators can update permissions",
				);
			}
		}

		await db
			.update(documentCollaborators)
			.set({ permission })
			.where(
				and(
					eq(documentCollaborators.documentId, documentId),
					eq(documentCollaborators.userId, userId),
				),
			);

		return true;
	} catch (error) {
		console.error("Error updating collaborator permission:", error);
		return false;
	}
}

export async function removeCollaborator(
	documentId: string,
	userId: string,
): Promise<boolean> {
	const user = await requireAuth();

	try {
		// Check if user owns the document or is an admin collaborator, or is removing themselves
		const document = await db
			.select({ authorId: documents.authorId })
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1);

		if (!document[0]) {
			console.error("Document not found");
			return false;
		}

		const isAuthor = document[0].authorId === user.id;
		const isRemovingSelf = userId === user.id;

		if (!isAuthor && !isRemovingSelf) {
			// Check if user is an admin collaborator
			const collaboration = await db
				.select({ permission: documentCollaborators.permission })
				.from(documentCollaborators)
				.where(
					and(
						eq(documentCollaborators.documentId, documentId),
						eq(documentCollaborators.userId, user.id),
					),
				)
				.limit(1);

			if (!collaboration[0] || collaboration[0].permission !== "admin") {
				throw new Error(
					"Access denied: only document author, admin collaborators, or the collaborator themselves can remove collaborators",
				);
			}
		}

		await db
			.delete(documentCollaborators)
			.where(
				and(
					eq(documentCollaborators.documentId, documentId),
					eq(documentCollaborators.userId, userId),
				),
			);

		return true;
	} catch (error) {
		console.error("Error removing collaborator:", error);
		return false;
	}
}

// Comment mutation operations
export async function createComment(
	comment: CommentInsert,
): Promise<Comment | null> {
	const user = await requireAuth();

	// Check if user has access to document
	if (!comment.documentId) {
		throw new Error("Document ID is required");
	}

	const { canAccess } = await canUserAccessDocument(
		comment.documentId,
		user.id,
	);
	if (!canAccess) {
		throw new Error("Access denied: cannot comment on this document");
	}

	// Ensure the comment is created by the authenticated user
	const commentWithUser = {
		...comment,
		userId: user.id,
	};

	try {
		const result = await db
			.insert(comments)
			.values(commentWithUser)
			.returning();
		return result[0] || null;
	} catch (error) {
		console.error("Error creating comment:", error);
		return null;
	}
}

export async function updateComment(
	id: string,
	content: string,
): Promise<Comment | null> {
	const user = await requireAuth();

	try {
		// Check if user owns the comment
		const comment = await db
			.select({ userId: comments.userId, documentId: comments.documentId })
			.from(comments)
			.where(eq(comments.id, id))
			.limit(1);

		if (!comment[0]) {
			console.error("Comment not found");
			return null;
		}

		if (comment[0].userId !== user.id) {
			throw new Error("Access denied: can only update your own comments");
		}

		const result = await db
			.update(comments)
			.set({
				content,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(comments.id, id))
			.returning();

		return result[0] || null;
	} catch (error) {
		console.error("Error updating comment:", error);
		return null;
	}
}

export async function deleteComment(id: string): Promise<boolean> {
	const user = await requireAuth();

	try {
		// Check if user owns the comment or owns the document
		const comment = await db
			.select({ userId: comments.userId, documentId: comments.documentId })
			.from(comments)
			.where(eq(comments.id, id))
			.limit(1);

		if (!comment[0]) {
			console.error("Comment not found");
			return false;
		}

		const isCommentOwner = comment[0].userId === user.id;

		if (!isCommentOwner) {
			// Check if user owns the document
			if (!comment[0].documentId) {
				throw new Error("Comment document ID is missing");
			}

			const document = await db
				.select({ authorId: documents.authorId })
				.from(documents)
				.where(eq(documents.id, comment[0].documentId))
				.limit(1);

			if (!document[0] || document[0].authorId !== user.id) {
				throw new Error(
					"Access denied: can only delete your own comments or comments on your documents",
				);
			}
		}

		await db.delete(comments).where(eq(comments.id, id));
		return true;
	} catch (error) {
		console.error("Error deleting comment:", error);
		return false;
	}
}