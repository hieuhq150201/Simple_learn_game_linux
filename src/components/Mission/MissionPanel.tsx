'use client'
import { useState } from 'react'
import MissionProgress from './MissionProgress'
import HintSystem from './HintSystem'
import DebriefPanel from './DebriefPanel'
import TermsPanel from './TermsPanel'
import CommandCheatsheet from './CommandCheatsheet'
import SlidePanel from './SlidePanel'
import IconToolbar from './IconToolbar'
import type { Stars } from '../../utils/xpCalc'

type PanelKey = 'terms' | 'debrief' | 'commands'

interface MissionPanelProps {
  mission: any
  completedSteps: Set<string>
  hintsUsedCount: number
  onRequestHint: () => void
  missionCompleted: boolean
  missionStars?: Stars | null
  onNextMission?: () => void
  onBackToMap?: () => void
}

export default function MissionPanel({
  mission, completedSteps, hintsUsedCount, onRequestHint,
  missionCompleted, missionStars, onNextMission, onBackToMap,
}: MissionPanelProps): JSX.Element {
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null)

  function togglePanel(key: PanelKey) {
    setActivePanel((prev) => (prev === key ? null : key))
  }

  return (
    <div className="relative flex flex-col lg:h-full border border-hp-border rounded-lg bg-hp-card lg:overflow-hidden">
      {/* Main scrollable content */}
      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
        {/* Mission header */}
        <div>
          <h2 className="text-indigo-400 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest">
            Mission {mission.id}
          </h2>
          <h3 className="text-hp-fg font-semibold mt-1">{mission.title}</h3>
        </div>

        <p className="text-hp-muted text-sm leading-relaxed">{mission.story}</p>

        <div>
          <h4 className="text-hp-subtle text-[10px] uppercase tracking-wide mb-2">Checklist</h4>
          <MissionProgress
            steps={mission.steps}
            completedSteps={completedSteps}
            starTarget={missionCompleted ? missionStars : null}
          />
        </div>

        {/* Icon toolbar */}
        <IconToolbar
          activePanel={activePanel}
          onToggle={togglePanel}
          hasTerms={Boolean(mission.terms?.length)}
          hasDebrief={missionCompleted && Boolean(mission.debrief?.length)}
        />

        {/* Hint / completion */}
        {missionCompleted ? (
          <div className="animate-celebrate-in border border-green-400/40 rounded-md p-3 text-center">
            <p className="text-green-500 dark:text-green-400 font-semibold text-sm">
              Mission hoàn thành! 🎉
            </p>
            <div className="flex flex-col gap-2 mt-3">
              {onNextMission && (
                <button
                  onClick={onNextMission}
                  className="text-sm text-white bg-green-600 hover:bg-green-500 rounded-md py-2 font-semibold transition-colors"
                >
                  Mission tiếp theo →
                </button>
              )}
              {onBackToMap && (
                <button
                  onClick={onBackToMap}
                  className="text-sm text-hp-fg border border-hp-border hover:border-indigo-400/60 rounded-md py-2 transition-colors"
                >
                  Về bản đồ chương
                </button>
              )}
            </div>
          </div>
        ) : mission.noHints ? (
          <p className="text-hp-muted text-xs text-center py-2 border border-hp-border rounded-md">
            ☠ Elite — tự lực 100%, không có hint.
          </p>
        ) : (
          <HintSystem
            onRequestHint={onRequestHint}
            hintsUsedCount={hintsUsedCount}
            maxHints={mission.hints?.length ?? 3}
          />
        )}
      </div>

      {/* Slide panels — overlay trên terminal */}
      <SlidePanel open={activePanel === 'terms'} title="📚 Thuật ngữ" onClose={() => setActivePanel(null)}>
        <TermsPanel terms={mission.terms} />
      </SlidePanel>
      <SlidePanel open={activePanel === 'debrief'} title="🧠 Phân tích kỹ thuật" onClose={() => setActivePanel(null)}>
        <DebriefPanel debrief={mission.debrief} />
      </SlidePanel>
      <SlidePanel open={activePanel === 'commands'} title="⌨ Lệnh cơ bản" onClose={() => setActivePanel(null)}>
        <CommandCheatsheet embedded />
      </SlidePanel>
    </div>
  )
}
