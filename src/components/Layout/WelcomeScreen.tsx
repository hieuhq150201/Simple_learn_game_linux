'use client'

export default function WelcomeScreen({ onStart }: { onStart: () => void }): JSX.Element {
  const steps = [
    'Chọn 1 chương trên bản đồ.',
    'Đọc nhiệm vụ bên trái rồi GÕ LỆNH THẬT vào terminal bên phải.',
    'Bí thì bấm nút 💡 Hint hoặc gõ `help` để xem các bước.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="animate-celebrate-in w-full max-w-lg border border-hp-border rounded-lg bg-hp-card p-6">
        <h1 className="text-2xl font-bold tracking-wide text-indigo-500 dark:text-indigo-400">HACKER PATH</h1>
        <p className="mt-1 text-sm text-hp-muted">
          Học Linux &amp; hacking bằng cách gõ lệnh thật — hoàn toàn tiếng Việt, chạy offline.
        </p>

        <div className="mt-5">
          <h2 className="text-xs uppercase tracking-wide text-hp-subtle">Cách chơi</h2>
          <ol className="mt-3 space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-indigo-400/60 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-hp-fg">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={onStart}
          className="mt-6 w-full rounded-md bg-green-500 dark:bg-green-400 py-2.5 font-semibold text-white dark:text-gray-950 transition-colors hover:bg-green-400 dark:hover:bg-green-300"
        >
          Bắt đầu Chương 1 →
        </button>
        <button
          onClick={onStart}
          className="mt-2 w-full text-xs text-hp-muted transition-colors hover:text-hp-fg"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
