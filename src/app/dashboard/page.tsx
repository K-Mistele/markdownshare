import { ErrorBoundary } from '@/components/error-boundary'
import { auth } from '@/lib/auth'
import { getUserDocuments } from '@/lib/data'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
    // Check authentication on server
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect('/auth/signin')
    }

    // Get the promise but don't await it - pass it to the client component
    const documentsPromise = getUserDocuments(session.user.id)

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
                <DashboardClient documentsPromise={documentsPromise} />
            </Suspense>
        </ErrorBoundary>
    )
}
