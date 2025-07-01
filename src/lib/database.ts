"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "./auth";
import { db } from "./db";
import { comments, documentCollaborators, documents, users } from "./db/schema";

// Type definitions based on Drizzle schema
type User = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;
type UserUpdate = Partial<UserInsert>;

type Document = typeof documents.$inferSelect;
type DocumentInsert = typeof documents.$inferInsert;
type DocumentUpdate = Partial<DocumentInsert>;

type Comment = typeof comments.$inferSelect;
type CommentInsert = typeof comments.$inferInsert;

type CommentWithUser = {
	id: string;
	documentId: string | null;
	userId: string | null;
	content: string;
	parentCommentId: string | null;
	position: unknown;
	createdAt: string | null;
	updatedAt: string | null;
	user: {
		id: string;
		name: string;
		email: string;
		avatar_url: string | null;
	} | null;
};

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

// Document operations
export const getDocument = cache(
	async (id: string): Promise<Document | null> => {
		// Check if user has access to document
		const user = await getCurrentUser();
		const { canAccess } = await canUserAccessDocument(id, user?.id || null);

		if (!canAccess) {
			throw new Error("Access denied");
		}

		try {
			const result = await db
				.select()
				.from(documents)
				.where(eq(documents.id, id))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			console.error("Error fetching document:", error);
			return null;
		}
	},
);

export const getDocumentWithAuthor = cache(async (id: string) => {
	// Check if user has access to document
	const user = await getCurrentUser();
	const { canAccess } = await canUserAccessDocument(id, user?.id || null);

	if (!canAccess) {
		throw new Error("Access denied");
	}

	try {
		const result = await db
			.select({
				id: documents.id,
				title: documents.title,
				content: documents.content,
				authorId: documents.authorId,
				visibility: documents.visibility,
				passwordHash: documents.passwordHash,
				accessToken: documents.accessToken,
				createdAt: documents.createdAt,
				updatedAt: documents.updatedAt,
				version: documents.version,
				author: {
					id: users.id,
					name: users.name,
					email: users.email,
					avatar_url: users.avatarUrl,
				},
			})
			.from(documents)
			.leftJoin(users, eq(documents.authorId, users.id))
			.where(eq(documents.id, id))
			.limit(1);

		return result[0] || null;
	} catch (error) {
		console.error("Error fetching document with author:", error);
		return null;
	}
});

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

export const getUserDocuments = cache(
	async (userId?: string): Promise<Document[]> => {
		const user = await requireAuth();

		// If no userId provided, get current user's documents
		// If userId provided, verify it matches current user (users can only see their own documents)
		const targetUserId = userId || user.id;
		if (targetUserId !== user.id) {
			throw new Error("Access denied: can only access your own documents");
		}

		try {
			const result = await db
				.select()
				.from(documents)
				.where(eq(documents.authorId, targetUserId))
				.orderBy(desc(documents.updatedAt));

			return result;
		} catch (error) {
			console.error("Error fetching user documents:", error);
			return [];
		}
	},
);

export const getPublicDocuments = cache(
	async (limit = 10): Promise<Document[]> => {
		try {
			const result = await db
				.select()
				.from(documents)
				.where(eq(documents.visibility, "public"))
				.orderBy(desc(documents.updatedAt))
				.limit(limit);

			return result;
		} catch (error) {
			console.error("Error fetching public documents:", error);
			return [];
		}
	},
);

// User operations
export const getUser = cache(async (id: string): Promise<User | null> => {
	const user = await getCurrentUser();

	// Users can only view their own profile or public profiles
	// For now, only allow users to view their own profile
	if (!user || user.id !== id) {
		throw new Error("Access denied: can only view your own profile");
	}

	try {
		const result = await db
			.select()
			.from(users)
			.where(eq(users.id, id))
			.limit(1);

		return result[0] || null;
	} catch (error) {
		console.error("Error fetching user:", error);
		return null;
	}
});

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

// Collaboration operations
export const getDocumentCollaborators = cache(async (documentId: string) => {
	const user = await getCurrentUser();

	// Check if user has access to document
	const { canAccess } = await canUserAccessDocument(
		documentId,
		user?.id || null,
	);
	if (!canAccess) {
		throw new Error("Access denied: cannot view collaborators");
	}

	try {
		const result = await db
			.select({
				id: documentCollaborators.id,
				documentId: documentCollaborators.documentId,
				userId: documentCollaborators.userId,
				permission: documentCollaborators.permission,
				createdAt: documentCollaborators.createdAt,
				user: {
					id: users.id,
					name: users.name,
					email: users.email,
					avatar_url: users.avatarUrl,
				},
			})
			.from(documentCollaborators)
			.leftJoin(users, eq(documentCollaborators.userId, users.id))
			.where(eq(documentCollaborators.documentId, documentId));

		return result;
	} catch (error) {
		console.error("Error fetching collaborators:", error);
		return [];
	}
});

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

// Comments operations
export const getDocumentComments = cache(
	async (documentId: string): Promise<CommentWithUser[]> => {
		const user = await getCurrentUser();

		// Check if user has access to document
		const { canAccess } = await canUserAccessDocument(
			documentId,
			user?.id || null,
		);
		if (!canAccess) {
			throw new Error("Access denied: cannot view comments");
		}

		try {
			const result = await db
				.select({
					id: comments.id,
					documentId: comments.documentId,
					userId: comments.userId,
					content: comments.content,
					parentCommentId: comments.parentCommentId,
					position: comments.position,
					createdAt: comments.createdAt,
					updatedAt: comments.updatedAt,
					user: {
						id: users.id,
						name: users.name,
						email: users.email,
						avatar_url: users.avatarUrl,
					},
				})
				.from(comments)
				.leftJoin(users, eq(comments.userId, users.id))
				.where(eq(comments.documentId, documentId))
				.orderBy(asc(comments.createdAt));

			return result;
		} catch (error) {
			console.error("Error fetching comments:", error);
			return [];
		}
	},
);

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

// Permission checking utilities
export async function canUserAccessDocument(
	documentId: string,
	userId: string | null,
): Promise<{ canAccess: boolean; permission?: "read" | "write" | "admin" }> {
	// Get document directly without access checks to avoid infinite recursion
	try {
		const documentResult = await db
			.select()
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1);

		const document = documentResult[0];
		if (!document) {
			return { canAccess: false };
		}

		// Check if document is public
		if (document.visibility === "public") {
			return { canAccess: true, permission: "read" };
		}

		// If no user, only public documents are accessible
		if (!userId) {
			return { canAccess: false };
		}

		// Check if user is the author
		if (document.authorId === userId) {
			return { canAccess: true, permission: "admin" };
		}

		// Check if user is a collaborator
		const collaborator = await db
			.select({ permission: documentCollaborators.permission })
			.from(documentCollaborators)
			.where(
				and(
					eq(documentCollaborators.documentId, documentId),
					eq(documentCollaborators.userId, userId),
				),
			)
			.limit(1);

		if (collaborator[0]) {
			return {
				canAccess: true,
				permission: collaborator[0].permission as "read" | "write" | "admin",
			};
		}

		return { canAccess: false };
	} catch (error) {
		console.error("Error checking document access:", error);
		return { canAccess: false };
	}
}

export async function canUserEditDocument(
	documentId: string,
	userId: string | null,
): Promise<boolean> {
	if (!userId) return false;

	const { canAccess, permission } = await canUserAccessDocument(
		documentId,
		userId,
	);
	return canAccess && (permission === "write" || permission === "admin");
}
