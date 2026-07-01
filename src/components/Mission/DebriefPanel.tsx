'use client'

export default function DebriefPanel({ debrief }: { debrief?: string[] | null }): JSX.Element | null {
  if (!debrief || debrief.length === 0) return null;

  return (
    <div className="text-left border border-hp-border rounded-md bg-hp-card p-3">
      <h4 className="text-indigo-500 dark:text-indigo-400 font-semibold text-sm">🧠 Phân tích — Tư duy kỹ sư bảo mật</h4>
      <ul className="mt-2 space-y-1.5">
        {debrief.map((point, i) => (
          <li key={i} className="text-hp-fg text-xs leading-relaxed flex gap-2">
            <span className="text-indigo-500 dark:text-indigo-400 select-none">▸</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
