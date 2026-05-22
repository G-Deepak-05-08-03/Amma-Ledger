'use client'

import { useAppStore } from '@/store/useStore'
import { translations } from './translations'

export function useTranslation() {
  const language = useAppStore((s) => s.language)
  return translations[language]
}
