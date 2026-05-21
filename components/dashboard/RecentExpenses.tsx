import { formatCurrency, formatDate } from '@/lib/utils'
import { CATEGORY_COLORS, type Expense } from '@/types'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) {
    return <p className="text-muted-foreground text-sm">No expenses this month</p>
  }

  return (
    <div className="space-y-3">
      {expenses.map(expense => (
        <div key={expense.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: CATEGORY_COLORS[expense.category] || '#6b7280' }}
            />
            <div>
              <p className="text-sm font-medium leading-none">{expense.category}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatDate(expense.expense_date)}</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-red-400">-{formatCurrency(expense.amount)}</span>
        </div>
      ))}
      <Link
        href="/dashboard/expenses"
        className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        View all expenses <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
