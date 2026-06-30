'use client'
// Nút hint hiển thị trong sidebar — bấm sẽ gửi lệnh `hint` vào terminal (3 cấp độ tăng dần)
export default function HintSystem({ onRequestHint, hintsUsedCount, maxHints }) {
  return (
    <button
      onClick={onRequestHint}
      disabled={hintsUsedCount >= maxHints}
      className="flex items-center justify-center gap-2 w-full py-2 rounded-md border border-yellow-400/40 text-yellow-400 text-sm hover:bg-yellow-400/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      💡 Hint ({hintsUsedCount}/{maxHints})
    </button>
  );
}
