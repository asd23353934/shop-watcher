'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

interface NavbarProps {
  user: {
    name?: string | null
    image?: string | null
  }
  signOutAction: () => Promise<void>
}

const navLinks = [
  { href: '/dashboard', label: '儀表板' },
  { href: '/circles',   label: '社團追蹤' },
  { href: '/history',   label: '通知記錄' },
  { href: '/status',    label: '掃描狀態' },
  { href: '/settings',  label: '設定' },
]

export default function Navbar({ user, signOutAction }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo size={28} className="rounded-md" />
            <span className="font-bold text-indigo-700 dark:text-indigo-400">Shop Watcher</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  isActive(link.href)
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-4'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">切換主題</span>
            </Button>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? ''} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {initials}
                </div>
              )}
              <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300">
                {user.name}
              </span>
            </div>

            {/* Logout */}
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">登出</span>
              </Button>
            </form>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive(link.href)
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 px-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={user.name ?? ''} className="h-7 w-7 rounded-full" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {initials}
                    </div>
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user.name}</span>
                </div>
                <form action={signOutAction}>
                  <button
                    type="submit"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    登出
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
