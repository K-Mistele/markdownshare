"use client";

import { Component, ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: any) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="container mx-auto py-8 px-4">
					<div className="flex flex-col items-center justify-center h-64 space-y-4">
						<h2 className="text-xl font-semibold text-destructive">
							Something went wrong
						</h2>
						<p className="text-muted-foreground text-center">
							{this.state.error?.message || "An unexpected error occurred"}
						</p>
						<Button
							onClick={() => this.setState({ hasError: false, error: undefined })}
							variant="outline"
						>
							Try again
						</Button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}