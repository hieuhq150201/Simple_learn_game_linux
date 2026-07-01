'use client'

type ChapterStatus = 'playable' | 'locked' | 'coming-soon';

interface ChapterCardProps {
  chapter: any;
  status: ChapterStatus;
  completedCount: number;
  onSelect: (id: number) => void;
}

export default function ChapterCard({ chapter, status, completedCount, onSelect }: ChapterCardProps): JSX.Element {
  const playable = status === 'playable';

  const containerClass =
    status === 'playable'
      ? 'border-hp-border bg-hp-card hover:border-indigo-400/60 cursor-pointer'
      : status === 'locked'
      ? 'border-hp-border bg-hp-card opacity-60 cursor-not-allowed'
      : 'border-hp-border bg-hp-card opacity-40 cursor-not-allowed';

  return (
    <button
      onClick={() => playable && onSelect(chapter.id)}
      disabled={!playable}
      className={`text-left p-4 rounded-lg border transition-colors ${containerClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{playable ? chapter.badge : status === 'locked' ? '🔒' : '🚧'}</span>
        <span className="text-xs text-hp-subtle">
          {completedCount}/{chapter.missionCount}
        </span>
      </div>
      <h3 className="mt-2 font-semibold text-hp-fg">
        Chương {chapter.id} — {chapter.title}
      </h3>
      <p className="mt-1 text-xs text-hp-muted line-clamp-2">{chapter.story}</p>

      {playable && (
        <span className="mt-3 inline-block rounded-full border border-green-400/40 bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
          ▶ Bắt đầu
        </span>
      )}
      {status === 'locked' && (
        <p className="mt-2 text-xs text-yellow-500 dark:text-yellow-400/80">
          Hoàn thành Chương {chapter.id - 1} để mở khoá
        </p>
      )}
      {status === 'coming-soon' && (
        <p className="mt-2 text-xs text-hp-subtle">Chương này đang được xây dựng</p>
      )}
    </button>
  );
}
