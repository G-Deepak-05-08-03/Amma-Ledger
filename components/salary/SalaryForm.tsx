'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2, IndianRupee, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/useTranslation'

const allocationSchema = z.object({
  allocated_to: z.string().min(1, 'Name required'),
  amount: z.coerce.number().min(0, 'Amount must be ≥ 0'),
})

const schema = z.object({
  amount: z.coerce.number().min(1, 'Amount is required'),
  received_date: z.string().min(1, 'Date is required'),
  source: z.string().min(1, 'Source is required'),
  notes: z.string().optional(),
  allocations: z.array(allocationSchema).min(1, 'Add at least one allocation'),
})

type FormData = z.infer<typeof schema>

interface SalaryFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: {
    id: string
    amount: number
    received_date: string
    source: string
    notes: string | null
    allocations?: { id: string; allocated_to: string; amount: number }[]
  } | null
}

export function SalaryForm({ open, onClose, onSuccess, editData }: SalaryFormProps) {
  const supabase = createClient()
  const t = useTranslation()
  const [loading, setLoading] = useState(false)

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editData ? {
      amount: editData.amount,
      received_date: editData.received_date,
      source: editData.source,
      notes: editData.notes || '',
      allocations: editData.allocations ?? [],
    } : {
      amount: undefined,
      received_date: new Date().toISOString().split('T')[0],
      source: '',
      notes: '',
      allocations: [
        { allocated_to: 'Mother Personal', amount: 5000 },
        { allocated_to: 'Savings', amount: 10000 },
        { allocated_to: 'Household Balance', amount: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'allocations' })
  const watchAmount = watch('amount')
  const watchAllocations = watch('allocations')
  const totalAllocated = (watchAllocations || []).reduce((s, a) => s + (Number(a.amount) || 0), 0)
  const remaining = (Number(watchAmount) || 0) - totalAllocated

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editData) {
        const { error } = await supabase
          .from('salaries')
          .update({ amount: data.amount, received_date: data.received_date, source: data.source, notes: data.notes || null })
          .eq('id', editData.id)
        if (error) throw error

        await supabase.from('allocations').delete().eq('salary_id', editData.id)
        const allocs = data.allocations.map(a => ({ salary_id: editData.id, allocated_to: a.allocated_to, amount: a.amount }))
        const { error: allocError } = await supabase.from('allocations').insert(allocs)
        if (allocError) throw allocError
        toast.success(t.forms.salary.toastUpdated)
      } else {
        const { data: salary, error } = await supabase
          .from('salaries')
          .insert({ amount: data.amount, received_date: data.received_date, source: data.source, notes: data.notes || null, created_by: user.id })
          .select()
          .single()
        if (error) throw error

        const allocs = data.allocations.map(a => ({ salary_id: salary.id, allocated_to: a.allocated_to, amount: a.amount }))
        const { error: allocError } = await supabase.from('allocations').insert(allocs)
        if (allocError) throw allocError
        toast.success(t.forms.salary.toastAdded)
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editData ? t.forms.salary.editTitle : t.forms.salary.addTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.forms.salary.amountLabel}</Label>
              <Input
                type="number"
                placeholder="50000"
                className="h-11 bg-muted/50"
                {...register('amount')}
              />
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t.forms.salary.dateLabel}</Label>
              <Input
                type="date"
                className="h-11 bg-muted/50"
                {...register('received_date')}
              />
              {errors.received_date && <p className="text-destructive text-xs">{errors.received_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.forms.salary.sourceLabel}</Label>
            <Input
              placeholder={t.forms.salary.sourcePH}
              className="h-11 bg-muted/50"
              {...register('source')}
            />
            {errors.source && <p className="text-destructive text-xs">{errors.source.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t.forms.salary.notesLabel} ({t.common.optional})</Label>
            <Textarea
              placeholder={t.forms.salary.notesPH}
              className="bg-muted/50 resize-none"
              rows={2}
              {...register('notes')}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t.forms.salary.allocationsLabel}</Label>
              <div className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  background: remaining < 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                  color: remaining < 0 ? '#ef4444' : '#10b981'
                }}>
                {remaining < 0 ? t.forms.salary.overBy : t.forms.salary.unallocated}: {formatCurrency(Math.abs(remaining))}
              </div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder={t.forms.salary.allocationNamePH}
                    className="h-10 bg-muted/50 text-sm"
                    {...register(`allocations.${index}.allocated_to`)}
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    placeholder={t.forms.salary.allocationAmountPH}
                    className="h-10 bg-muted/50 text-sm"
                    {...register(`allocations.${index}.amount`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {errors.allocations && (
              <p className="text-destructive text-xs">{errors.allocations.message}</p>
            )}

            <button
              type="button"
              onClick={() => append({ allocated_to: '', amount: 0 })}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" /> {t.forms.salary.addAllocation}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
              <X className="w-4 h-4 mr-2" /> {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 font-semibold"
              style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}
            >
              {loading ? t.common.saving : (
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  {editData ? t.common.update : t.forms.salary.saveBtn}
                </span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
