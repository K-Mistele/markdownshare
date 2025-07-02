import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './db/schema'

if (
    !process.env.GITHUB_CLIENT_ID ||
    !process.env.GITHUB_CLIENT_SECRET ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
) {
    console.error(
        'Missing environment variables:',
        Object.keys(process.env)
            .filter((key) => key.startsWith('GITHUB_') || key.startsWith('GOOGLE_'))
            .join(', ')
    )
    process.exit(1)
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: {
            ...schema
        }
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false // Set to true in production
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
    },
    user: {
        additionalFields: {
            avatar_url: {
                type: 'string',
                required: false
            }
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24 // 1 day
    }
})

export type Session = typeof auth.$Infer.Session.session & {
    user: typeof auth.$Infer.Session.user
}
export type User = typeof auth.$Infer.Session.user
