import { auth } from "@/src/lib/auth";
import {
	canUserAccessDocument,
	canUserEditDocument,
	getDocument,
} from "@/src/lib/data";
import {
	deleteDocument,
	updateDocument,
} from "@/src/lib/actions";
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
		const body = await request.json();
		const { title, content, visibility } = body;

		const updates: any = {};
		if (title !== undefined) updates.title = title;
		if (content !== undefined) updates.content = content;
		if (visibility !== undefined) updates.visibility = visibility;

		// Use server action for updating document (handles auth internally)
		const document = await updateDocument(params.id, updates);
		if (!document) {
			return NextResponse.json(
				{ error: "Failed to update document" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ document });
	} catch (error) {
		console.error("Error updating document:", error);
		if (error instanceof Error && error.message.includes("Authentication required")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (error instanceof Error && error.message.includes("Access denied")) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		// Use server action for deleting document (handles auth internally)
		const success = await deleteDocument(params.id);
		if (!success) {
			return NextResponse.json(
				{ error: "Failed to delete document" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting document:", error);
		if (error instanceof Error && error.message.includes("Authentication required")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (error instanceof Error && error.message.includes("Access denied")) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
