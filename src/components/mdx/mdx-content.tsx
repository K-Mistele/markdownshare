'use client'

import type { MDXComponents } from 'mdx/types'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { useEffect, useMemo, useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

interface MDXContentProps {
    content: string
    className?: string
}

const components: MDXComponents = {
    h1: ({ children, ...props }) => (
        <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props}>
            {children}
        </h1>
    ),
    h2: ({ children, ...props }) => (
        <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props}>
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }) => (
        <h4 className="text-lg font-semibold mt-3 mb-2 text-foreground" {...props}>
            {children}
        </h4>
    ),
    p: ({ children, ...props }) => (
        <p className="mb-4 text-foreground leading-7" {...props}>
            {children}
        </p>
    ),
    a: ({ children, href, ...props }) => (
        <a
            href={href}
            className="text-primary underline underline-offset-4 hover:text-primary/80"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            {...props}
        >
            {children}
        </a>
    ),
    ul: ({ children, ...props }) => (
        <ul className="mb-4 ml-6 list-disc [&>li]:mt-2" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="mb-4 ml-6 list-decimal [&>li]:mt-2" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="text-foreground" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ children, ...props }) => (
        <blockquote className="border-l-4 border-muted-foreground pl-6 italic my-4 text-muted-foreground" {...props}>
            {children}
        </blockquote>
    ),
    code: ({ children, className, ...props }) => {
        const match = /language-(\w+)/.exec(className || '')
        const language = match ? match[1] : ''

        // Parse filename from different syntax formats
        let filename = ''

        // Format 1: language:filename (e.g., typescript:somefile.ts)
        const colonMatch = /language-(\w+):(.+)/.exec(className || '')
        if (colonMatch) {
            filename = colonMatch[2]
        }

        // Format 2: language filename=filename (e.g., typescript filename=somefile.ts)
        const filenameMatch = /language-(\w+).*filename=([^\s]+)/.exec(className || '')
        if (filenameMatch) {
            filename = filenameMatch[2]
        }

        if (language) {
            return (
                <div className="relative">
                    <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={language}
                        PreTag="div"
                        className="rounded-lg !my-6"
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    {filename && (
                        <div className="absolute top-2 right-2 px-2 py-1 text-xs bg-black/20 text-white rounded border border-white/10">
                            {filename}
                        </div>
                    )}
                </div>
            )
        }

        return (
            <code
                className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
                {...props}
            >
                {children}
            </code>
        )
    },
    pre: ({ children, ...props }) => (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4" {...props}>
            {children}
        </pre>
    ),
    hr: ({ ...props }) => <hr className="my-8 border-muted" {...props} />,
    table: ({ children, ...props }) => (
        <div className="my-6 w-full overflow-y-auto">
            <table className="w-full border-collapse border border-muted" {...props}>
                {children}
            </table>
        </div>
    ),
    th: ({ children, ...props }) => (
        <th
            className="border border-muted px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
            {...props}
        >
            {children}
        </th>
    ),
    td: ({ children, ...props }) => (
        <td
            className="border border-muted px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right"
            {...props}
        >
            {children}
        </td>
    )
}

export function MDXContent({ content, className }: MDXContentProps) {
    const [serializedContent, setSerializedContent] = useState<MDXRemoteSerializeResult | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const processedContent = useMemo(() => {
        if (!content.trim()) {
            return 'Nothing to preview yet. Start writing in the edit tab!'
        }
        return content
    }, [content])

    useEffect(() => {
        const serializeContent = async () => {
            if (
                !processedContent.trim() ||
                processedContent === 'Nothing to preview yet. Start writing in the edit tab!'
            ) {
                setSerializedContent(null)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const result = await serialize(processedContent, {
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [rehypeSlug]
                    }
                })
                setSerializedContent(result)
            } catch (err) {
                console.error('Error serializing MDX:', err)
                setError('Error rendering markdown. Please check your syntax.')
            } finally {
                setIsLoading(false)
            }
        }

        serializeContent()
    }, [processedContent])

    if (!content.trim()) {
        return (
            <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ''}`}>
                <p className="text-muted-foreground italic">Nothing to preview yet. Start writing in the edit tab!</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ''}`}>
                <p className="text-muted-foreground italic">Rendering preview...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ''}`}>
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    if (!serializedContent) {
        return (
            <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ''}`}>
                <p className="text-muted-foreground italic">Nothing to preview yet. Start writing in the edit tab!</p>
            </div>
        )
    }

    return (
        <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ''}`}>
            <MDXRemote {...serializedContent} components={components} />
        </div>
    )
}
