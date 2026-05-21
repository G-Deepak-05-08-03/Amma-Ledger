'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, ShoppingCart, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { FilterDropdown, FilterDropdownItem } from '@/components/ui/filter-dropdown'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Expense } from '@/types'

export default function ExpensesPage() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<Expense | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const end = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]

    let query = supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', start)
      .lte('expense_date', end)
      .order('expense_date', { ascending: false })

    if (selectedCategory !== 'All') {
      query = query.eq('category', selectedCategory)
    }

    const { data, error } = await query
    if (error) toast.error('Failed to load expenses')
    else setExpenses(data || [])
    setLoading(false)
  }, [selectedMonth, selectedYear, selectedCategory, supabase])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    const { error } = await supabase.from('expenses').delete().eq('id', deleteId)
    if (error) toast.error('Failed to delete')
    else { toast.success('Expense deleted'); fetchExpenses() }
    setDeleteLoading(false)
    setDeleteId(null)
  }

  const filtered = expenses.filter(e =>
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    (e.notes || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and categorize household expenses</p>
        </div>
        <Button
          onClick={() => { setEditData(null); setFormOpen(true) }}
          className="h-11 font-semibold"
          style={{ background: 'linear-gradient(135deg, hsl(187,76%,42%), hsl(200,84%,55%))' }}
        >
          <Plus className="w-5 h-5 mr-2" /> Add Expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="h-10 pl-9 bg-muted/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {totalExpenses > 0 && (
          <div className="text-sm whitespace-nowrap">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-red-400">{formatCurrency(totalExpenses)}</span>
          </div>
        )}
      </div>

      {/* Category quick filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedCategory === 'All' ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {EXPENSE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={selectedCategory === cat ? {
              background: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS],
              borderColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS],
              color: 'white',
            } : { background: 'rgba(255,255,255,0.05)', borderColor: 'transparent', color: 'hsl(var(--muted-foreground))' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No expenses found</p>
          <Button
            onClick={() => { setEditData(null); setFormOpen(true) }}
            className="mt-4 h-10"
            style={{ background: 'linear-gradient(135deg, hsl(187,76%,42%), hsl(200,84%,55%))' }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add First Expense
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(expense => (
            <div key={expense.id}
              className="glass-card rounded-2xl px-5 py-4 flex items-center justify-between gap-4 transition-all hover:border-border">
              <div className="flex items-center gap-4 min-w-0">
                {(() => {
                  const CategoryIcon = CATEGORY_ICONS[expense.category as keyof typeof CATEGORY_ICONS]
                  return (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || '#6b7280' }}
                    >
                      {CategoryIcon && <CategoryIcon className="w-5 h-5 text-white" />}
                    </div>
                  )
                })()}
                <div className="min-w-0">
                  <p className="font-medium text-sm">{expense.category}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(expense.expense_date)}
                    {expense.notes && ` · ${expense.notes}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-bold text-red-400">-{formatCurrency(expense.amount)}</span>
                <button
                  aria-label={`Edit ${expense.category} expense`}
                  onClick={() => { setEditData(expense); setFormOpen(true) }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  aria-label={`Delete ${expense.category} expense`}
                  onClick={() => setDeleteId(expense.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null) }}
        onSuccess={fetchExpenses}
        editData={editData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
