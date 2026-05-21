# AmmaLedger UI Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 17 UI/accessibility/UX issues identified in the AmmaLedger audit.

**Architecture:** Incremental, file-scoped changes. No new pages. One new shadcn component (AlertDialog). Each task is independently committable. Tasks run in order — Task 9 (CATEGORY_ICONS) must precede Task 10 (expense list icons).

**Tech Stack:** Next.js 14, shadcn/ui, Tailwind CSS v4, Lucide React, Recharts, Zod, React Hook Form, Supabase

---

## File Map

| File | Changes |
|------|---------|
| `app/globals.css` | glass opacity, prefers-reduced-motion |
| `components/ui/alert-dialog.tsx` | ADD via shadcn CLI |
| `app/dashboard/expenses/page.tsx` | aria-labels, delete AlertDialog, race condition, remove duplicate filter, focus-visible pills |
| `app/dashboard/salary/page.tsx` | aria-labels, delete AlertDialog, race condition |
| `app/login/page.tsx` | password toggle aria-label |
| `app/dashboard/settings/page.tsx` | emoji → icon |
| `components/layout/MobileNav.tsx` | add Settings nav item |
| `app/dashboard/funds/page.tsx` | mobile grid breakpoint |
| `types/index.ts` | add CATEGORY_ICONS + SAVINGS_ALLOCATION_KEYWORDS |
| `components/dashboard/Charts.tsx` | BarChart → AreaChart for trend |
| `app/dashboard/reports/page.tsx` | auto-generate on month/year change |
| `app/dashboard/page.tsx` | month picker, fix savings calc |
| `components/dashboard/FundsOverview.tsx` | accept optional `funds` prop |

---

## Task 1: globals.css — Glass opacity + prefers-reduced-motion

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Fix glass card opacity and add reduced-motion block**

Replace the `.glass-card` block and add the media query at the bottom of `app/globals.css`:

```css
/* Glassmorphism card — 8% opacity (was 4%, too transparent) */
.glass-card {
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.12);
}
```

And append to the bottom of the file:

```css
/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
  * {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Also remove layout-shifting hover scale from StatCard**

In `components/dashboard/StatCards.tsx`, change line 40:
```tsx
// Before
<div className={`rounded-2xl p-5 transition-transform hover:scale-[1.02] duration-200 ${config.className}`}>

// After — use border highlight instead of scale
<div className={`rounded-2xl p-5 transition-colors duration-200 hover:brightness-110 ${config.className}`}>
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/deepakg/Documents/AmmaLedger"
git add app/globals.css components/dashboard/StatCards.tsx
git commit -m "fix: increase glass opacity, add prefers-reduced-motion, remove layout-shifting hover scale"
```

---

## Task 2: Add AlertDialog shadcn component

**Files:**
- Create: `components/ui/alert-dialog.tsx` (via CLI)

- [ ] **Step 1: Add via shadcn CLI**

```bash
cd "/Users/deepakg/Documents/AmmaLedger"
npx shadcn@latest add alert-dialog
```

Expected: creates `components/ui/alert-dialog.tsx`

- [ ] **Step 2: Verify file exists**

```bash
ls components/ui/alert-dialog.tsx
```

Expected: file listed

- [ ] **Step 3: Commit**

```bash
git add components/ui/alert-dialog.tsx
git commit -m "chore: add shadcn AlertDialog component"
```

---

## Task 3: expenses/page.tsx — aria-labels, AlertDialog for delete, race condition

**Files:**
- Modify: `app/dashboard/expenses/page.tsx`

The current code has three problems in one file:
1. `if (!confirm('Delete this expense?')) return` — native browser dialog
2. Edit/Delete buttons have no `aria-label`
3. No loading guard on delete (rapid taps fire two requests)

- [ ] **Step 1: Add AlertDialog state and import at top of `app/dashboard/expenses/page.tsx`**

Replace the import block (keep existing imports, add these):
```tsx
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
```

Add state after existing state declarations:
```tsx
const [deleteId, setDeleteId] = useState<string | null>(null)
const [deleteLoading, setDeleteLoading] = useState(false)
```

- [ ] **Step 2: Replace handleDelete function**

```tsx
const handleDelete = async () => {
  if (!deleteId) return
  setDeleteLoading(true)
  const { error } = await supabase.from('expenses').delete().eq('id', deleteId)
  if (error) toast.error('Failed to delete')
  else { toast.success('Expense deleted'); fetchExpenses() }
  setDeleteLoading(false)
  setDeleteId(null)
}
```

- [ ] **Step 3: Add aria-labels to edit/delete buttons and wire delete to setDeleteId**

In the expense list (around line 191), update the buttons:
```tsx
<button
  aria-label={`Edit ${expense.category} expense`}
  onClick={() => { setEditData(expense); setFormOpen(true) }}
  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
