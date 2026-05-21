'use client'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { MonthlySummary } from '@/types'

interface ExpenseChartProps {
  data: { category: string; amount: number; color: string }[]
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 text-sm">
        <p className="font-semibold" style={{ color: payload[0].payload.color }}>{payload[0].name}</p>
        <p className="text-foreground font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function ExpensePieChart({ data }: ExpenseChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No expenses this month
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={55}
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface TrendChartProps {
  data: MonthlySummary[]
}

const BarTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 text-sm space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyTrendChart({ data }: TrendChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data available yet
      </div>
    )
  }

  const chartData = data.map(d => ({
    month: d.month,
    Salary: d.total_salary,
    Expenses: d.total_expenses,
    Savings: d.total_savings,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} barGap={4} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<BarTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
        />
        <Bar dataKey="Salary" fill="hsl(30,95%,55%)" radius={[4,4,0,0]} />
        <Bar dataKey="Expenses" fill="hsl(0,72%,51%)" radius={[4,4,0,0]} />
        <Bar dataKey="Savings" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
