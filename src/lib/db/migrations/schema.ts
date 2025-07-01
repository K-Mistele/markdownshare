import { sql } from "drizzle-orm";
import {
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
	"users",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		email: text().notNull(),
		name: text().notNull(),
		avatarUrl: text("avatar_url"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		unique("users_email_key").on(table.email),
		pgPolicy("Users can view their own profile", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`((auth.uid())::text = (id)::text)`,
		}),
		pgPolicy("Users can update their own profile", {
			as: "permissive",
			for: "update",
			to: ["public"],
		}),
	],
);

export const documents = pgTable(
	"documents",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		title: text().notNull(),
		content: text().default("").notNull(),
		authorId: uuid("author_id"),
		visibility: text().default("private"),
		passwordHash: text("password_hash"),
		accessToken: text("access_token"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		version: integer().default(1),
	},
	(table) => [
		index("idx_documents_author_id").using(
			"btree",
			table.authorId.asc().nullsLast().op("uuid_ops"),
		),
		index("idx_documents_updated_at").using(
			"btree",
			table.updatedAt.desc().nullsFirst().op("timestamptz_ops"),
		),
		index("idx_documents_visibility").using(
			"btree",
			table.visibility.asc().nullsLast().op("text_ops"),
		),
		foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "documents_author_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("Authors can view their own documents", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`((author_id)::text = (auth.uid())::text)`,
		}),
		pgPolicy("Public documents are viewable by everyone", {
			as: "permissive",
			for: "select",
			to: ["public"],
		}),
		pgPolicy("Link-only documents are viewable by everyone", {
			as: "permissive",
			for: "select",
			to: ["public"],
		}),
		pgPolicy("Collaborators can view shared documents", {
			as: "permissive",
			for: "select",
			to: ["public"],
		}),
		pgPolicy("Authors can update their own documents", {
			as: "permissive",
			for: "update",
			to: ["public"],
		}),
		pgPolicy("Write collaborators can update documents", {
			as: "permissive",
			for: "update",
			to: ["public"],
		}),
		pgPolicy("Authors can delete their own documents", {
			as: "permissive",
			for: "delete",
			to: ["public"],
		}),
		pgPolicy("Authors can insert documents", {
			as: "permissive",
			for: "insert",
			to: ["public"],
		}),
		check(
			"documents_visibility_check",
			sql`visibility = ANY (ARRAY['public'::text, 'link_only'::text, 'password_protected'::text, 'private'::text])`,
		),
	],
);

export const documentCollaborators = pgTable(
	"document_collaborators",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		documentId: uuid("document_id"),
		userId: uuid("user_id"),
		permission: text().default("read"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("idx_document_collaborators_document_id").using(
			"btree",
			table.documentId.asc().nullsLast().op("uuid_ops"),
		),
		index("idx_document_collaborators_user_id").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.id],
			name: "document_collaborators_document_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "document_collaborators_user_id_fkey",
		}).onDelete("cascade"),
		unique("document_collaborators_document_id_user_id_key").on(
			table.documentId,
			table.userId,
		),
		pgPolicy("Collaborators can view document collaborations", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`(((user_id)::text = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = document_collaborators.document_id) AND ((documents.author_id)::text = (auth.uid())::text)))))`,
		}),
		pgPolicy("Document authors can manage collaborators", {
			as: "permissive",
			for: "all",
			to: ["public"],
		}),
		check(
			"document_collaborators_permission_check",
			sql`permission = ANY (ARRAY['read'::text, 'write'::text, 'admin'::text])`,
		),
	],
);

export const comments = pgTable(
	"comments",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		documentId: uuid("document_id"),
		userId: uuid("user_id"),
		content: text().notNull(),
		parentCommentId: uuid("parent_comment_id"),
		position: jsonb(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("idx_comments_document_id").using(
			"btree",
			table.documentId.asc().nullsLast().op("uuid_ops"),
		),
		index("idx_comments_user_id").using(
			"btree",
			table.userId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.id],
			name: "comments_document_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "comments_parent_comment_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("Users can view comments on accessible documents", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`(EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = comments.document_id) AND ((documents.visibility = 'public'::text) OR (documents.visibility = 'link_only'::text) OR ((documents.author_id)::text = (auth.uid())::text) OR (EXISTS ( SELECT 1
           FROM document_collaborators
          WHERE ((document_collaborators.document_id = documents.id) AND ((document_collaborators.user_id)::text = (auth.uid())::text))))))))`,
		}),
		pgPolicy("Users can create comments on accessible documents", {
			as: "permissive",
			for: "insert",
			to: ["public"],
		}),
		pgPolicy("Users can update their own comments", {
			as: "permissive",
			for: "update",
			to: ["public"],
		}),
		pgPolicy("Users can delete their own comments", {
			as: "permissive",
			for: "delete",
			to: ["public"],
		}),
	],
);

export const documentVersions = pgTable(
	"document_versions",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		documentId: uuid("document_id"),
		content: text().notNull(),
		versionNumber: integer("version_number").notNull(),
		createdBy: uuid("created_by"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("idx_document_versions_document_id").using(
			"btree",
			table.documentId.asc().nullsLast().op("uuid_ops"),
		),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "document_versions_created_by_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.documentId],
			foreignColumns: [documents.id],
			name: "document_versions_document_id_fkey",
		}).onDelete("cascade"),
		pgPolicy("Users can view versions of accessible documents", {
			as: "permissive",
			for: "select",
			to: ["public"],
			using: sql`(EXISTS ( SELECT 1
   FROM documents
  WHERE ((documents.id = document_versions.document_id) AND (((documents.author_id)::text = (auth.uid())::text) OR (EXISTS ( SELECT 1
           FROM document_collaborators
          WHERE ((document_collaborators.document_id = documents.id) AND ((document_collaborators.user_id)::text = (auth.uid())::text))))))))`,
		}),
		pgPolicy("Users can create versions for documents they can edit", {
			as: "permissive",
			for: "insert",
			to: ["public"],
		}),
	],
);