>
  <Pencil className="w-4 h-4" />
</button>
<button
  aria-label={`Delete ${expense.category} expense`}
  onClick={() => setDeleteId(expense.id)}
  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
>
  <Trash2 className="w-4 h-4" />
</button>
```

- [ ] **Step 4: Add AlertDialog at bottom of return JSX (before closing `</div>` and after `<ExpenseForm ...>`)**

```tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/expenses/page.tsx
git commit -m "fix: replace window.confirm with AlertDialog, add aria-labels, guard delete race condition"
```

---

## Task 4: salary/page.tsx — aria-labels, AlertDialog for delete, race condition

**Files:**
- Modify: `app/dashboard/salary/page.tsx`

Same three problems as expenses page.

- [ ] **Step 1: Add AlertDialog imports and state**

Add imports (same as Task 3 Step 1).

Add state after existing state declarations:
```tsx
const [deleteId, setDeleteId] = useState<string | null>(null)
const [deleteLoading, setDeleteLoading] = useState(false)
```

- [ ] **Step 2: Replace handleDelete**

```tsx
const handleDelete = async () => {
  if (!deleteId) return
  setDeleteLoading(true)
  const { error } = await supabase.from('salaries').delete().eq('id', deleteId)
  if (error) toast.error('Failed to delete')
  else { toast.success('Salary deleted'); fetchSalaries() }
  setDeleteLoading(false)
  setDeleteId(null)
}
```

- [ ] **Step 3: Update edit/delete buttons with aria-labels and wire delete**

In the salary list (around lines 119-130):
```tsx
<button
  aria-label={`Edit salary from ${salary.source}`}
  onClick={() => { setEditData(salary); setFormOpen(true) }}
  className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
>
  <Pencil className="w-4 h-4" />
</button>
<button
  aria-label={`Delete salary from ${salary.source}`}
  onClick={() => setDeleteId(salary.id)}
  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
>
  <Trash2 className="w-4 h-4" />
</button>
```

- [ ] **Step 4: Add AlertDialog before closing `</div>`**

```tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/salary/page.tsx
git commit -m "fix: replace window.confirm with AlertDialog, add aria-labels, guard delete race condition in salary"
```

---

## Task 5: login/page.tsx — password toggle aria-label

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Add aria-label to password toggle button (line ~100)**

```tsx
<button
  type="button"
  aria-label={showPassword ? 'Hide password' : 'Show password'}
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
>
  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
</button>
```

- [ ] **Step 2: Commit**

```bash
git add app/login/page.tsx
git commit -m "fix: add aria-label to password visibility toggle"
```

---

## Task 6: settings/page.tsx — replace emoji with Lucide icon

**Files:**
- Modify: `app/dashboard/settings/page.tsx`

- [ ] **Step 1: Add ClipboardList to imports**

Change the existing import line:
```tsx
import { Save, User, Wallet, ExternalLink, ClipboardList } from 'lucide-react'
```

- [ ] **Step 2: Replace emoji heading (line ~133)**

```tsx
// Before
<h3 className="font-semibold text-sm text-orange-400 mb-2">📋 Database Setup Required</h3>

// After
<h3 className="font-semibold text-sm text-orange-400 mb-2 flex items-center gap-2">
  <ClipboardList className="w-4 h-4" />
  Database Setup Required
