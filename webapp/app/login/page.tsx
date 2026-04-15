import { signIn, auth } from '@/auth'
import { redirect } from 'next/navigation'

const platforms = [
  { name: '露天', color: '#0066CC' },
  { name: 'PChome', color: '#C0392B' },
  { name: 'MOMO', color: '#E67E22' },
  { name: 'Animate', color: '#2980B9' },
  { name: 'Yahoo拍賣', color: '#6929C4' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  const params = await searchParams
  const raw = params.callbackUrl ?? ''
  // Only allow relative paths to prevent open redirect attacks
  const callbackUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'

  return (
    <main className="relative min-h-screen bg-[#0B0F19] flex items-center justify-center px-4 py-8 overflow-hidden">
      <div
        className="pointer-events-none absolute top-0 left-0 w-[600px] h-[600px] hidden sm:block"
        style={{ background: 'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[600px] hidden sm:block"
        style={{ background: 'radial-gradient(circle at center, rgba(238,77,45,0.08) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md bg-[#131B2F] rounded-2xl border border-white/10 shadow-xl shadow-indigo-500/5 p-6 sm:p-8 animate-fade-in-up">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="mt-3 text-2xl font-black text-white tracking-wide">Shop Watcher</h1>
          <div className="mt-2 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            <span className="text-xs text-indigo-400">系統監控中</span>
          </div>
        </div>

        <div className="w-full h-px bg-white/5 my-6" />

        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">登入以開始監控</h2>
          <p className="text-sm text-gray-400 mt-1">每 10 分鐘自動掃描 12 個電商平台</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {platforms.map((platform) => (
            <span
              key={platform.name}
              className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-medium text-gray-400"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: platform.color }}
                aria-hidden="true"
              />
              {platform.name}
            </span>
          ))}
          <span className="inline-flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs font-medium text-gray-400">
            +7
          </span>
        </div>

        <div className="w-full h-px bg-white/5 my-6" />

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: callbackUrl })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 rounded-xl px-4 py-3.5 transition-all duration-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.3)] cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm font-medium text-gray-200">使用 Google 帳號登入</span>
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-600">
          登入即表示您同意本服務之使用條款與隱私政策
        </p>
      </div>
    </main>
  )
}
