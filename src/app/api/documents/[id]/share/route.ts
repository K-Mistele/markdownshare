import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { documents } from '@/lib/db/schema'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const params = await context.params
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if document exists and user is the author
        const document = await db
            .select({ authorId: documents.authorId })
            .from(documents)
            .where(eq(documents.id, params.id))
            .limit(1)

        if (!document[0]) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // Only the author can update sharing settings
        if (document[0].authorId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const body = await request.json()
        const { visibility, password } = body

        if (!['public', 'link_only', 'password_protected', 'private'].includes(visibility)) {
            return NextResponse.json({ error: 'Invalid visibility setting' }, { status: 400 })
        }

        const updates: any = {
            visibility,
            updatedAt: new Date().toISOString()
        }

        // Handle password protection
        if (visibility === 'password_protected') {
            if (!password || password.trim().length < 6) {
                return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
            }
            updates.passwordHash = await hash(password.trim(), 12)
        } else {
            // Clear password hash if not password protected
            updates.passwordHash = null
        }

        // Generate access token for link sharing if needed
        if (visibility === 'link_only' || visibility === 'password_protected') {
            updates.accessToken = crypto.randomUUID()
        } else {
            updates.accessToken = null
        }

        const result = await db.update(documents).set(updates).where(eq(documents.id, params.id)).returning()

        const updatedDocument = result[0]
        if (!updatedDocument) {
            return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
        }

        return NextResponse.json({
            document: {
                id: updatedDocument.id,
                visibility: updatedDocument.visibility,
                access_token: updatedDocument.accessToken
            }
        })
    } catch (error) {
        console.error('Error updating document sharing:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
