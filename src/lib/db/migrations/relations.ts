import { relations } from "drizzle-orm/relations";
import { users, documents, documentCollaborators, comments, documentVersions } from "./schema";

export const documentsRelations = relations(documents, ({one, many}) => ({
	user: one(users, {
		fields: [documents.authorId],
		references: [users.id]
	}),
	documentCollaborators: many(documentCollaborators),
	comments: many(comments),
	documentVersions: many(documentVersions),
}));

export const usersRelations = relations(users, ({many}) => ({
	documents: many(documents),
	documentCollaborators: many(documentCollaborators),
	comments: many(comments),
	documentVersions: many(documentVersions),
}));

export const documentCollaboratorsRelations = relations(documentCollaborators, ({one}) => ({
	document: one(documents, {
		fields: [documentCollaborators.documentId],
		references: [documents.id]
	}),
	user: one(users, {
		fields: [documentCollaborators.userId],
		references: [users.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	document: one(documents, {
		fields: [comments.documentId],
		references: [documents.id]
	}),
	comment: one(comments, {
		fields: [comments.parentCommentId],
		references: [comments.id],
		relationName: "comments_parentCommentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentCommentId_comments_id"
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const documentVersionsRelations = relations(documentVersions, ({one}) => ({
	user: one(users, {
		fields: [documentVersions.createdBy],
		references: [users.id]
	}),
	document: one(documents, {
		fields: [documentVersions.documentId],
		references: [documents.id]
	}),
}));