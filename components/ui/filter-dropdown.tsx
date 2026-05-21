'use client'

import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FilterDropdownProps {
  label: ReactNode
  children: ReactNode
  className?: string
}

export function FilterDropdown({ label, children, className }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border bg-transparent text-sm font-medium hover:bg-muted/50 transition-colors cursor-pointer ${className || ''}`}
      >
        {label}
        <ChevronDown className="w-4 h-4 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-border">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface FilterDropdownItemProps {
  onClick: () => void
  active?: boolean
  children: ReactNode
}

export function FilterDropdownItem({ onClick, active, children }: FilterDropdownItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={active ? 'text-primary' : ''}
    >
      {children}
    </DropdownMenuItem>
  )
}
