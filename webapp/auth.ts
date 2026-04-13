import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    // Session is managed via JWT without a database session table
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false

      try {
        // User can sign in with Google OAuth — upsert user record
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
        })
      } catch (err) {
        console.error('[auth] signIn error:', err)
        return false
      }

      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // Attach our DB user id to the token
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true },
        })
        if (dbUser) {
          token.userId = dbUser.id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
})
