import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { getEnvironment } from "./utils";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			...schema,
			// Map Better Auth's expected table names to our existing tables
			user: schema.users,
		},
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Set to true in production
	},
	socialProviders: {
		github: {
			clientId: getEnvironment("GITHUB_CLIENT_ID", ""),
			clientSecret: getEnvironment("GITHUB_CLIENT_SECRET", ""),
		},
		google: {
			clientId: getEnvironment("GOOGLE_CLIENT_ID", ""),
			clientSecret: getEnvironment("GOOGLE_CLIENT_SECRET", ""),
		},
	},
	user: {
		additionalFields: {
			avatar_url: {
				type: "string",
				required: false,
			},
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
});

export type Session = typeof auth.$Infer.Session.session & {
	user: typeof auth.$Infer.Session.user;
};
export type User = typeof auth.$Infer.Session.user;
