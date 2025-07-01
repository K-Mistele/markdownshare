"use client"

import { useMemo } from "react"
import { MDXRemote } from "next-mdx-remote/rsc"
import { MDXComponents } from "mdx/types"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"

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
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
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
    const match = /language-(\w+)/.exec(className || "")
    const language = match ? match[1] : ""
    
    if (language) {
      return (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={language}
          PreTag="div"
          className="rounded-lg !my-6"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
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
  hr: ({ ...props }) => (
    <hr className="my-8 border-muted" {...props} />
  ),
  table: ({ children, ...props }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full border-collapse border border-muted" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-muted px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-muted px-4 py-2 [&[align=center]]:text-center [&[align=right]]:text-right" {...props}>
      {children}
    </td>
  ),
}

export function MDXContent({ content, className }: MDXContentProps) {
  const processedContent = useMemo(() => {
    if (!content.trim()) {
      return "Nothing to preview yet. Start writing in the edit tab!"
    }
    return content
  }, [content])

  if (!content.trim()) {
    return (
      <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ""}`}>
        <p className="text-muted-foreground italic">
          Nothing to preview yet. Start writing in the edit tab!
        </p>
      </div>
    )
  }

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className || ""}`}>
      <MDXRemote
        source={processedContent}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
      />
    </div>
  )
}