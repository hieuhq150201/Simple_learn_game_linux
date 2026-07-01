'use client'

export type PanelKey = 'terms' | 'debrief' | 'commands'

interface IconToolbarProps {
  activePanel: PanelKey | null
  onToggle: (key: PanelKey) => void
  hasTerms: boolean
  hasDebrief: boolean
}

const BUTTONS: { key: PanelKey; label: string; icon: string; title: string }[] = [
  { key: 'terms',    label: '📚', icon: '📚', title: 'Thuật ngữ' },
  { key: 'debrief',  label: '🧠', icon: '🧠', title: 'Phân tích kỹ thuật' },
  { key: 'commands', label: '⌨',  icon: '⌨',  title: 'Lệnh cơ bản' },
]

export default function IconToolbar({ activePanel, onToggle, hasTerms, hasDebrief }: IconToolbarProps): JSX.Element {
  return (
    <div className="flex items-center gap-1 border-t border-b border-hp-border py-1.5">
      {BUTTONS.map(({ key, label, title }) => {
        if (key === 'terms' && !hasTerms) return null
        if (key === 'debrief' && !hasDebrief) return null
        const active = activePanel === key
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            title={title}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              active
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                : 'text-hp-muted hover:text-hp-fg hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
            }`}
          >
            <span>{label}</span>
            <span className="hidden sm:inline">{title}</span>
          </button>
        )
      })}
    </div>
  )
}
