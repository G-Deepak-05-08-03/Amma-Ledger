'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterDropdown, FilterDropdownItem } from '@/components/ui/filter-dropdown'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import { CATEGORY_COLORS, SAVINGS_ALLOCATION_KEYWORDS, type Expense, type Salary } from '@/types'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface ReportData {
  salaries: Salary[]
  expenses: Expense[]
  totalSalary: number
  totalExpenses: number
  totalSavings: number
  balance: number
  byCategory: { category: string; amount: number; count: number }[]
}

export default function ReportsPage() {
  const supabase = createClient()
  const t = useTranslation()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const hasUserSelected = useRef(false)

  const generateReport = useCallback(async () => {
    setLoading(true)
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const end = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

    const [{ data: rawSalaries }, { data: rawExpenses }] = await Promise.all([
      supabase.from('salaries').select('*, allocations(*)').gte('received_date', start).lte('received_date', end).order('received_date'),
      supabase.from('expenses').select('*').gte('expense_date', start).lte('expense_date', end).order('expense_date'),
    ])

    const salaries = (rawSalaries || []) as Salary[]
    const expenses = (rawExpenses || []) as Expense[]

    const totalSalary = salaries.reduce((acc: number, r: Salary) => acc + r.amount, 0)
    const totalExpenses = expenses.reduce((acc: number, r: Expense) => acc + r.amount, 0)
    const totalSavings = salaries.reduce((acc: number, r: Salary) => {
      const allocs = (r.allocations || []) as { allocated_to: string; amount: number }[]
      const savingsAlloc = allocs.find(a =>
        SAVINGS_ALLOCATION_KEYWORDS.some(kw => a.allocated_to.toLowerCase().includes(kw))
      )
      return acc + (savingsAlloc ? savingsAlloc.amount : 0)
    }, 0)

    const catMap: Record<string, { amount: number; count: number }> = {}
    expenses.forEach((e: Expense) => {
      if (!catMap[e.category]) catMap[e.category] = { amount: 0, count: 0 }
      catMap[e.category].amount += e.amount
      catMap[e.category].count += 1
    })
    const byCategory = Object.entries(catMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)

    setReport({ salaries, expenses, totalSalary, totalExpenses, totalSavings, balance: totalSalary - totalExpenses, byCategory })
    setLoading(false)
  }, [selectedMonth, selectedYear, supabase])

  useEffect(() => {
    if (!hasUserSelected.current) return
    generateReport()
  }, [selectedMonth, selectedYear, generateReport])

  const handleMonthChange = (month: number) => { hasUserSelected.current = true; setSelectedMonth(month) }
  const handleYearChange = (year: number) => { hasUserSelected.current = true; setSelectedYear(year) }

  const exportPDF = async () => {
    if (!report) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`
    const ex = t.pages.reports.export

    doc.setFontSize(20)
    doc.setTextColor(249, 115, 22)
    doc.text('AmmaLedger', 20, 20)
    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.text(`${ex.monthlyReport} — ${monthLabel}`, 20, 30)

    doc.setFontSize(11)
    doc.setTextColor(40, 40, 40)
    let y = 45
    doc.text(ex.summary, 20, y); y += 8
    const summaryLines = [
      `${ex.totalSalary}:    Rs. ${report.totalSalary.toLocaleString('en-IN')}`,
      `${ex.totalExpenses}: Rs. ${report.totalExpenses.toLocaleString('en-IN')}`,
      `${ex.totalSavings}:  Rs. ${report.totalSavings.toLocaleString('en-IN')}`,
      `${ex.balance}:       Rs. ${report.balance.toLocaleString('en-IN')}`,
    ]
    summaryLines.forEach(line => { doc.text(line, 20, y); y += 7 })

    y += 5
    doc.text(ex.expensesByCategory, 20, y); y += 8
    report.byCategory.forEach(c => {
      doc.text(`${c.category.padEnd(20)} Rs. ${c.amount.toLocaleString('en-IN')} (${c.count} ${t.common.entries})`, 20, y)
      y += 7
    })

    y += 5
    doc.text(ex.expenseDetails, 20, y); y += 8
    report.expenses.forEach(e => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(`${formatDate(e.expense_date)}  ${e.category.padEnd(15)} Rs. ${e.amount.toLocaleString('en-IN')}${e.notes ? '  ' + e.notes : ''}`, 20, y)
      y += 7
    })

    doc.save(`AmmaLedger-${monthLabel.replace(' ', '-')}.pdf`)
    toast.success(t.pages.reports.pdfDownloaded)
  }

  const exportExcel = async () => {
    if (!report) return
    const { utils, writeFile } = await import('xlsx')
    const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`
    const ex = t.pages.reports.export

    const summarySheet = utils.aoa_to_sheet([
      [`AmmaLedger ${ex.monthlyReport}`, monthLabel],
      [],
      [ex.totalSalary, report.totalSalary],
      [ex.totalExpenses, report.totalExpenses],
      [ex.totalSavings, report.totalSavings],
      [ex.balance, report.balance],
    ])

    const expenseRows = report.expenses.map(e => ({
      [ex.colDate]: formatDate(e.expense_date),
      [ex.colCategory]: e.category,
      [ex.colAmount]: e.amount,
      [ex.colNotes]: e.notes || '',
    }))
    const expenseSheet = utils.json_to_sheet(expenseRows)

    const salaryRows = report.salaries.map(s => ({
      [ex.colDate]: formatDate(s.received_date),
      [ex.colSource]: s.source,
      [ex.colAmount]: s.amount,
      [ex.colNotes]: s.notes || '',
    }))
    const salarySheet = utils.json_to_sheet(salaryRows)

    const wb = utils.book_new()
    utils.book_append_sheet(wb, summarySheet, ex.sheetSummary)
    utils.book_append_sheet(wb, expenseSheet, ex.sheetExpenses)
    utils.book_append_sheet(wb, salarySheet, ex.sheetSalary)
    writeFile(wb, `AmmaLedger-${monthLabel.replace(' ', '-')}.xlsx`)
    toast.success(t.pages.reports.excelDownloaded)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t.pages.reports.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.pages.reports.subtitle}</p>
      </div>

      <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center gap-4">
        <FilterDropdown label={MONTHS[selectedMonth - 1]} className="min-w-[140px]">
          {MONTHS.map((m, i) => (
            <FilterDropdownItem key={m} onClick={() => handleMonthChange(i + 1)} active={selectedMonth === i + 1}>
              {m}
            </FilterDropdownItem>
          ))}
        </FilterDropdown>

        <FilterDropdown label={String(selectedYear)}>
          {years.map(y => (
            <FilterDropdownItem key={y} onClick={() => handleYearChange(y)} active={selectedYear === y}>
              {y}
            </FilterDropdownItem>
          ))}
        </FilterDropdown>

        <Button
          onClick={generateReport}
          disabled={loading}
          className="h-11 font-semibold"
          style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}
        >
          <FileText className="w-4 h-4 mr-2" />
          {loading ? t.pages.reports.generatingBtn : t.pages.reports.generateBtn}
        </Button>

        {report && (
          <>
            <Button onClick={exportPDF} variant="outline" className="h-11 gap-2">
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button onClick={exportExcel} variant="outline" className="h-11 gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
          </>
        )}
      </div>

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground -mt-2">
            {t.pages.reports.showingFor} <strong className="text-foreground">{MONTHS[selectedMonth - 1]} {selectedYear}</strong>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t.pages.reports.totalSalary, value: report.totalSalary, color: 'text-orange-400' },
              { label: t.pages.reports.totalExpenses, value: report.totalExpenses, color: 'text-red-400' },
              { label: t.pages.reports.totalSavings, value: report.totalSavings, color: 'text-emerald-400' },
              { label: t.pages.reports.balance, value: report.balance, color: report.balance >= 0 ? 'text-cyan-400' : 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card rounded-2xl p-5">
                <p className="text-muted-foreground text-sm">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-base mb-4">{t.pages.reports.expenseByCategory}</h2>
            <div className="space-y-3">
              {report.byCategory.map(cat => {
                const pct = report.totalExpenses > 0 ? (cat.amount / report.totalExpenses) * 100 : 0
                const color = CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || '#6b7280'
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-sm">{cat.category}</span>
                        <span className="text-xs text-muted-foreground">({cat.count} {t.common.entries})</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(cat.amount)}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {report.salaries.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold text-base mb-4">{t.pages.reports.salaryEntries}</h2>
              <div className="space-y-3">
                {report.salaries.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{s.source}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(s.received_date)}</p>
                    </div>
                    <span className="font-bold text-orange-400">{formatCurrency(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.expenses.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold text-base mb-4">
                {t.pages.reports.allExpenses} ({report.expenses.length})
              </h2>
              <div className="space-y-2">
                {report.expenses.map(e => (
                  <div key={e.id} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[e.category as keyof typeof CATEGORY_COLORS] || '#6b7280' }}
                    >
                      {e.category.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{e.category}{e.notes && ` — ${e.notes}`}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.expense_date)}</p>
                    </div>
                    <span className="font-semibold text-red-400 text-sm flex-shrink-0">-{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="glass-card rounded-2xl p-16 text-center">
          <FileText className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{t.pages.reports.empty}</p>
        </div>
      )}
    </div>
  )
}
