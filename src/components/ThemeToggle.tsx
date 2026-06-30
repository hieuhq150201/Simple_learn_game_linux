'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-gray-400 hover:text-green-400">
          {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900 border-green-800">
        <DropdownMenuItem onClick={() => setTheme('light')} className="text-green-400 cursor-pointer hover:bg-gray-800">☀️ Sáng</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="text-green-400 cursor-pointer hover:bg-gray-800">🌙 Tối</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="text-green-400 cursor-pointer hover:bg-gray-800">💻 Hệ thống</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
