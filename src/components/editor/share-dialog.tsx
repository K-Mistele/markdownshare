'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, GlobeIcon, LinkIcon, LockIcon, ShareIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Document {
    id: string
    title: string
    visibility: 'public' | 'link_only' | 'password_protected' | 'private'
    access_token?: string
}

interface ShareDialogProps {
    document: Document
    onUpdateSharing?: (settings: {
        visibility: Document['visibility']
        password?: string
    }) => Promise<void>
    children?: React.ReactNode
}

export function ShareDialog({ document, onUpdateSharing, children }: ShareDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [visibility, setVisibility] = useState<Document['visibility']>(document.visibility)
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [hasCopied, setHasCopied] = useState(false)

    const getShareUrl = () => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        return `${baseUrl}/document/${document.id}`
    }

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl())
            setHasCopied(true)
            toast.success('Link copied to clipboard!')
            setTimeout(() => setHasCopied(false), 2000)
        } catch (error) {
            toast.error('Failed to copy link')
        }
    }

    const handleUpdateSharing = async () => {
        if (!onUpdateSharing) return

        setIsUpdating(true)
        try {
            const settings: { visibility: Document['visibility']; password?: string } = {
                visibility
            }

            if (visibility === 'password_protected' && password.trim()) {
                settings.password = password.trim()
            }

            await onUpdateSharing(settings)
            toast.success('Sharing settings updated!')
            setIsOpen(false)
        } catch (error) {
            toast.error('Failed to update sharing settings')
        } finally {
            setIsUpdating(false)
        }
    }

    const visibilityOptions = [
        {
            value: 'private' as const,
            label: 'Private',
            description: 'Only you can access this document',
            icon: LockIcon
        },
        {
            value: 'link_only' as const,
            label: 'Anyone with the link',
            description: 'Anyone with the link can view',
            icon: LinkIcon
        },
        {
            value: 'password_protected' as const,
            label: 'Password protected',
            description: 'Requires a password to access',
            icon: EyeOffIcon
        },
        {
            value: 'public' as const,
            label: 'Public',
            description: 'Anyone can find and view this document',
            icon: GlobeIcon
        }
    ]

    const currentOption = visibilityOptions.find((opt) => opt.value === visibility)
    const isShareable = visibility !== 'private'

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button size="sm" variant="outline">
                        <ShareIcon className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share "{document.title}"</DialogTitle>
                    <DialogDescription>
                        Choose who can access this document and how they can interact with it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Visibility Settings */}
                    <div className="space-y-2">
                        <Label htmlFor="visibility">Who can access</Label>
                        <div className="space-y-2">
                            {visibilityOptions.map((option) => {
                                const Icon = option.icon
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors w-full text-left ${
                                            visibility === option.value
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:bg-muted/50'
                                        }`}
                                        onClick={() => setVisibility(option.value)}
                                    >
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{option.label}</div>
                                            <div className="text-xs text-muted-foreground">{option.description}</div>
                                        </div>
                                        {visibility === option.value && <CheckIcon className="h-4 w-4 text-primary" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Password Input */}
                    {visibility === 'password_protected' && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter a password"
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOffIcon className="h-4 w-4" />
                                    ) : (
                                        <EyeIcon className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Share Link */}
                    {isShareable && (
                        <div className="space-y-2">
                            <Label>Share link</Label>
                            <div className="flex items-center space-x-2">
                                <Input value={getShareUrl()} readOnly className="font-mono text-xs" />
                                <Button onClick={handleCopyLink} size="sm" variant="outline">
                                    {hasCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateSharing} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Update Settings'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
