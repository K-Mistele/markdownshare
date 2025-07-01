import { NextRequest, NextResponse } from "next/server"
import { getDocument, updateDocument, deleteDocument, canUserAccessDocument, canUserEditDocument } from "@/lib/database"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    const userId = session?.user?.id || null
    const { canAccess } = await canUserAccessDocument(params.id, userId)

    if (!canAccess) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 })
    }

    const document = await getDocument(params.id)
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error fetching document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canEdit = await canUserEditDocument(params.id, session.user.id)
    if (!canEdit) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, visibility } = body

    const updates: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (visibility !== undefined) updates.visibility = visibility

    const document = await updateDocument(params.id, updates)
    if (!document) {
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const document = await getDocument(params.id)
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Only the author can delete a document
    if (document.author_id !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const success = await deleteDocument(params.id)
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}