"use client"

import { MarkdownEditor } from "@/components/editor/markdown-editor"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NewDocumentPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const session = await authClient.getSession()
      if (!session?.data) {
        router.push("/auth/signin")
        return
      }
      setUser(session.data.user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }
  const initialContent = `# New Document

Start writing your markdown content here...

## Tips

- Use **bold** and *italic* text
- Create [links](https://example.com)
- Add code blocks with \`\`\`
- Make lists with - or 1.

Happy writing! ✨`

  const handleSave = async (content: string, title: string) => {
    if (!title.trim()) {
      throw new Error("Please enter a title for your document")
    }

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          content,
          visibility: "private" 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/document/${data.document.id}`)
      } else {
        throw new Error("Failed to create document")
      }
    } catch (error) {
      console.error("Error creating document:", error)
      throw error
    }
  }

  const handleContentChange = (content: string) => {
    // Auto-save drafts or handle real-time sync
    console.log("Draft content changed")
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <MarkdownEditor
        initialContent={initialContent}
        title=""
        onSave={handleSave}
        onContentChange={handleContentChange}
      />
    </div>
  )
}