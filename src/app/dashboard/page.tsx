import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/src/lib/auth";
import { getUserDocuments } from "@/src/lib/data";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
	// Check authentication on server
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		redirect("/auth/signin");
	}

	// Fetch user's documents on server
	const documents = await getUserDocuments(session.user.id);

	return (
		<Suspense
			fallback={
				<div className="container mx-auto py-8 px-4">
					<div className="flex items-center justify-center h-64">
						<div className="text-muted-foreground">Loading your documents...</div>
					</div>
				</div>
			}
		>
			<DashboardClient documents={documents} user={session.user} />
		</Suspense>
	);
}
