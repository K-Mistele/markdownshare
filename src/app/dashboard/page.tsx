import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { getUserDocuments } from "@/src/lib/data";
import { DashboardClient } from "./dashboard-client";
import { ErrorBoundary } from "@/src/components/error-boundary";

export default async function DashboardPage() {
	// Check authentication on server
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/signin");
	}

	// Get the promise but don't await it - pass it to the client component
	const documentsPromise = getUserDocuments(session.user.id);

	return (
		<ErrorBoundary>
			<Suspense
				fallback={
					<div className="container mx-auto py-8 px-4">
						<div className="flex items-center justify-center h-64">
							<div className="text-muted-foreground">Loading your documents...</div>
						</div>
					</div>
				}
			>
				<DashboardClient documentsPromise={documentsPromise} user={session.user} />
			</Suspense>
		</ErrorBoundary>
	);
}
