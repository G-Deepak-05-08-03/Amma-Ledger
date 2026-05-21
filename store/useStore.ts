import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
}

const now = new Date()

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedYear: (year) => set({ selectedYear: year }),
    }),
    { name: 'ammaledger-store' }
  )
)
