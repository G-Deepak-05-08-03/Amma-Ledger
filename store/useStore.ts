import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'en' | 'ta' | 'kn'

interface AppState {
  selectedMonth: number
  selectedYear: number
  setSelectedMonth: (month: number) => void
  setSelectedYear: (year: number) => void
  userName: string
  userEmail: string
  setUserProfile: (name: string, email: string) => void
  language: Language
  setLanguage: (lang: Language) => void
}

const now = new Date()

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedYear: (year) => set({ selectedYear: year }),
      userName: '',
      userEmail: '',
      setUserProfile: (name, email) => set({ userName: name, userEmail: email }),
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    { name: 'ammaledger-store' }
  )
)
