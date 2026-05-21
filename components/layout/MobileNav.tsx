'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, IndianRupee, ShoppingCart, PiggyBank, FileText, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/salary', icon: IndianRupee, label: 'Salary' },
  { href: '/dashboard/expenses', icon: ShoppingCart, label: 'Expenses' },
  { href: '/dashboard/funds', icon: PiggyBank, label: 'Funds' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50"
      style={{ background: 'hsl(var(--sidebar-background))', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={`flex flex-col items-center justify-center gap-1 min-w-[52px] py-2 transition-all duration-200 ${
                isActive ? 'mobile-nav-active' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
