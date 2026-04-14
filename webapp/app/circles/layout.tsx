import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { logoutAction } from '@/actions/auth'

export default async function CirclesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar
        user={{ name: session.user.name, image: session.user.image }}
        signOutAction={logoutAction}

      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
