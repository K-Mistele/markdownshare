import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { getDocument, canUserEditDocument } from "@/src/lib/data";
import { DocumentClient } from "./document-client";

interface DocumentPageProps {
	params: {
		id: string;
	};
}

export default async function DocumentPage({ params }: DocumentPageProps) {
	// Check authentication on server
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// For document access, we'll let the getDocument function handle authorization
	// since some documents might be public

	try {
		// Fetch document data on server
		const document = await getDocument(params.id);

		if (!document) {
			notFound();
		}

		// Check if user can edit
		const canEdit = session?.user 
			? await canUserEditDocument(params.id, session.user.id)
			: false;

		return (
			<Suspense
				fallback={
					<div className="container mx-auto py-8 px-4 max-w-6xl">
						<div className="flex items-center justify-center h-64">
							<div className="text-muted-foreground">Loading document...</div>
						</div>
					</div>
				}
			>
				<DocumentClient 
					document={document} 
					canEdit={canEdit}
					user={session?.user || null}
				/>
			</Suspense>
		);
	} catch (error) {
		console.error("Error loading document:", error);
		// If it's an access denied error, redirect to sign in
		if (error instanceof Error && error.message.includes("Access denied")) {
			redirect("/auth/signin");
		}
		notFound();
	}
}
