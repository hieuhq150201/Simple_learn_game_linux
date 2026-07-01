'use client'
import type { Stars } from '../../utils/xpCalc'

interface MissionStep {
  id: string
  description: string
}

interface MissionProgressProps {
  steps: MissionStep[]
  completedSteps: Set<string>
  starTarget?: Stars | null
}

export default function MissionProgress({ steps, completedSteps, starTarget }: MissionProgressProps): JSX.Element {
  const doneCount = steps.filter((s) => completedSteps.has(s.id)).length
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="flex flex-col gap-2">
      {/* Checklist */}
      <ul className="flex flex-col gap-1.5">
        {steps.map((step) => {
          const done = completedSteps.has(step.id)
          return (
            <li key={step.id} className={`flex items-start gap-2 text-sm ${done ? 'text-green-500 dark:text-green-400' : 'text-hp-muted'}`}>
              <span className="shrink-0 font-mono">{done ? '[✓]' : '[ ]'}</span>
              <span>{step.description}</span>
            </li>
          )
        })}
      </ul>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-hp-border">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-hp-subtle text-[10px] font-mono shrink-0">{doneCount}/{steps.length}</span>
      </div>

      {/* Star target — hiện khi mission đã xong */}
      {starTarget != null && (
        <div className="flex items-center gap-1 justify-end">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`text-base transition-opacity ${n <= starTarget ? 'opacity-100' : 'opacity-20'}`}
            >
              ⭐
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
