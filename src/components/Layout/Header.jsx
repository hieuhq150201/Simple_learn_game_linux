// Header: tên app, tiêu đề màn hình hiện tại, progress bar tổng. Hoàn toàn offline — không cần API key.
export default function Header({ title, progressPercent }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-term-border">
      <div className="flex items-center gap-3">
        <span className="text-indigo-400 font-bold tracking-wide">[HACKER PATH]</span>
        <span className="text-gray-400 text-sm">{title}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600">offline</span>
        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-400" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-xs text-gray-500">{progressPercent}%</span>
      </div>
    </header>
  );
}
