'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  user: {
    name?: string | null
    image?: string | null
  }
  signOutAction: () => Promise<void>
  activeHref?: string
}

export default function Navbar({ user, signOutAction, activeHref }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '/dashboard', label: '關鍵字' },
    { href: '/circles', label: '社團追蹤' },
    { href: '/history', label: '通知記錄' },
    { href: '/status', label: '掃描狀態' },
    { href: '/settings', label: '通知設定' },
  ]

  return (
    <header className="relative border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* Brand + desktop nav */}
        <nav className="flex items-center gap-6">
          <span className="text-lg font-bold text-gray-900">Shop Watcher</span>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm hover:text-gray-900 ${
                  activeHref === link.href
                    ? 'font-medium text-indigo-600'
                    : 'text-gray-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right section: user info + hamburger */}
        <div className="flex items-center gap-3">
          {/* Desktop user info */}
          <div className="hidden md:flex items-center gap-3">
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ''}
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{user.name}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                登出
              </button>
            </form>
          </div>

          {/* Hamburger button — mobile only */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? '關閉選單' : '開啟選單'}
          >
            {isOpen ? (
              // X icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md flex flex-col py-2 md:hidden z-50">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`px-4 py-3 text-sm hover:bg-gray-50 ${
                activeHref === link.href
                  ? 'font-medium text-indigo-600'
                  : 'text-gray-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-1 border-t px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? ''} className="h-7 w-7 rounded-full" />
              )}
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                登出
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
