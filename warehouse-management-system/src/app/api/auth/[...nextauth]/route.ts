import NextAuth, { type NextAuthOptions } from 'next-auth';
import { KyselyAdapter } from '@auth/kysely-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email'; // Or Nodemailer if there's a specific one
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2'; // Ensure mysql2 is used
import bcrypt from 'bcrypt';
import type { AdapterUser } from 'next-auth/adapters';

// Define your Kysely database interface (should match your schema structure)
// This is a simplified version; you might need to adjust it based on the actual schema.sql for Auth tables
interface Database {
  users: {
    id: string; // Kysely adapter expects string IDs by default, it will handle the conversion
    name?: string | null;
    email: string;
    emailVerified?: Date | null;
    password?: string | null;
    image?: string | null;
    online_status?: boolean | null;
    // Ensure created_at and updated_at are included if your adapter/queries use them
    created_at?: Date | string | null; 
    updated_at?: Date | string | null;
  };
  accounts: {
    id: string;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token?: string | null;
    access_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
    // Ensure created_at and updated_at are included
    created_at?: Date | string | null;
    updated_at?: Date | string | null;
  };
  sessions: {
    id: string;
    userId: string;
    sessionToken: string;
    expires: Date;
    // Ensure created_at and updated_at are included
    created_at?: Date | string | null;
    updated_at?: Date | string | null;
  };
  verification_tokens: {
    identifier: string;
    token: string;
    expires: Date;
    // Ensure created_at is included
    created_at?: Date | string | null;
  };
}

// Setup Kysely instance
const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      // ssl: { rejectUnauthorized: true } // Optional: Add SSL configuration if needed
    }),
  }),
});

export const authOptions: NextAuthOptions = {
  adapter: KyselyAdapter(db as any), // Cast to `any` for now if type issues arise with KyselyAapter generics
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'john.doe@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await db
          .selectFrom('users')
          .selectAll() // Select all to get all fields including id, name, image, emailVerified
          .where('email', '=', credentials.email)
          .executeTakeFirst();

        if (user && user.password) {
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (isValid) {
            // Ensure all required fields by AdapterUser are present and correctly typed
            // The Kysely adapter handles ID type conversion (e.g. INT from DB to string for AdapterUser)
            return {
                id: user.id, // KyselyAdapter expects string ID
                email: user.email, // email is non-nullable in AdapterUser
                name: user.name ?? null, // Provide null if undefined
                image: user.image ?? null, // Provide null if undefined
                emailVerified: user.emailVerified ? new Date(user.emailVerified) : null, // Ensure it's a Date object or null
            } as AdapterUser;
          }
        }
        return null; // Login failed
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // sendVerificationRequest: async ({ identifier: email, url, provider }) => {
      //   // Custom email sending logic for password reset (will be detailed later)
      //   console.log(`Sending verification request to ${email} with URL: ${url}`);
      //   // TODO: Implement actual email sending using Nodemailer
      // }
    }),
    // Add other providers like Google, GitHub etc. if needed
  ],
  session: {
    strategy: 'database', // Use database sessions
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (user?.id) { // user.id should be available and correctly typed (string)
        try {
          await db
            .updateTable('users')
            .set({ online_status: true, updated_at: new Date() }) 
            .where('id', '=', user.id) // Ensure user.id is the correct type for the query (string for Kysely adapter)
            .execute();
        } catch (error) {
          console.error('Failed to update online_status on signin:', error);
        }
      }
      return true; // Continue with sign in
    },
    // async redirect({ url, baseUrl }) { return baseUrl },
    async session({ session, user, token }) {
      // Add custom properties to the session object
      // The 'user' object here is the user object from the database, already processed by the adapter.
      // The 'token' object is relevant for JWT sessions but 'user' is more direct for database sessions.
      if (session.user && user?.id) {
        session.user.id = user.id; // Add user ID to session
        // To add online_status to the session user object:
        // (session.user as any).online_status = (user as any).online_status; // Assuming user object from adapter contains it
      }
      return session;
    },
    // events: {
    //   async signOut({ session, token }) {
    //     if (token?.sub) { // token.sub usually holds the user ID
    //       try {
    //         await db
    //           .updateTable('users')
    //           .set({ online_status: false, updated_at: new Date() })
    //           .where('id', '=', token.sub)
    //           .execute();
    //       } catch (error) {
    //         console.error('Failed to update online_status on signout:', error);
    //       }
    //     }
    //   }
    // }
  },
  // pages: { // Optional: customize pages
  //   signIn: '/auth/login',
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  //   // verifyRequest: '/auth/verify-request', // (e.g. check your email)
  //   // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  // },
  // secret: process.env.NEXTAUTH_SECRET, // IMPORTANT: Set this in your .env.local for production
  // debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
