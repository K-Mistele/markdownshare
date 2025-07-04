import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
