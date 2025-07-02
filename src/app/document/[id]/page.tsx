import { ErrorBoundary } from '@/components/error-boundary'
import { auth } from '@/lib/auth'
import { canUserEditDocument, getDocument } from '@/lib/data'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import { DocumentClient } from './document-client'

interface DocumentPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function DocumentPage({ params }: DocumentPageProps) {
    const { id } = await params

    // Check authentication on server
    const session = await auth.api.getSession({
        headers: await headers()
    })

    // Get the promises but don't await them - pass them to the client component
    const documentPromise = getDocument(id)

    // For edit permission, we need the user ID, so we handle this conditionally
    const canEditPromise = session?.user ? canUserEditDocument(id, session.user.id) : Promise.resolve(false)

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
    )
}
