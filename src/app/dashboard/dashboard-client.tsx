'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Document } from '@/lib/db/schema'
import { EyeIcon, FileTextIcon, LinkIcon, LockIcon, PlusIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface DashboardClientProps {
    documentsPromise: Promise<Document[]>
}

export function DashboardClient({ documentsPromise }: DashboardClientProps) {
    // Use the React 19 'use' hook to unwrap the promise
    // This will suspend the component until the promise resolves
    const documents = use(documentsPromise)

    // Mock data for collaboration counts - this will be replaced with actual data later
    const documentsWithMockCollaborators = documents.map((doc) => ({
        ...doc,
        collaborators: Math.floor(Math.random() * 5) + 1 // Random number for demo
    }))

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'public':
                return <EyeIcon className="h-4 w-4" />
            case 'private':
                return <LockIcon className="h-4 w-4" />
            case 'link_only':
                return <LinkIcon className="h-4 w-4" />
            default:
                return <FileTextIcon className="h-4 w-4" />
        }
    }

    const getVisibilityText = (visibility: string) => {
        switch (visibility) {
            case 'public':
                return 'Public'
            case 'private':
                return 'Private'
            case 'link_only':
                return 'Link Only'
            case 'password_protected':
                return 'Password Protected'
            default:
                return 'Unknown'
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Your Documents</h1>
                    <p className="text-muted-foreground">Create, edit, and share your markdown documents</p>
                </div>
                <Button asChild>
                    <Link href="/document/new">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Document
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {documentsWithMockCollaborators.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <Link href={`/document/${doc.id}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg line-clamp-1">{doc.title}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {doc.updatedAt
                                                ? new Date(doc.updatedAt).toLocaleDateString()
                                                : 'Unknown date'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        {getVisibilityIcon(doc.visibility || 'private')}
                                        <span className="text-xs">
                                            {getVisibilityText(doc.visibility || 'private')}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                    {doc.content.split('\n').find((line) => line.trim() && !line.startsWith('#')) ||
                                        'No preview available'}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <UsersIcon className="h-3 w-3" />
                                        {doc.collaborators} collaborator
                                        {doc.collaborators !== 1 ? 's' : ''}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <FileTextIcon className="h-3 w-3" />
                                        {Math.ceil(doc.content.length / 100)} min read
                                    </div>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>

            {documents.length === 0 && (
                <div className="text-center py-12">
                    <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create your first document to get started with collaborative editing
                    </p>
                    <Button asChild>
                        <Link href="/document/new">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Create Your First Document
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
