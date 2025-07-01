export interface User {
	id: string;
	email: string;
	name: string;
	avatar_url?: string;
	created_at: string;
	updated_at: string;
}

export interface Document {
	id: string;
	title: string;
	content: string;
	author_id: string;
	author?: User;
	visibility: "public" | "link_only" | "password_protected" | "private";
	password_hash?: string;
	access_token?: string;
	created_at: string;
	updated_at: string;
	version: number;
	collaborators?: DocumentCollaborator[];
	comments?: Comment[];
}

export interface DocumentCollaborator {
	id: string;
	document_id: string;
	user_id: string;
	user?: User;
	permission: "read" | "write" | "admin";
	created_at: string;
}

export interface Comment {
	id: string;
	document_id: string;
	user_id: string;
	user?: User;
	content: string;
	parent_comment_id?: string;
	parent_comment?: Comment;
	replies?: Comment[];
	position?: {
		line?: number;
		character?: number;
		selection?: {
			start: number;
			end: number;
		};
	};
	created_at: string;
	updated_at: string;
}

export interface DocumentVersion {
	id: string;
	document_id: string;
	content: string;
	version_number: number;
	created_by: string;
	created_by_user?: User;
	created_at: string;
}

export interface EditorState {
	content: string;
	selection?: {
		start: number;
		end: number;
	};
	cursors?: CollaboratorCursor[];
}

export interface CollaboratorCursor {
	user_id: string;
	user?: User;
	position: {
		line: number;
		character: number;
	};
	selection?: {
		start: {
			line: number;
			character: number;
		};
		end: {
			line: number;
			character: number;
		};
	};
}

export interface ShareSettings {
	visibility: Document["visibility"];
	password?: string;
	allowComments: boolean;
	allowEditing: boolean;
	expiresAt?: string;
}

export interface NotificationPreferences {
	email_comments: boolean;
	email_mentions: boolean;
	email_document_shared: boolean;
	push_comments: boolean;
	push_mentions: boolean;
	push_document_shared: boolean;
}
