'use client'

import { TrendingUp, TrendingDown, PiggyBank, Wallet, type LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  variant: 'salary' | 'expense' | 'savings' | 'balance'
  subtitle?: string
}

const variantConfig = {
  salary: {
    className: 'stat-card-salary',
    iconColor: 'text-orange-400',
    valueColor: 'text-orange-400',
  },
  expense: {
    className: 'stat-card-expense',
    iconColor: 'text-red-400',
    valueColor: 'text-red-400',
  },
  savings: {
    className: 'stat-card-savings',
    iconColor: 'text-emerald-400',
    valueColor: 'text-emerald-400',
  },
  balance: {
    className: 'stat-card-balance',
    iconColor: 'text-cyan-400',
    valueColor: 'text-cyan-400',
  },
}

export function StatCard({ title, value, icon: Icon, variant, subtitle }: StatCardProps) {
  const config = variantConfig[variant]
  return (
    <div className={`rounded-2xl p-5 transition-colors duration-200 hover:brightness-110 ${config.className}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          {subtitle && <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-xl bg-black/20 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`big-number font-bold ${config.valueColor}`}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}

interface StatCardsRowProps {
  totalSalary: number
  totalExpenses: number
  totalSavings: number
  balance: number
}

export function StatCardsRow({ totalSalary, totalExpenses, totalSavings, balance }: StatCardsRowProps) {
  const t = useTranslation()
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title={t.stats.salary} value={totalSalary} icon={Wallet} variant="salary" />
      <StatCard title={t.stats.expenses} value={totalExpenses} icon={TrendingDown} variant="expense" />
      <StatCard title={t.stats.savings} value={totalSavings} icon={PiggyBank} variant="savings" />
      <StatCard title={t.stats.balance} value={balance} icon={TrendingUp} variant="balance" />
    </div>
  )
}
