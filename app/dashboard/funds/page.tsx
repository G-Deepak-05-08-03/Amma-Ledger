'use client'

import { useEffect, useState, useCallback } from 'react'
import { PiggyBank, TrendingUp, TrendingDown, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FundBalance } from '@/types'

interface FundTransaction {
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  fund: string
}

export default function FundsPage() {
  const supabase = createClient()
  const [funds, setFunds] = useState<FundBalance[]>([])
  const [transactions, setTransactions] = useState<FundTransaction[]>([])
  const [selectedFund, setSelectedFund] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)

    const [{ data: allocations }, { data: expenses }] = await Promise.all([
      supabase
        .from('allocations')
        .select('allocated_to, amount, salary_id, created_at, salaries(received_date, source)')
        .order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('source_fund, amount, expense_date, category, notes')
        .not('source_fund', 'is', null)
        .order('expense_date', { ascending: false }),
    ])

    // Build fund balances
    const allocated: Record<string, number> = {}
    const spent: Record<string, number> = {}

    ;(allocations || []).forEach((a: { allocated_to: string; amount: number }) => {
      allocated[a.allocated_to] = (allocated[a.allocated_to] || 0) + a.amount
    })
    ;(expenses || []).forEach((e: { source_fund: string | null; amount: number }) => {
      if (e.source_fund) {
        spent[e.source_fund] = (spent[e.source_fund] || 0) + e.amount
      }
    })

    const result: FundBalance[] = Object.keys(allocated).map(name => ({
      name,
      total_allocated: allocated[name],
      total_spent: spent[name] || 0,
      available: allocated[name] - (spent[name] || 0),
    })).sort((a, b) => b.available - a.available)

    // Build transaction history
    const txns: FundTransaction[] = []
    ;(allocations || []).forEach((a: {
      allocated_to: string;
      amount: number;
      created_at: string;
      salaries: { received_date: string; source: string } | null
    }) => {
      txns.push({
        date: a.salaries?.received_date || a.created_at,
        description: `Salary allocation — ${a.salaries?.source || 'Salary'}`,
        amount: a.amount,
        type: 'credit',
        fund: a.allocated_to,
      })
    })
    ;(expenses || []).forEach((e: {
      source_fund: string | null;
      amount: number;
      expense_date: string;
      category: string;
      notes: string | null
    }) => {
      if (e.source_fund) {
        txns.push({
          date: e.expense_date,
          description: e.notes ? `${e.category} — ${e.notes}` : e.category,
          amount: e.amount,
          type: 'debit',
          fund: e.source_fund,
        })
      }
    })
    txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFunds(result)
    setTransactions(txns)
    setLoading(false)
  }, [supabase])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  const filteredTxns = selectedFund
    ? transactions.filter(t => t.fund === selectedFund)
    : transactions

  const totalAvailable = funds.reduce((s, f) => s + Math.max(f.available, 0), 0)
  const totalAllocated = funds.reduce((s, f) => s + f.total_allocated, 0)
  const totalSpent = funds.reduce((s, f) => s + f.total_spent, 0)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Funds</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your allocation buckets and spending from each fund</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Allocated', value: totalAllocated, icon: TrendingUp, color: 'text-orange-400', gradient: 'hsl(30,95%,55%), hsl(45,100%,65%)' },
          { label: 'Spent from Funds', value: totalSpent, icon: TrendingDown, color: 'text-red-400', gradient: 'hsl(0,84%,60%), hsl(15,90%,55%)' },
          { label: 'Total Available', value: totalAvailable, icon: PiggyBank, color: 'text-emerald-400', gradient: 'hsl(160,84%,39%), hsl(175,80%,45%)' },
        ].map(({ label, value, icon: Icon, color, gradient }) => (
          <div key={label} className="glass-card rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, ${gradient})` }} />
            <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${gradient})` }}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className={`text-lg font-bold mt-0.5 truncate ${color}`}>{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Fund Balances */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-muted/60 rounded w-32 mb-3" />
              <div className="h-2 bg-muted/60 rounded mb-2" />
              <div className="h-3 bg-muted/40 rounded w-48" />
            </div>
          ))}
        </div>
      ) : funds.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <PiggyBank className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No fund allocations yet.</p>
          <p className="text-xs text-muted-foreground mt-2">Add salary entries with allocations to start tracking funds.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-base">Fund Balances</h2>
          {funds.map(fund => {
            const usedPct = fund.total_allocated > 0
              ? Math.min((fund.total_spent / fund.total_allocated) * 100, 100)
              : 0
            const isOverdrawn = fund.available < 0
            const isSelected = selectedFund === fund.name

            return (
              <button
                key={fund.name}
                onClick={() => setSelectedFund(isSelected ? null : fund.name)}
                className={`w-full text-left rounded-2xl p-5 border transition-all ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'glass-card hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isOverdrawn ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }}>
                      <Wallet className={`w-5 h-5 ${isOverdrawn ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{fund.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {fund.total_spent > 0 ? `${formatCurrency(fund.total_spent)} spent` : 'No withdrawals yet'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${isOverdrawn ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formatCurrency(fund.available)}
                    </p>
                    <p className="text-xs text-muted-foreground">available</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${usedPct}%`,
                      background: isOverdrawn
                        ? 'hsl(0,84%,60%)'
                        : usedPct > 80 ? 'hsl(38,92%,50%)' : 'hsl(160,84%,39%)',
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Total added: {formatCurrency(fund.total_allocated)}</span>
                  <span>{Math.round(usedPct)}% used</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Transaction History */}
      {!loading && transactions.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">
              {selectedFund ? `${selectedFund} — History` : 'All Fund Transactions'}
            </h2>
            {selectedFund && (
              <button
                onClick={() => setSelectedFund(null)}
                className="text-xs text-primary hover:underline"
              >
                Show all
              </button>
            )}
          </div>

          {filteredTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions for this fund yet.</p>
          ) : (
            <div className="space-y-2">
              {filteredTxns.map((txn, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    txn.type === 'credit' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                  }`}>
                    {txn.type === 'credit'
                      ? <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                      : <ArrowDownCircle className="w-5 h-5 text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(txn.date)}
                      {!selectedFund && <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{txn.fund}</span>}
                    </p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${
                    txn.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {txn.type === 'credit' ? '+' : '−'}{formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
