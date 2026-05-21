import { createClient } from '@/lib/supabase/server'
import { StatCardsRow } from '@/components/dashboard/StatCards'
import { ExpensePieChart, MonthlyTrendChart } from '@/components/dashboard/Charts'
import { RecentExpenses } from '@/components/dashboard/RecentExpenses'
import { FundsOverview } from '@/components/dashboard/FundsOverview'
import { formatCurrency } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

  // Fetch this month's salaries and expenses in parallel
  const [
    { data: salaries },
    { data: expenses }
  ] = await Promise.all([
    supabase
      .from('salaries')
      .select('*, allocations(*)')
      .gte('received_date', monthStart)
      .lte('received_date', monthEnd)
      .order('received_date', { ascending: false }),
    supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd)
      .order('expense_date', { ascending: false })
  ])

  const totalSalary = (salaries || []).reduce((s, r) => s + r.amount, 0)
  const totalExpenses = (expenses || []).reduce((s, r) => s + r.amount, 0)
  const totalSavings = (salaries || []).reduce((s, r) => {
    const savingsAlloc = (r.allocations || []).find((a: { allocated_to: string }) => a.allocated_to.toLowerCase().includes('saving'))
    return s + (savingsAlloc ? savingsAlloc.amount : 0)
  }, 0)
  const balance = totalSalary - totalExpenses

  // Expense by category
  const categoryMap: Record<string, number> = {}
  ;(expenses || []).forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount
  })
  const expensesByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
    category,
    amount,
    color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280',
  }))

  // Monthly trend (last 6 months)
  const sixMonthsAgoStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')
  const [{ data: allMSalaries }, { data: allMExpenses }] = await Promise.all([
    supabase
      .from('salaries')
      .select('amount, received_date')
      .gte('received_date', sixMonthsAgoStart)
      .lte('received_date', monthEnd),
    supabase
      .from('expenses')
      .select('amount, expense_date')
      .gte('expense_date', sixMonthsAgoStart)
      .lte('expense_date', monthEnd)
  ])

  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    const currentMonthLabel = format(d, 'yyyy-MM')
    
    // Filter salaries for this specific month
    const mSalaries = (allMSalaries || []).filter(
      s => s.received_date.startsWith(currentMonthLabel)
    )
    const mExpenses = (allMExpenses || []).filter(
      e => e.expense_date.startsWith(currentMonthLabel)
    )

    const ms = mSalaries.reduce((s, r) => s + r.amount, 0)
    const me = mExpenses.reduce((s, r) => s + r.amount, 0)
    monthlyTrend.push({
      month: format(d, 'MMM'),
      year: d.getFullYear(),
      total_salary: ms,
      total_expenses: me,
      total_savings: Math.max(0, ms - me),
      balance: ms - me,
    })
  }

  const recentExpenses = (expenses || []).slice(0, 6)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(now, 'MMMM yyyy')} overview
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/40 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Savings rate: <strong className="text-emerald-400">
            {totalSalary > 0 ? ((totalSavings / totalSalary) * 100).toFixed(0) : 0}%
          </strong></span>
        </div>
      </div>

      {/* Stat Cards */}
      <StatCardsRow
        totalSalary={totalSalary}
        totalExpenses={totalExpenses}
        totalSavings={totalSavings}
        balance={balance}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">Expense Breakdown</h2>
          <ExpensePieChart data={expensesByCategory} />
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">6-Month Trend</h2>
          <MonthlyTrendChart data={monthlyTrend} />
        </div>
      </div>

      {/* Allocation Breakdown + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation this month */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">This Month&apos;s Allocation</h2>
          {(salaries || []).length === 0 ? (
            <p className="text-muted-foreground text-sm">No salary recorded this month</p>
          ) : (
            <div className="space-y-3">
              {(salaries || []).flatMap(s => s.allocations || []).map((a: { id: string; allocated_to: string; amount: number }) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <span className="text-sm text-muted-foreground">{a.allocated_to}</span>
                  <span className="font-semibold text-sm">{formatCurrency(a.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">Recent Expenses</h2>
          <RecentExpenses expenses={recentExpenses} />
        </div>
      </div>

      {/* Fund Balances — cumulative across all time */}
      <FundsOverview />
    </div>
  )
}
