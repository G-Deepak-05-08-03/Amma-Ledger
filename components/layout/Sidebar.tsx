'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  IndianRupee,
  PiggyBank,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useStore'
import { useTranslation } from '@/lib/i18n/useTranslation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslation()

  const userName = useAppStore((s) => s.userName)
  const userEmail = useAppStore((s) => s.userEmail)
  const setUserProfile = useAppStore((s) => s.setUserProfile)

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.nav.dashboard },
    { href: '/dashboard/salary', icon: IndianRupee, label: t.nav.salary },
    { href: '/dashboard/expenses', icon: ShoppingCart, label: t.nav.expenses },
    { href: '/dashboard/funds', icon: PiggyBank, label: t.nav.funds },
    { href: '/dashboard/reports', icon: FileText, label: t.nav.reports },
    { href: '/dashboard/settings', icon: Settings, label: t.nav.settings },
  ]

  useEffect(() => {
    if (userName) return
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('name').eq('id', user.id).single()
      setUserProfile(data?.name || '', user.email || '')
    }
    loadUser()
  }, [supabase, userName, setUserProfile])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success(t.settings.signedOut)
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40 border-r border-border/50"
      style={{ background: 'hsl(var(--sidebar-background))' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}>
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg gradient-text leading-none">AmmaLedger</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{t.sidebar.tagline}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'sidebar-active'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 pb-6 border-t border-border/50 pt-4 space-y-1">
        {userName && (
          <div className="px-4 py-2">
            <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          {t.settings.signOut}
        </button>
      </div>
    </aside>
  )
}
