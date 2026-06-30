'use client'
// Header: tên app, tiêu đề màn hình hiện tại, progress bar tổng. Hoàn toàn offline — không cần API key.
export default function Header({ title, progressPercent }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-term-border min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <img src="/logo.svg" className="w-7 h-7 shrink-0" alt="" />
        <span className="text-indigo-400 font-bold tracking-wide shrink-0">[HACKER PATH]</span>
        <span className="text-gray-400 text-sm truncate">{title}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
        <span className="hidden sm:inline text-xs text-gray-600">offline</span>
        <div className="hidden sm:block w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-400" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-xs text-gray-500">{progressPercent}%</span>
      </div>
    </header>
  );
}
