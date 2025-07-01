"use server"

import { Database } from "@/types/supabase"
import { createClient } from "@supabase/supabase-js"
import { cache } from "react"

type Tables = Database["public"]["Tables"]
type Document = Tables["documents"]["Row"]
type DocumentInsert = Tables["documents"]["Insert"]
type DocumentUpdate = Tables["documents"]["Update"]
type User = Tables["users"]["Row"]
type Comment = Tables["comments"]["Row"]
type DocumentCollaborator = Tables["document_collaborators"]["Row"]

// Server-side Supabase client with service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Document operations
export const getDocument = cache(async (id: string): Promise<Document | null> => {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching document:", error)
    return null
  }

  return data
})

export const getDocumentWithAuthor = cache(async (id: string) => {
  const { data, error } = await supabase
    .from("documents")
    .select(`
      *,
      author:users(id, name, email, avatar_url)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching document with author:", error)
    return null
  }

  return data
})

export async function createDocument(document: DocumentInsert): Promise<Document | null> {
  const { data, error } = await supabase
    .from("documents")
    .insert(document)
    .select()
    .single()

  if (error) {
    console.error("Error creating document:", error)
    return null
  }

  return data
}

export async function updateDocument(id: string, updates: DocumentUpdate): Promise<Document | null> {
  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating document:", error)
    return null
  }

  return data
}

export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting document:", error)
    return false
  }

  return true
}

export const getUserDocuments = cache(async (userId: string): Promise<Document[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("author_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("Error fetching user documents:", error)
    return []
  }

  return data
})

export const getPublicDocuments = cache(async (limit = 10): Promise<Document[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching public documents:", error)
    return []
  }

  return data
})

// User operations
export const getUser = cache(async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data
})

export async function createUser(user: Tables["users"]["Insert"]): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .insert(user)
    .select()
    .single()

  if (error) {
    console.error("Error creating user:", error)
    return null
  }

  return data
}

export async function updateUser(id: string, updates: Tables["users"]["Update"]): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating user:", error)
    return null
  }

  return data
}

// Collaboration operations
export const getDocumentCollaborators = cache(async (documentId: string) => {
  const { data, error } = await supabase
    .from("document_collaborators")
    .select(`
      *,
      user:users(id, name, email, avatar_url)
    `)
    .eq("document_id", documentId)

  if (error) {
    console.error("Error fetching collaborators:", error)
    return []
  }

  return data
})

export async function addCollaborator(
  documentId: string,
  userId: string,
  permission: "read" | "write" | "admin"
): Promise<DocumentCollaborator | null> {
  const { data, error } = await supabase
    .from("document_collaborators")
    .insert({
      document_id: documentId,
      user_id: userId,
      permission,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding collaborator:", error)
    return null
  }

  return data
}

export async function updateCollaboratorPermission(
  documentId: string,
  userId: string,
  permission: "read" | "write" | "admin"
): Promise<boolean> {
  const { error } = await supabase
    .from("document_collaborators")
    .update({ permission })
    .eq("document_id", documentId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error updating collaborator permission:", error)
    return false
  }

  return true
}

export async function removeCollaborator(documentId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("document_collaborators")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId)

  if (error) {
    console.error("Error removing collaborator:", error)
    return false
  }

  return true
}

// Comments operations
export const getDocumentComments = cache(async (documentId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      user:users(id, name, email, avatar_url)
    `)
    .eq("document_id", documentId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    return []
  }

  return data
})

export async function createComment(comment: Tables["comments"]["Insert"]): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert(comment)
    .select()
    .single()

  if (error) {
    console.error("Error creating comment:", error)
    return null
  }

  return data
}

export async function updateComment(id: string, content: string): Promise<Comment | null> {
  const { data, error } = await supabase
    .from("comments")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating comment:", error)
    return null
  }

  return data
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting comment:", error)
    return false
  }

  return true
}

// Permission checking utilities
export async function canUserAccessDocument(
  documentId: string,
  userId: string | null
): Promise<{ canAccess: boolean; permission?: "read" | "write" | "admin" }> {
  const document = await getDocument(documentId)
  if (!document) {
    return { canAccess: false }
  }

  // Check if document is public
  if (document.visibility === "public") {
    return { canAccess: true, permission: "read" }
  }

  // If no user, only public documents are accessible
  if (!userId) {
    return { canAccess: false }
  }

  // Check if user is the author
  if (document.author_id === userId) {
    return { canAccess: true, permission: "admin" }
  }

  // Check if user is a collaborator
  const collaborator = await supabase
    .from("document_collaborators")
    .select("permission")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .single()

  if (collaborator.data) {
    return { canAccess: true, permission: collaborator.data.permission }
  }

  return { canAccess: false }
}

export async function canUserEditDocument(documentId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false
  
  const { canAccess, permission } = await canUserAccessDocument(documentId, userId)
  return canAccess && (permission === "write" || permission === "admin")
}