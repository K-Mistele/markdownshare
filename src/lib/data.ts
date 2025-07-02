import { and, asc, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { cache } from 'react'
import { auth } from './auth'
import { db } from './db'
import { comments, documentCollaborators, documents, user } from './db/schema'

// Type definitions based on Drizzle schema
type User = typeof user.$inferSelect
type Document = typeof documents.$inferSelect
type Comment = typeof comments.$inferSelect

type CommentWithUser = {
    id: string
    documentId: string | null
    userId: string | null
    content: string
    parentCommentId: string | null
    position: unknown
    createdAt: string | null
    updatedAt: string | null
    user: {
        id: string
        name: string
        email: string
        avatar_url: string | null
    } | null
}

// Helper function to get current user session
async function getCurrentUser() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    return session?.user || null
}

// Helper function to require authentication
async function requireAuth() {
    const user = await getCurrentUser()
    if (!user) {
        throw new Error('Authentication required')
    }
    return user
}

// Document data fetching operations
export const getDocument = cache(async (id: string): Promise<Document | null> => {
    // Check if user has access to document
    const user = await getCurrentUser()
    const { canAccess } = await canUserAccessDocument(id, user?.id || null)

    if (!canAccess) {
        throw new Error('Access denied')
    }

    try {
        const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1)

        return result[0] || null
    } catch (error) {
        console.error('Error fetching document:', error)
        return null
    }
})

export const getDocumentWithAuthor = cache(async (id: string) => {
    // Check if user has access to document
    const currentUser = await getCurrentUser()
    const { canAccess } = await canUserAccessDocument(id, currentUser?.id || null)

    if (!canAccess) {
        throw new Error('Access denied')
    }

    try {
        const result = await db
            .select({
                id: documents.id,
                title: documents.title,
                content: documents.content,
                authorId: documents.authorId,
                visibility: documents.visibility,
                passwordHash: documents.passwordHash,
                accessToken: documents.accessToken,
                createdAt: documents.createdAt,
                updatedAt: documents.updatedAt,
                version: documents.version,
                author: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar_url: user.avatar_url
                }
            })
            .from(documents)
            .leftJoin(user, eq(documents.authorId, user.id))
            .where(eq(documents.id, id))
            .limit(1)

        return result[0] || null
    } catch (error) {
        console.error('Error fetching document with author:', error)
        return null
    }
})

export const getUserDocuments = cache(async (userId?: string): Promise<Document[]> => {
    const user = await requireAuth()

    // If no userId provided, get current user's documents
    // If userId provided, verify it matches current user (users can only see their own documents)
    const targetUserId = userId || user.id
    if (targetUserId !== user.id) {
        throw new Error('Access denied: can only access your own documents')
    }

    try {
        const result = await db
            .select()
            .from(documents)
            .where(eq(documents.authorId, targetUserId))
            .orderBy(desc(documents.updatedAt))

        return result
    } catch (error) {
        console.error('Error fetching user documents:', error)
        return []
    }
})

export const getPublicDocuments = cache(async (limit = 10): Promise<Document[]> => {
    try {
        const result = await db
            .select()
            .from(documents)
            .where(eq(documents.visibility, 'public'))
            .orderBy(desc(documents.updatedAt))
            .limit(limit)

        return result
    } catch (error) {
        console.error('Error fetching public documents:', error)
        return []
    }
})

// User data fetching operations
export const getUser = cache(async (id: string): Promise<User | null> => {
    const currentUser = await getCurrentUser()

    // Users can only view their own profile or public profiles
    // For now, only allow users to view their own profile
    if (!currentUser || currentUser.id !== id) {
        throw new Error('Access denied: can only view your own profile')
    }

    try {
        const result = await db.select().from(user).where(eq(user.id, id)).limit(1)

        return result[0] || null
    } catch (error) {
        console.error('Error fetching user:', error)
        return null
    }
})

// Collaboration data fetching operations
export const getDocumentCollaborators = cache(async (documentId: string) => {
    const currentUser = await getCurrentUser()

    // Check if user has access to document
    const { canAccess } = await canUserAccessDocument(documentId, currentUser?.id || null)
    if (!canAccess) {
        throw new Error('Access denied: cannot view collaborators')
    }

    try {
        const result = await db
            .select({
                id: documentCollaborators.id,
                documentId: documentCollaborators.documentId,
                userId: documentCollaborators.userId,
                permission: documentCollaborators.permission,
                createdAt: documentCollaborators.createdAt,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar_url: user.avatar_url
                }
            })
            .from(documentCollaborators)
            .leftJoin(user, eq(documentCollaborators.userId, user.id))
            .where(eq(documentCollaborators.documentId, documentId))

        return result
    } catch (error) {
        console.error('Error fetching collaborators:', error)
        return []
    }
})

// Comments data fetching operations
export const getDocumentComments = cache(async (documentId: string): Promise<CommentWithUser[]> => {
    const currentUser = await getCurrentUser()

    // Check if user has access to document
    const { canAccess } = await canUserAccessDocument(documentId, currentUser?.id || null)
    if (!canAccess) {
        throw new Error('Access denied: cannot view comments')
    }

    try {
        const result = await db
            .select({
                id: comments.id,
                documentId: comments.documentId,
                userId: comments.userId,
                content: comments.content,
                parentCommentId: comments.parentCommentId,
                position: comments.position,
                createdAt: comments.createdAt,
                updatedAt: comments.updatedAt,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar_url: user.avatar_url
                }
            })
            .from(comments)
            .leftJoin(user, eq(comments.userId, user.id))
            .where(eq(comments.documentId, documentId))
            .orderBy(asc(comments.createdAt))

        return result
    } catch (error) {
        console.error('Error fetching comments:', error)
        return []
    }
})

// Permission checking utilities
export async function canUserAccessDocument(
    documentId: string,
    userId: string | null
): Promise<{ canAccess: boolean; permission?: 'read' | 'write' | 'admin' }> {
    // Get document directly without access checks to avoid infinite recursion
    try {
        const documentResult = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1)

        const document = documentResult[0]
        if (!document) {
            return { canAccess: false }
        }

        // Check if document is public
        if (document.visibility === 'public') {
            return { canAccess: true, permission: 'read' }
        }

        // If no user, only public documents are accessible
        if (!userId) {
            return { canAccess: false }
        }

        // Check if user is the author
        if (document.authorId === userId) {
            return { canAccess: true, permission: 'admin' }
        }

        // Check if user is a collaborator
        const collaborator = await db
            .select({ permission: documentCollaborators.permission })
            .from(documentCollaborators)
            .where(and(eq(documentCollaborators.documentId, documentId), eq(documentCollaborators.userId, userId)))
            .limit(1)

        if (collaborator[0]) {
            return {
                canAccess: true,
                permission: collaborator[0].permission as 'read' | 'write' | 'admin'
            }
        }

        return { canAccess: false }
    } catch (error) {
        console.error('Error checking document access:', error)
        return { canAccess: false }
    }
}

export async function canUserEditDocument(documentId: string, userId: string | null): Promise<boolean> {
    if (!userId) return false

    const { canAccess, permission } = await canUserAccessDocument(documentId, userId)
    return canAccess && (permission === 'write' || permission === 'admin')
}
