'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <path d="M8 21h8M12 17v4"/>
    </svg>
  )
}

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  const Icon = theme === 'dark' ? MoonIcon : theme === 'light' ? SunIcon : MonitorIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-8 h-8 flex items-center justify-center text-hp-muted hover:text-hp-fg rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none">
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-hp-card border-hp-border min-w-[130px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="text-hp-fg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-2"
        >
          <SunIcon /> Sáng
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="text-hp-fg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-2"
        >
          <MoonIcon /> Tối
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="text-hp-fg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 gap-2"
        >
          <MonitorIcon /> Hệ thống
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
