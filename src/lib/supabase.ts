import type { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";
import { requireEnvironment } from "./utils";

const supabaseUrl = requireEnvironment("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false, // We're using Better Auth for session management
	},
	realtime: {
		params: {
			eventsPerSecond: 10,
		},
	},
});

// Admin client for server-side operations
export const supabaseAdmin = createClient<Database>(
	supabaseUrl,
	requireEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	},
);

// Helper function to create a client with auth context
export const createSupabaseClient = (accessToken?: string) => {
	return createClient<Database>(supabaseUrl, supabaseAnonKey, {
		global: {
			headers: accessToken
				? {
						Authorization: `Bearer ${accessToken}`,
					}
				: {},
		},
		auth: {
			persistSession: false,
		},
	});
};
