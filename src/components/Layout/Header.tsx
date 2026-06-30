'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ThemeToggle'

interface HeaderProps {
  title: string;
  progressPercent: number;
}

export default function Header({ title, progressPercent }: HeaderProps): JSX.Element {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-term-border min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <img src="/logo.svg" className="w-7 h-7 shrink-0" alt="" />
        <span className="text-indigo-400 font-bold tracking-wide shrink-0">[HACKER PATH]</span>
        <span className="text-gray-400 text-sm truncate">{title}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        <div className="hidden sm:block w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-400" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-xs text-gray-500">{progressPercent}%</span>

        <ThemeToggle />

        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="text-green-400 text-xs font-mono px-2 py-1 rounded hover:text-green-300 hover:bg-green-900/20 transition-colors">
              [{user.email}]
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-green-800">
              <DropdownMenuItem
                className="text-green-400 cursor-pointer hover:bg-gray-800"
                render={<a href="/profile" />}
              >
                Trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 cursor-pointer hover:bg-gray-800"
                onClick={() => logout()}
              >
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="text-green-600 text-xs font-mono px-2 py-1 rounded hover:text-green-400 hover:bg-green-900/20 transition-colors"
          >
            [ĐĂNG NHẬP]
          </Link>
        )}
      </div>
    </header>
  );
}
