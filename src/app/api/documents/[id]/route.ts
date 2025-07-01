import { auth } from "@/src/lib/auth";
import {
	canUserAccessDocument,
	canUserEditDocument,
	getDocument,
} from "@/src/lib/data";
import { db } from "@/src/lib/db";
import { documents } from "@/src/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: {
		id: string;
	};
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		const userId = session?.user?.id || null;
		const { canAccess } = await canUserAccessDocument(params.id, userId);

		if (!canAccess) {
			return NextResponse.json(
				{ error: "Document not found or access denied" },
				{ status: 404 },
			);
		}

		const document = await getDocument(params.id);
		if (!document) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ document });
	} catch (error) {
		console.error("Error fetching document:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if user can edit this document
		const canEdit = await canUserEditDocument(params.id, session.user.id);
		if (!canEdit) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const { title, content, visibility } = body;

		const updates: any = { updatedAt: new Date().toISOString() };
		if (title !== undefined) updates.title = title;
		if (content !== undefined) updates.content = content;
		if (visibility !== undefined) updates.visibility = visibility;

		// Direct database update
		const result = await db
			.update(documents)
			.set(updates)
			.where(eq(documents.id, params.id))
			.returning();

		const document = result[0];
		if (!document) {
			return NextResponse.json(
				{ error: "Failed to update document" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ document });
	} catch (error) {
		console.error("Error updating document:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if document exists and get its author
		const document = await getDocument(params.id);
		if (!document) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 },
			);
		}

		// Only the author can delete a document
		if (document.authorId !== session.user.id) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Direct database delete
		await db.delete(documents).where(eq(documents.id, params.id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting document:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