</h3>
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/settings/page.tsx
git commit -m "fix: replace emoji icon with Lucide ClipboardList in settings"
```

---

## Task 7: MobileNav.tsx — add Settings

**Files:**
- Modify: `components/layout/MobileNav.tsx`

- [ ] **Step 1: Add Settings import and nav item**

```tsx
import { LayoutDashboard, IndianRupee, ShoppingCart, PiggyBank, FileText, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/dashboard/salary', icon: IndianRupee, label: 'Salary' },
  { href: '/dashboard/expenses', icon: ShoppingCart, label: 'Expenses' },
  { href: '/dashboard/funds', icon: PiggyBank, label: 'Funds' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]
```

The nav renders `items.map(...)` over `h-16` container with `justify-around`. 6 items in 375px = ~62px each which is fine (labels are `text-xs`). If it feels cramped, reduce padding: change `py-2` to `py-1` on the link.

- [ ] **Step 2: Commit**

```bash
git add components/layout/MobileNav.tsx
git commit -m "fix: add Settings to mobile navigation bar"
```

---

## Task 8: funds/page.tsx — mobile grid breakpoint for summary cards

**Files:**
- Modify: `app/dashboard/funds/page.tsx`

- [ ] **Step 1: Fix grid (line ~117)**

```tsx
// Before
<div className="grid grid-cols-3 gap-4">

// After
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
```

While here, also fix the card value size so it doesn't truncate on narrow screens:
```tsx
// Before
<p className={`text-xl font-bold mt-0.5 ${color}`}>{formatCurrency(value)}</p>

// After
<p className={`text-lg font-bold mt-0.5 ${color} truncate`}>{formatCurrency(value)}</p>
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/funds/page.tsx
git commit -m "fix: stack fund summary cards vertically on mobile"
```

---

## Task 9: types/index.ts — add CATEGORY_ICONS and SAVINGS_ALLOCATION_KEYWORDS

**Files:**
- Modify: `types/index.ts`

This task adds two new exports that Tasks 10 and 12 depend on.

- [ ] **Step 1: Add CATEGORY_ICONS and SAVINGS_ALLOCATION_KEYWORDS**

Append to `types/index.ts` after the existing `CATEGORY_COLORS` block:

```ts
import type { LucideIcon } from 'lucide-react'
import {
  ShoppingCart,
  Home,
  Zap,
  Droplets,
  Wifi,
  Car,
  HeartPulse,
  ShoppingBag,
  User,
  MoreHorizontal,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  Groceries:     ShoppingCart,
  Rent:          Home,
  Electricity:   Zap,
  Water:         Droplets,
  WiFi:          Wifi,
  Travel:        Car,
  Medical:       HeartPulse,
  Shopping:      ShoppingBag,
  Personal:      User,
  Miscellaneous: MoreHorizontal,
}

/** Allocation names containing any of these keywords count as "savings" */
export const SAVINGS_ALLOCATION_KEYWORDS = ['saving', 'savings'] as const
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add CATEGORY_ICONS map and SAVINGS_ALLOCATION_KEYWORDS constant"
```

---

## Task 10: expenses/page.tsx — replace 2-letter abbreviations with category icons + focus-visible on pills + remove duplicate filter

**Files:**
- Modify: `app/dashboard/expenses/page.tsx`

Three improvements in one file pass:
1. Replace `{expense.category.slice(0, 2).toUpperCase()}` with icon
2. Add `cursor-pointer` and `focus-visible` ring to category pills
3. Remove the `FilterDropdown` for category (keeping only the pills)

- [ ] **Step 1: Import CATEGORY_ICONS**

```tsx
import { EXPENSE_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Expense } from '@/types'
```

- [ ] **Step 2: Replace the category avatar in the expense list (around line 176)**

```tsx
// Before
<div
  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
  style={{ background: CATEGORY_COLORS[expense.category as keyof typeof CATEGORY_COLORS] || '#6b7280' }}
>
  {expense.category.slice(0, 2).toUpperCase()}
</div>

// After
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
```

- [ ] **Step 3: Add cursor-pointer and focus-visible to category filter pills (lines 128-151)**

```tsx
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
```

- [ ] **Step 4: Remove duplicate FilterDropdown for category**

Delete this block entirely (approximately lines 98-107):
```tsx
<FilterDropdown label={<span className="flex items-center gap-1"><Filter className="w-4 h-4" />{selectedCategory}</span>}>
  <FilterDropdownItem onClick={() => setSelectedCategory('All')} active={selectedCategory === 'All'}>
    All Categories
  </FilterDropdownItem>
  {EXPENSE_CATEGORIES.map(cat => (
    <FilterDropdownItem key={cat} onClick={() => setSelectedCategory(cat)} active={selectedCategory === cat}>
      {cat}
    </FilterDropdownItem>
  ))}
</FilterDropdown>
```

Also remove `Filter` from the lucide import since it's no longer used.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/expenses/page.tsx
git commit -m "fix: category icons in expense list, remove duplicate filter dropdown, focus-visible pills"
```

---

## Task 11: reports/page.tsx — auto-generate on month/year change

**Files:**
- Modify: `app/dashboard/reports/page.tsx`

- [ ] **Step 1: Convert generateReport to useEffect trigger**

Add `useEffect` import if not present. Add an `hasFetched` ref to skip initial auto-trigger on mount (user still sees the empty state on first load, but after selecting a month it auto-generates).

Replace the manual `generateReport` callback approach with an effect:

```tsx
import { useState, useCallback, useEffect, useRef } from 'react'

// Inside component, after state declarations:
const hasUserSelected = useRef(false)

useEffect(() => {
  if (!hasUserSelected.current) return
  generateReport()
}, [selectedMonth, selectedYear, generateReport])

// Track when user actively changes month/year
const handleMonthChange = (month: number) => {
  hasUserSelected.current = true
  setSelectedMonth(month)
}
const handleYearChange = (year: number) => {
  hasUserSelected.current = true
  setSelectedYear(year)
}
```

Update FilterDropdownItem onClick handlers:
```tsx
// Month picker
<FilterDropdownItem key={m} onClick={() => handleMonthChange(i + 1)} active={selectedMonth === i + 1}>
  {m}
</FilterDropdownItem>

// Year picker
<FilterDropdownItem key={y} onClick={() => handleYearChange(y)} active={selectedYear === y}>
  {y}
</FilterDropdownItem>
```

Keep the "Generate Report" button — it becomes the initial trigger and also a manual refresh.

- [ ] **Step 2: Show which month is currently displayed in report heading**

After the filter/button row, when a report is shown, add a subtitle above the stat cards:
```tsx
{report && !loading && (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground -mt-2">
      Showing report for <strong className="text-foreground">{MONTHS[selectedMonth - 1]} {selectedYear}</strong>
    </p>
    {/* ... rest of report ... */}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/reports/page.tsx
git commit -m "feat: auto-generate report on month/year change, add month label to report output"
```

---

## Task 12: dashboard/page.tsx — month picker + fix savings calculation

**Files:**
- Modify: `app/dashboard/page.tsx`

**Two changes:**
1. Add month/year state + picker to dashboard header
2. Replace fragile `includes('saving')` with `SAVINGS_ALLOCATION_KEYWORDS`

- [ ] **Step 1: Add month/year state and imports**

```tsx
import { CATEGORY_COLORS, SAVINGS_ALLOCATION_KEYWORDS } from '@/types'
import { FilterDropdown, FilterDropdownItem } from '@/components/ui/filter-dropdown'
import { MONTHS } from '@/lib/utils'
```

Add state:
```tsx
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)
```

- [ ] **Step 2: Update loadData to use selectedMonth/selectedYear instead of `new Date()`**

Replace the `now` usages:
```tsx
const loadData = useCallback(async () => {
  setLoading(true)
  const now = new Date(selectedYear, selectedMonth - 1, 1)
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
  const sixMonthsAgoStart = format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd')
  // ... rest unchanged
}, [supabase, selectedMonth, selectedYear])

useEffect(() => { loadData() }, [loadData])
```

- [ ] **Step 3: Fix savings calculation to use SAVINGS_ALLOCATION_KEYWORDS**

```tsx
// Before
const savingsAlloc = (r.allocations || []).find((a: any) =>
  a.allocated_to.toLowerCase().includes('saving')
)

// After
const savingsAlloc = (r.allocations || []).find((a: any) =>
  SAVINGS_ALLOCATION_KEYWORDS.some(kw => a.allocated_to.toLowerCase().includes(kw))
)
```

Apply the same fix in `app/dashboard/reports/page.tsx` (line ~46):
```tsx
const savingsAlloc = allocs.find(a =>
  SAVINGS_ALLOCATION_KEYWORDS.some(kw => a.allocated_to.toLowerCase().includes(kw))
)
```

- [ ] **Step 4: Add month/year picker to dashboard header**

Replace the header section:
```tsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
    <p className="text-muted-foreground text-sm mt-1">
      {MONTHS[selectedMonth - 1]} {selectedYear} overview
    </p>
  </div>
  <div className="flex items-center gap-2">
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
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx app/dashboard/reports/page.tsx
git commit -m "feat: dashboard month picker, fix fragile savings keyword matching"
```

---

## Task 13: Charts.tsx — switch monthly trend to AreaChart

**Files:**
- Modify: `components/dashboard/Charts.tsx`

- [ ] **Step 1: Replace BarChart with AreaChart imports**

```tsx
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
```

- [ ] **Step 2: Replace MonthlyTrendChart implementation**

```tsx
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
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gradSalary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(30,95%,55%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(30,95%,55%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0,72%,51%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(0,72%,51%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradSavings" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={48}
        />
        <Tooltip content={<BarTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
        />
        <Area type="monotone" dataKey="Salary" stroke="hsl(30,95%,55%)" strokeWidth={2} fill="url(#gradSalary)" dot={false} />
        <Area type="monotone" dataKey="Expenses" stroke="hsl(0,72%,51%)" strokeWidth={2} fill="url(#gradExpenses)" dot={false} />
        <Area type="monotone" dataKey="Savings" stroke="hsl(160,84%,39%)" strokeWidth={2} fill="url(#gradSavings)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/Charts.tsx
git commit -m "feat: switch 6-month trend from bar chart to area chart"
```

---

## Task 14: FundsOverview — accept optional props to skip duplicate fetch

**Files:**
- Modify: `components/dashboard/FundsOverview.tsx`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Add optional `funds` prop to FundsOverview**

```tsx
interface FundsOverviewProps {
  funds?: FundBalance[]
}

export function FundsOverview({ funds: propFunds }: FundsOverviewProps) {
  const supabase = createClient()
  const [funds, setFunds] = useState<FundBalance[]>(propFunds ?? [])
  const [loading, setLoading] = useState(!propFunds)

  const loadFunds = useCallback(async () => {
    // ... existing fetch logic unchanged ...
    setFunds(result)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    if (propFunds) return  // skip fetch when caller provides data
    loadFunds()
  }, [loadFunds, propFunds])
  
  // ... rest of component unchanged
```

- [ ] **Step 2: Compute and pass fund balances from dashboard**

In `app/dashboard/page.tsx`, add fund balance computation to `loadData` and store in state:

Add to data state type:
```tsx
fundBalances: { name: string; total_allocated: number; total_spent: number; available: number }[]
```

After `setData({...})` computation block, compute fundBalances:
```tsx
// Inside loadData, compute fund balances from already-fetched salaries+expenses:
const allocated: Record<string, number> = {}
const spent: Record<string, number> = {}
;(salaries || []).flatMap((s: any) => s.allocations || []).forEach((a: any) => {
  allocated[a.allocated_to] = (allocated[a.allocated_to] || 0) + a.amount
})
;(expenses || []).forEach((e: any) => {
  if (e.source_fund) spent[e.source_fund] = (spent[e.source_fund] || 0) + e.amount
})
const fundBalances = Object.keys(allocated).map(name => ({
  name,
  total_allocated: allocated[name],
  total_spent: spent[name] || 0,
  available: allocated[name] - (spent[name] || 0),
})).sort((a, b) => b.available - a.available)

setData({
  // ... existing fields ...
  fundBalances,
})
```

Pass to FundsOverview:
```tsx
<FundsOverview funds={data.fundBalances} />
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/FundsOverview.tsx app/dashboard/page.tsx
git commit -m "perf: eliminate duplicate fund data fetch on dashboard"
```

---

## Self-Review

**Spec coverage check:**
1. ✅ Glass opacity (Task 1)
2. ✅ AlertDialog for delete — expenses (Task 3), salary (Task 4)
3. ✅ aria-labels — expenses (Task 3), salary (Task 4), login (Task 5)
4. ✅ prefers-reduced-motion (Task 1)
5. ✅ Reports auto-generate (Task 11)
6. ✅ Funds 3-col mobile (Task 8)
7. ✅ Mobile nav Settings (Task 7)
8. ✅ Category icons (Tasks 9, 10)
9. ✅ Hardcoded dark class — intentionally left dark-only (next-themes is installed but unused; adding a theme toggle is scope creep beyond the audit)
10. ✅ Emoji in settings (Task 6)
11. ✅ focus-visible on pills (Task 10)
12. ✅ Dashboard month picker (Task 12)
13. ✅ Delete race condition (Tasks 3, 4)
14. ✅ Area chart (Task 13)
15. ✅ Fragile savings (Task 12)
16. ✅ Duplicate fund fetches (Task 14)
17. ✅ Duplicate category filter (Task 10)

**Placeholder scan:** No TBDs or "implement later" found.

**Type consistency:** `FundBalance` type used in Task 14 matches `types/index.ts` definition. `CATEGORY_ICONS` defined in Task 9, imported in Task 10. `SAVINGS_ALLOCATION_KEYWORDS` defined in Task 9, imported in Tasks 12 and 13.
