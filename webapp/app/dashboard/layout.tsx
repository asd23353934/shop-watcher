import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const signOutAction = async () => {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={{ name: session.user.name, image: session.user.image }}
        signOutAction={signOutAction}
        activeHref="/dashboard"
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
