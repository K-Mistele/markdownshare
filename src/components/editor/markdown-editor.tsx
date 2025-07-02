'use client'

import { ShareDialog } from '@/components/editor/share-dialog'
import { MDXContent } from '@/components/mdx/mdx-content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, debounce } from '@/lib/utils'
import { EditIcon, EyeIcon, SaveIcon, ShareIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Document {
    id: string
    title: string
    visibility: 'public' | 'link_only' | 'password_protected' | 'private'
    access_token?: string
}

interface MarkdownEditorProps {
    initialContent?: string
    title?: string
    document?: Document
    onSave?: (content: string, title: string) => Promise<void>
    onContentChange?: (content: string) => void
    className?: string
    readOnly?: boolean
}

export function MarkdownEditor({
    initialContent = '',
    title: initialTitle = '',
    document,
    onSave,
    onContentChange,
    className,
    readOnly = false
}: MarkdownEditorProps) {
    const [content, setContent] = useState(initialContent)
    const [title, setTitle] = useState(initialTitle)
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
    const [isSaving, setIsSaving] = useState(false)

    // Debounced content change callback
    const debouncedOnContentChange = useCallback(
        debounce((newContent: string) => {
            onContentChange?.(newContent)
        }, 500),
        []
    )

    useEffect(() => {
        if (content !== initialContent) {
            debouncedOnContentChange(content)
        }
    }, [content, debouncedOnContentChange, initialContent])

    const handleSave = async () => {
        if (!onSave) return

        setIsSaving(true)
        try {
            await onSave(content, title)
        } catch (error) {
            console.error('Failed to save:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleContentChange = (newContent: string) => {
        setContent(newContent)
    }

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle)
    }

    const handleUpdateSharing = async (settings: {
        visibility: Document['visibility']
        password?: string
    }) => {
        if (!document?.id) {
            toast.error('Document must be saved before sharing')
            return
        }

        try {
            const response = await fetch(`/api/documents/${document.id}/share`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update sharing settings')
            }

            const data = await response.json()
            // Update the document in parent component if needed
            toast.success('Sharing settings updated!')
        } catch (error) {
            console.error('Error updating sharing:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update sharing settings')
            throw error
        }
    }

    return (
        <div className={cn('w-full', className)}>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {readOnly ? (
                                <CardTitle className="text-2xl">{title || 'Untitled Document'}</CardTitle>
                            ) : (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => handleTitleChange(e.target.value)}
                                    placeholder="Untitled Document"
                                    className="text-2xl font-semibold bg-transparent border-none outline-none w-full"
                                />
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {!readOnly && (
                                <Button onClick={handleSave} disabled={isSaving} size="sm" variant="outline">
                                    <SaveIcon className="h-4 w-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                            )}
                            {document ? (
                                <ShareDialog document={document} onUpdateSharing={handleUpdateSharing} />
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    title="Save document first to enable sharing"
                                >
                                    <ShareIcon className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'edit' | 'preview')}>
                        <div className="border-b px-6">
                            <TabsList className="grid w-full grid-cols-2 max-w-md">
                                <TabsTrigger value="edit" className="flex items-center gap-2">
                                    <EditIcon className="h-4 w-4" />
                                    Edit
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="flex items-center gap-2">
                                    <EyeIcon className="h-4 w-4" />
                                    Preview
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="edit" className="mt-0">
                            <div className="editor-container">
                                <textarea
                                    value={content}
                                    onChange={(e) => handleContentChange(e.target.value)}
                                    placeholder="Start writing your markdown..."
                                    className="w-full min-h-[400px] p-6 border-none outline-none resize-none bg-transparent font-mono text-sm"
                                    disabled={readOnly}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0">
                            <div className="max-w-none p-6">
                                <MDXContent content={content} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
