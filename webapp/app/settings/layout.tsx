import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { logoutAction } from '@/actions/auth'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={{ name: session.user.name, image: session.user.image }}
        signOutAction={logoutAction}
        activeHref="/settings"
      />
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  )
}
