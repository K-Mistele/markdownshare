import { auth } from "@/lib/auth";
import { getUserDocuments } from "@/lib/data";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const documents = await getUserDocuments(session.user.id);
		return NextResponse.json({ documents });
	} catch (error) {
		console.error("Error fetching documents:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { title, content, visibility = "private" } = body;

		if (!title || !content) {
			return NextResponse.json(
				{ error: "Title and content are required" },
				{ status: 400 },
			);
		}

		const result = await db
			.insert(documents)
			.values({
				title,
				content,
				authorId: session.user.id,
				visibility,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})
			.returning();

		const document = result[0];

		if (!document) {
			return NextResponse.json(
				{ error: "Failed to create document" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ document }, { status: 201 });
	} catch (error) {
		console.error("Error creating document:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
