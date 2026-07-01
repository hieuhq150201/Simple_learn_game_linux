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
import { Avatar } from '@/components/Avatar'
import NotificationBell from '@/components/Layout/NotificationBell'

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps): JSX.Element {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-hp-border bg-hp-card min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <img src="/logo.svg" className="w-7 h-7 shrink-0" alt="" />
        <span className="text-indigo-400 font-bold tracking-wide shrink-0">[HACKER PATH]</span>
        <span className="text-hp-muted text-sm truncate">{title}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        <NotificationBell />
        <ThemeToggle />

        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-sm hover:ring-2 hover:ring-green-700 transition-all outline-none">
              <Avatar avatarUrl={user.avatarUrl} displayName={user.displayName} email={user.email} size={28} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-hp-card border-green-800">
              <DropdownMenuItem
                className="text-green-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                render={<Link href="/profile" />}
              >
                Trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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
