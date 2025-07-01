import { relations, sql } from "drizzle-orm";
import {
	boolean,
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

// Better Auth tables (using existing users table structure)
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	avatarUrl: text("avatar_url"),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// Existing application tables (from introspection)
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
	],
);

// Relations
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	documents: many(documents),
	collaborations: many(documentCollaborators),
	comments: many(comments),
	versions: many(documentVersions),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
	author: one(users, {
		fields: [documents.authorId],
		references: [users.id],
	}),
	collaborators: many(documentCollaborators),
	comments: many(comments),
	versions: many(documentVersions),
}));

export const documentCollaboratorsRelations = relations(
	documentCollaborators,
	({ one }) => ({
		document: one(documents, {
			fields: [documentCollaborators.documentId],
			references: [documents.id],
		}),
		user: one(users, {
			fields: [documentCollaborators.userId],
			references: [users.id],
		}),
	}),
);

export const commentsRelations = relations(comments, ({ one }) => ({
	document: one(documents, {
		fields: [comments.documentId],
		references: [documents.id],
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id],
	}),
}));

export const documentVersionsRelations = relations(
	documentVersions,
	({ one }) => ({
		document: one(documents, {
			fields: [documentVersions.documentId],
			references: [documents.id],
		}),
		createdBy: one(users, {
			fields: [documentVersions.createdBy],
			references: [users.id],
		}),
	}),
);
