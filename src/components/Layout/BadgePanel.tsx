'use client'

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
}

interface BadgePanelProps {
  badges?: Badge[];
  stats?: { commandsRun: number; hintsUsed: number };
}

// Hàng badge gamification + stats; nhận badges (mảng có flag unlocked) và stats từ useProgress
export default function BadgePanel({ badges = [], stats = { commandsRun: 0, hintsUsed: 0 } }: BadgePanelProps): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border border-term-border rounded-lg bg-gray-950/60">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Huy hiệu</span>
        {badges.map((badge) => (
          <span
            key={badge.id}
            title={`${badge.name} — ${badge.description}${badge.unlocked ? '' : ' (Chưa mở khoá)'}`}
            className={`text-xl select-none ${badge.unlocked ? '' : 'opacity-30 grayscale'}`}
          >
            {badge.unlocked ? badge.emoji : '🔒'}
          </span>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        ⌨ {stats.commandsRun} lệnh đã gõ · 💡 {stats.hintsUsed} hint đã dùng
      </div>
    </div>
  );
}
