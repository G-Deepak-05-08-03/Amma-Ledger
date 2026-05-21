export type UserRole = 'admin' | 'member'

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
}

export interface Salary {
  id: string
  amount: number
  received_date: string
  source: string
  notes: string | null
  created_by: string
  created_at: string
  allocations?: Allocation[]
}

export interface Allocation {
  id: string
  salary_id: string
  allocated_to: string
  amount: number
  created_at: string
}

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  expense_date: string
  notes: string | null
  paid_by: string
  source_fund: string | null   // Which fund this expense is drawn from
  created_at: string
}

export interface FundBalance {
  name: string           // e.g. "Savings", "Household Balance", "Mother Personal"
  total_allocated: number  // Sum of all allocations to this fund
  total_spent: number      // Sum of expenses drawn from this fund
  available: number        // total_allocated - total_spent
}

export type ExpenseCategory =
  | 'Groceries'
  | 'Rent'
  | 'Electricity'
  | 'Water'
  | 'WiFi'
  | 'Travel'
  | 'Medical'
  | 'Shopping'
  | 'Personal'
  | 'Miscellaneous'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Groceries',
  'Rent',
  'Electricity',
  'Water',
  'WiFi',
  'Travel',
  'Medical',
  'Shopping',
  'Personal',
  'Miscellaneous',
]

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Groceries: '#f97316',
  Rent: '#8b5cf6',
  Electricity: '#eab308',
  Water: '#06b6d4',
  WiFi: '#3b82f6',
  Travel: '#10b981',
  Medical: '#ef4444',
  Shopping: '#ec4899',
  Personal: '#f59e0b',
  Miscellaneous: '#6b7280',
}

export interface MonthlySummary {
  month: string
  year: number
  total_salary: number
  total_expenses: number
  total_savings: number
  balance: number
}

export interface DashboardData {
  totalSalaryThisMonth: number
  totalExpensesThisMonth: number
  totalSavingsThisMonth: number
  balanceThisMonth: number
  recentExpenses: Expense[]
  monthlyTrend: MonthlySummary[]
  expensesByCategory: { category: string; amount: number; color: string }[]
}
