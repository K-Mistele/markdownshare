import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { getDocument, canUserEditDocument } from "@/src/lib/data";
import { DocumentClient } from "./document-client";
import { ErrorBoundary } from "@/src/components/error-boundary";

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

	// Get the promises but don't await them - pass them to the client component
	const documentPromise = getDocument(params.id);
	
	// For edit permission, we need the user ID, so we handle this conditionally
	const canEditPromise = session?.user 
		? canUserEditDocument(params.id, session.user.id)
		: Promise.resolve(false);

	return (
		<ErrorBoundary>
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
					documentPromise={documentPromise} 
					canEditPromise={canEditPromise}
					user={session?.user || null}
				/>
			</Suspense>
		</ErrorBoundary>
	);
}
