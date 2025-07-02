"use client";

import { MDXContent } from "@/components/mdx/mdx-content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, debounce } from "@/lib/utils";
import { EditIcon, EyeIcon, SaveIcon, ShareIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface MarkdownEditorProps {
	initialContent?: string;
	title?: string;
	onSave?: (content: string, title: string) => Promise<void>;
	onContentChange?: (content: string) => void;
	className?: string;
	readOnly?: boolean;
}

export function MarkdownEditor({
	initialContent = "",
	title: initialTitle = "",
	onSave,
	onContentChange,
	className,
	readOnly = false,
}: MarkdownEditorProps) {
	const [content, setContent] = useState(initialContent);
	const [title, setTitle] = useState(initialTitle);
	const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
	const [isSaving, setIsSaving] = useState(false);

	// Debounced content change callback
	const debouncedOnContentChange = useCallback(
		debounce((newContent: string) => {
			onContentChange?.(newContent);
		}, 500),
		[onContentChange],
	);

	useEffect(() => {
		if (content !== initialContent) {
			debouncedOnContentChange(content);
		}
	}, [content, debouncedOnContentChange, initialContent]);

	const handleSave = async () => {
		if (!onSave) return;

		setIsSaving(true);
		try {
			await onSave(content, title);
		} catch (error) {
			console.error("Failed to save:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleContentChange = (newContent: string) => {
		setContent(newContent);
	};

	const handleTitleChange = (newTitle: string) => {
		setTitle(newTitle);
	};

	return (
		<div className={cn("w-full", className)}>
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							{readOnly ? (
								<CardTitle className="text-2xl">
									{title || "Untitled Document"}
								</CardTitle>
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
								<Button
									onClick={handleSave}
									disabled={isSaving}
									size="sm"
									variant="outline"
								>
									<SaveIcon className="h-4 w-4 mr-2" />
									{isSaving ? "Saving..." : "Save"}
								</Button>
							)}
							<Button size="sm" variant="outline">
								<ShareIcon className="h-4 w-4 mr-2" />
								Share
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					<Tabs
						value={activeTab}
						onValueChange={(value) => setActiveTab(value as "edit" | "preview")}
					>
						<div className="border-b px-6">
							<TabsList className="grid w-full grid-cols-2 max-w-md">
								<TabsTrigger value="edit" className="flex items-center gap-2">
									<EditIcon className="h-4 w-4" />
									Edit
								</TabsTrigger>
								<TabsTrigger
									value="preview"
									className="flex items-center gap-2"
								>
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
	);
}
