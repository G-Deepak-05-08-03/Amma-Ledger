'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { ShoppingCart, X, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXPENSE_CATEGORIES } from '@/types'

const schema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be > 0'),
  category: z.string().min(1, 'Category is required'),
  expense_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  source_fund: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ExpenseFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: string
    amount: number
    category: string
    expense_date: string
    notes: string | null
    source_fund?: string | null
  } | null
}

// Common allocation/fund names (will also be loaded from DB)
const DEFAULT_FUNDS = ['Savings', 'Household Balance', 'Mother Personal', 'Emergency Fund']

export function ExpenseForm({ open, onClose, onSuccess, editData }: ExpenseFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [availableFunds, setAvailableFunds] = useState<string[]>(DEFAULT_FUNDS)

  // Load real fund names from past allocations
  useEffect(() => {
    const loadFunds = async () => {
      const { data } = await supabase
        .from('allocations')
        .select('allocated_to')
        .order('allocated_to')
      if (data && data.length > 0) {
        const unique = [...new Set(data.map((a: { allocated_to: string }) => a.allocated_to))] as string[]
        setAvailableFunds(unique)
      }

    }
    if (open) loadFunds()
  }, [open, supabase])

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editData ? {
      amount: editData.amount,
      category: editData.category,
      expense_date: editData.expense_date,
      notes: editData.notes || '',
      source_fund: editData.source_fund || '',
    } : {
      amount: undefined,
      category: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
      source_fund: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        amount: data.amount,
        category: data.category,
        expense_date: data.expense_date,
        notes: data.notes || null,
        source_fund: data.source_fund || null,
      }

      if (editData) {
        const { error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editData.id)
        if (error) throw error
        toast.success('Expense updated!')
      } else {
        const { error } = await supabase.from('expenses').insert({
          ...payload,
          paid_by: user.id,
        })
        if (error) throw error
        toast.success(
          data.source_fund
            ? `Expense added — drawn from ${data.source_fund}`
            : 'Expense added!'
        )
      }

      reset()
      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">{editData ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="500"
                className="h-12 bg-muted/50 text-base"
                {...register('amount')}
              />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                className="h-12 bg-muted/50"
                {...register('expense_date')}
              />
              {errors.expense_date && <p className="text-destructive text-xs">{errors.expense_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="h-12 bg-muted/50 text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-base py-3">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-destructive text-xs">{errors.category.message}</p>}
          </div>

          {/* Source of Funds */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              Source of Funds
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Controller
              control={control}
              name="source_fund"
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                  defaultValue={field.value || ''}
                >
                  <SelectTrigger className="h-12 bg-muted/50 text-base border-primary/30">
                    <SelectValue placeholder="Which fund pays for this?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="__none__" className="text-muted-foreground py-3">
                      — General spending (no fund) —
                    </SelectItem>
                    {availableFunds.map(fund => (
                      <SelectItem key={fund} value={fund} className="text-base py-3">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                          {fund}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Selecting a fund deducts this expense from that fund&apos;s available balance
            </p>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="e.g. Weekly grocery shopping"
              className="bg-muted/50 resize-none"
              rows={2}
              {...register('notes')}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 font-semibold"
              style={{ background: 'linear-gradient(135deg, hsl(187,76%,42%), hsl(200,84%,55%))' }}
            >
              {loading ? 'Saving...' : (
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {editData ? 'Update' : 'Save Expense'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
