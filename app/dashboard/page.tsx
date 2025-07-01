"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, FileTextIcon, UsersIcon, EyeIcon, LockIcon, LinkIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

interface Document {
  id: string
  title: string
  content: string
  visibility: "public" | "private" | "link_only" | "password_protected"
  updated_at: string
  author_id: string
  created_at: string
  version: number
  collaborators?: number // For demo purposes
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession()
      if (!session?.data) {
        router.push("/auth/signin")
        return
      }
      setUser(session.data.user)
      fetchDocuments()
    }

    checkAuth()
  }, [router])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
      } else if (response.status === 401) {
        router.push("/auth/signin")
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading your documents...</div>
        </div>
      </div>
    )
  }

  // Mock data for now - this will be replaced with actual collaboration data
  const mockDocuments = documents.map(doc => ({
    ...doc,
    collaborators: Math.floor(Math.random() * 5) + 1 // Random number for demo
  }))

  const documentsToShow = mockDocuments.length > 0 ? mockDocuments : [
    {
      id: "1",
      title: "Project Documentation",
      content: "# Project Documentation\n\nThis is a sample document...",
      visibility: "public" as const,
      updatedAt: "2024-01-15T10:30:00Z",
      collaborators: 3,
    },
    {
      id: "2", 
      title: "Meeting Notes",
      content: "# Meeting Notes\n\nToday we discussed...",
      visibility: "private" as const,
      updatedAt: "2024-01-14T15:45:00Z",
      collaborators: 1,
    },
    {
      id: "3",
      title: "API Specification",
      content: "# API Specification\n\n## Endpoints...",
      visibility: "link_only" as const,
      updatedAt: "2024-01-13T09:15:00Z",
      collaborators: 5,
    },
  ]

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <EyeIcon className="h-4 w-4" />
      case "private":
        return <LockIcon className="h-4 w-4" />
      case "link_only":
        return <LinkIcon className="h-4 w-4" />
      default:
        return <FileTextIcon className="h-4 w-4" />
    }
  }

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "Public"
      case "private":
        return "Private"
      case "link_only":
        return "Link Only"
      case "password_protected":
        return "Password Protected"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Documents</h1>
          <p className="text-muted-foreground">
            Create, edit, and share your markdown documents
          </p>
        </div>
        <Button asChild>
          <Link href="/document/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Document
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href={`/document/${doc.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{doc.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {getVisibilityIcon(doc.visibility)}
                    <span className="text-xs">{getVisibilityText(doc.visibility)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {doc.content.split('\n').find(line => line.trim() && !line.startsWith('#')) || 
                   "No preview available"}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="h-3 w-3" />
                    {doc.collaborators} collaborator{doc.collaborators !== 1 ? 's' : ''}
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