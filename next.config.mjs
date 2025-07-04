import createMDX from "@next/mdx";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		mdxRs: true,
	},
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
	images: {
		domains: [
			"avatars.githubusercontent.com",
			"github.com",
			"lh3.googleusercontent.com",
		],
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**.supabase.co",
			},
			{
				protocol: "https",
				hostname: "**.supabase.com",
			},
		],
	},
};

const withMDX = createMDX({
	options: {
		remarkPlugins: [remarkGfm],
		rehypePlugins: [rehypeHighlight, rehypeSlug],
	},
});

export default withMDX(nextConfig);
