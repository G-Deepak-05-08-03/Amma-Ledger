'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, IndianRupee } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { SalaryForm } from '@/components/salary/SalaryForm'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import type { Salary } from '@/types'

export default function SalaryPage() {
  const supabase = createClient()
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<Salary | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchSalaries = useCallback(async () => {
    setLoading(true)
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const end = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('salaries')
      .select('*, allocations(*)')
      .gte('received_date', start)
      .lte('received_date', end)
      .order('received_date', { ascending: false })
    if (error) toast.error('Failed to load salaries')
    else setSalaries(data || [])
    setLoading(false)
  }, [selectedMonth, selectedYear, supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSalaries() }, [fetchSalaries])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    const { error } = await supabase.from('salaries').delete().eq('id', deleteId)
    if (error) toast.error('Failed to delete')
    else { toast.success('Salary deleted'); fetchSalaries() }
    setDeleteLoading(false)
    setDeleteId(null)
  }

  const totalSalary = salaries.reduce((s, r) => s + r.amount, 0)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Salary</h1>
          <p className="text-muted-foreground text-sm mt-1">Track monthly salary and allocations</p>
        </div>
        <Button
          onClick={() => { setEditData(null); setFormOpen(true) }}
          className="h-11 font-semibold glow-saffron"
          style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}
        >
          <Plus className="w-5 h-5 mr-2" /> Add Salary
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
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

        {totalSalary > 0 && (
          <div className="ml-auto text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-orange-400">{formatCurrency(totalSalary)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : salaries.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <IndianRupee className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No salary entries for this month</p>
          <Button
            onClick={() => { setEditData(null); setFormOpen(true) }}
            className="mt-4 h-10"
            style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add First Salary
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {salaries.map(salary => (
            <div key={salary.id} className="glass-card rounded-2xl p-5 transition-all hover:border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xl font-bold text-orange-400">{formatCurrency(salary.amount)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{salary.source} · {formatDate(salary.received_date)}</p>
                  {salary.notes && <p className="text-xs text-muted-foreground mt-1 italic">{salary.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    aria-label={`Edit salary from ${salary.source}`}
                    onClick={() => { setEditData(salary); setFormOpen(true) }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    aria-label={`Delete salary from ${salary.source}`}
                    onClick={() => setDeleteId(salary.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {(salary.allocations || []).length > 0 && (
                <div className="border-t border-border/40 pt-3">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Allocations</p>
                  <div className="flex flex-wrap gap-2">
                    {(salary.allocations || []).map((a: { id: string; allocated_to: string; amount: number }) => (
                      <Badge key={a.id} variant="secondary" className="text-xs py-1 px-3 bg-muted/60">
                        {a.allocated_to}: <strong className="ml-1">{formatCurrency(a.amount)}</strong>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SalaryForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null) }}
        onSuccess={fetchSalaries}
        editData={editData}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete salary entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also remove all allocations linked to this salary entry. Cannot be undone.
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
