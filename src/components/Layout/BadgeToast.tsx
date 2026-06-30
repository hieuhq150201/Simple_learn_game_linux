'use client'

interface BadgeToastProps {
  badge?: { emoji: string; name: string } | null;
}

// Toast tạm hiện khi vừa unlock 1 badge mới, tự ẩn sau vài giây
export default function BadgeToast({ badge }: BadgeToastProps): JSX.Element | null {
  if (!badge) return null;

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg border border-indigo-400/40 bg-gray-950/95 animate-celebrate-in">
      <span className="text-3xl">{badge.emoji}</span>
      <div>
        <p className="text-green-400 text-sm font-semibold">Mở khoá badge mới!</p>
        <p className="text-gray-300 text-xs">{badge.name}</p>
      </div>
    </div>
  );
}
