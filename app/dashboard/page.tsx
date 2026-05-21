'use client'

import { useEffect, useState, useCallback } from 'react'
import { StatCardsRow } from '@/components/dashboard/StatCards'
import { ExpensePieChart, MonthlyTrendChart } from '@/components/dashboard/Charts'
import { RecentExpenses } from '@/components/dashboard/RecentExpenses'
import { FundsOverview } from '@/components/dashboard/FundsOverview'
import { FilterDropdown, FilterDropdownItem } from '@/components/ui/filter-dropdown'
import { formatCurrency, MONTHS } from '@/lib/utils'
import { CATEGORY_COLORS, SAVINGS_ALLOCATION_KEYWORDS } from '@/types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { TrendingUp, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types'

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)
  const [data, setData] = useState<{
    totalSalary: number
    totalExpenses: number
    totalSavings: number
    balance: number
    expensesByCategory: { category: string; amount: number; color: string }[]
    monthlyTrend: { month: string; year: number; total_salary: number; total_expenses: number; total_savings: number; balance: number }[]
    recentExpenses: Expense[]
    salaries: any[]
  } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const now = new Date(selectedYear, selectedMonth - 1, 1)
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
    const sixMonthsAgoStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')

    const [
      { data: salaries },
      { data: expenses },
      { data: allMSalaries },
      { data: allMExpenses }
    ] = await Promise.all([
      supabase.from('salaries').select('*, allocations(*)').gte('received_date', monthStart).lte('received_date', monthEnd).order('received_date', { ascending: false }),
      supabase.from('expenses').select('*').gte('expense_date', monthStart).lte('expense_date', monthEnd).order('expense_date', { ascending: false }),
      supabase.from('salaries').select('amount, received_date').gte('received_date', sixMonthsAgoStart).lte('received_date', monthEnd),
      supabase.from('expenses').select('amount, expense_date').gte('expense_date', sixMonthsAgoStart).lte('expense_date', monthEnd)
    ])

    const totalSalary = (salaries || []).reduce((s: number, r: any) => s + r.amount, 0)
    const totalExpenses = (expenses || []).reduce((s: number, r: any) => s + r.amount, 0)
    const totalSavings = (salaries || []).reduce((s: number, r: any) => {
      const savingsAlloc = (r.allocations || []).find((a: any) =>
        SAVINGS_ALLOCATION_KEYWORDS.some(kw => a.allocated_to.toLowerCase().includes(kw))
      )
      return s + (savingsAlloc ? savingsAlloc.amount : 0)
    }, 0)

    const categoryMap: Record<string, number> = {}
    ;(expenses || []).forEach((e: any) => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount
    })
    const expensesByCategory = Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280',
    }))

    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const currentMonthLabel = format(d, 'yyyy-MM')
      const mSalaries = (allMSalaries || []).filter((s: any) => s.received_date.startsWith(currentMonthLabel))
      const mExpenses = (allMExpenses || []).filter((e: any) => e.expense_date.startsWith(currentMonthLabel))
      const ms = mSalaries.reduce((s: number, r: any) => s + r.amount, 0)
      const me = mExpenses.reduce((s: number, r: any) => s + r.amount, 0)
      monthlyTrend.push({
        month: format(d, 'MMM'),
        year: d.getFullYear(),
        total_salary: ms,
        total_expenses: me,
        total_savings: Math.max(0, ms - me),
        balance: ms - me,
      })
    }

    setData({
      totalSalary,
      totalExpenses,
      totalSavings,
      balance: totalSalary - totalExpenses,
      expensesByCategory,
      monthlyTrend,
      recentExpenses: (expenses || []).slice(0, 6) as Expense[],
      salaries: salaries || []
    })
    setLoading(false)
  }, [supabase, selectedMonth, selectedYear])

  useEffect(() => { loadData() }, [loadData])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {MONTHS[selectedMonth - 1]} {selectedYear} overview
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown label={MONTHS[selectedMonth - 1]}>
            {MONTHS.map((m, i) => (
              <FilterDropdownItem key={m} onClick={() => setSelectedMonth(i + 1)} active={selectedMonth === i + 1}>
                {m}
              </FilterDropdownItem>
            ))}
          </FilterDropdown>
          <FilterDropdown label={String(selectedYear)}>
            {years.map(y => (
              <FilterDropdownItem key={y} onClick={() => setSelectedYear(y)} active={selectedYear === y}>
                {y}
              </FilterDropdownItem>
            ))}
          </FilterDropdown>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/40 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Savings rate: <strong className="text-emerald-400">
              {data.totalSalary > 0 ? ((data.totalSavings / data.totalSalary) * 100).toFixed(0) : 0}%
            </strong></span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <StatCardsRow
        totalSalary={data.totalSalary}
        totalExpenses={data.totalExpenses}
        totalSavings={data.totalSavings}
        balance={data.balance}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">Expense Breakdown</h2>
          <ExpensePieChart data={data.expensesByCategory} />
        </div>
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">6-Month Trend</h2>
          <MonthlyTrendChart data={data.monthlyTrend} />
        </div>
      </div>

      {/* Allocation Breakdown + Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">This Month&apos;s Allocation</h2>
          {data.salaries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No salary recorded this month</p>
          ) : (
            <div className="space-y-3">
              {data.salaries.flatMap((s: any) => s.allocations || []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <span className="text-sm text-muted-foreground">{a.allocated_to}</span>
                  <span className="font-semibold text-sm">{formatCurrency(a.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold text-base mb-4">Recent Expenses</h2>
          <RecentExpenses expenses={data.recentExpenses} />
        </div>
      </div>

      <FundsOverview />
    </div>
  )
}

