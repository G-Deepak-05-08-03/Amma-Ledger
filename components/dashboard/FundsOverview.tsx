'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wallet, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { FundBalance } from '@/types'

interface FundsOverviewProps {
  funds?: FundBalance[]
}

export function FundsOverview({ funds: propFunds }: FundsOverviewProps = {}) {
  const supabase = createClient()
  const [funds, setFunds] = useState<FundBalance[]>(propFunds ?? [])
  const [loading, setLoading] = useState(!propFunds)

  const loadFunds = useCallback(async () => {
    setLoading(true)

    // 1 & 2: Get all allocations and expenses in parallel
    const [
      { data: allocations },
      { data: expenses }
    ] = await Promise.all([
      supabase
        .from('allocations')
        .select('allocated_to, amount'),
      supabase
        .from('expenses')
        .select('source_fund, amount')
        .not('source_fund', 'is', null)
    ])

    if (!allocations) { setLoading(false); return }

    // Sum up allocated amounts per fund
    const allocated: Record<string, number> = {}
    allocations.forEach((a: { allocated_to: string; amount: number }) => {
      allocated[a.allocated_to] = (allocated[a.allocated_to] || 0) + a.amount
    })

    // Sum up spent amounts per fund
    const spent: Record<string, number> = {}
    ;(expenses || []).forEach((e: { source_fund: string | null; amount: number }) => {
      if (e.source_fund) {
        spent[e.source_fund] = (spent[e.source_fund] || 0) + e.amount
      }
    })

    // Build fund balances
    const result: FundBalance[] = Object.keys(allocated).map(name => ({
      name,
      total_allocated: allocated[name],
      total_spent: spent[name] || 0,
      available: allocated[name] - (spent[name] || 0),
    }))
    // Sort: highest available first
    result.sort((a, b) => b.available - a.available)

    setFunds(result)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (propFunds) return
    loadFunds()
  }, [loadFunds, propFunds])

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-pulse">
        <div className="h-5 bg-muted/60 rounded w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (funds.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <PiggyBank className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No fund allocations yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add salary entries with allocations to track funds.</p>
      </div>
    )
  }

  const totalAvailable = funds.reduce((s, f) => s + Math.max(f.available, 0), 0)

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(30,95%,55%), hsl(45,100%,65%))' }}>
            <PiggyBank className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-semibold">Fund Balances</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total Available</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalAvailable)}</p>
        </div>
      </div>

      {/* Fund rows */}
      <div className="space-y-3">
        {funds.map(fund => {
          const usedPct = fund.total_allocated > 0
            ? Math.min((fund.total_spent / fund.total_allocated) * 100, 100)
            : 0
          const isOverdrawn = fund.available < 0

          return (
            <div key={fund.name} className="rounded-xl p-4 border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{fund.name}</span>
                  {isOverdrawn && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                      Overdrawn
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${isOverdrawn ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(fund.available)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usedPct}%`,
                    background: isOverdrawn
                      ? 'hsl(0,84%,60%)'
                      : usedPct > 80
                        ? 'hsl(38,92%,50%)'
                        : 'hsl(160,84%,39%)',
                  }}
                />
              </div>

              {/* Sub-stats */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-orange-400" />
                  Allocated: {formatCurrency(fund.total_allocated)}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  Spent: {formatCurrency(fund.total_spent)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
