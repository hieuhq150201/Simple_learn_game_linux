'use client'

type ChapterStatus = 'playable' | 'locked' | 'coming-soon';

interface ChapterCardProps {
  chapter: any;
  status: ChapterStatus;
  completedCount: number;
  onSelect: (id: number) => void;
}

// Card hiển thị 1 chương trên ChapterMap; 3 trạng thái: playable / locked / coming-soon
export default function ChapterCard({ chapter, status, completedCount, onSelect }: ChapterCardProps): JSX.Element {
  const playable = status === 'playable';

  const containerClass =
    status === 'playable'
      ? 'border-term-border bg-gray-950/60 hover:border-indigo-400/60 cursor-pointer'
      : status === 'locked'
      ? 'border-term-border bg-gray-950/30 opacity-60 cursor-not-allowed'
      : 'border-term-border bg-gray-950/20 opacity-40 cursor-not-allowed';

  return (
    <button
      onClick={() => playable && onSelect(chapter.id)}
      disabled={!playable}
      className={`text-left p-4 rounded-lg border transition-colors ${containerClass}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{playable ? chapter.badge : status === 'locked' ? '🔒' : '🚧'}</span>
        <span className="text-xs text-gray-500">
          {completedCount}/{chapter.missionCount}
        </span>
      </div>
      <h3 className="mt-2 font-semibold text-gray-100">
        Chương {chapter.id} — {chapter.title}
      </h3>
      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{chapter.story}</p>

      {playable && (
        <span className="mt-3 inline-block rounded-full border border-green-400/40 bg-green-400/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
          ▶ Bắt đầu
        </span>
      )}
      {status === 'locked' && (
        <p className="mt-2 text-xs text-yellow-400/80">
          Hoàn thành Chương {chapter.id - 1} để mở khoá
        </p>
      )}
      {status === 'coming-soon' && (
        <p className="mt-2 text-xs text-gray-600">Chương này đang được xây dựng</p>
      )}
    </button>
  );
}
