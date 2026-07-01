'use client'
import MissionProgress from './MissionProgress';
import HintSystem from './HintSystem';
import DebriefPanel from './DebriefPanel';
import TermsPanel from './TermsPanel';

interface MissionPanelProps {
  mission: any;
  completedSteps: Set<string>;
  hintsUsedCount: number;
  onRequestHint: () => void;
  missionCompleted: boolean;
  onNextMission?: () => void;
  onBackToMap?: () => void;
}

// Sidebar hiện story + checklist + nút hint cho mission đang chơi
export default function MissionPanel({
  mission,
  completedSteps,
  hintsUsedCount,
  onRequestHint,
  missionCompleted,
  onNextMission,
  onBackToMap,
}: MissionPanelProps): JSX.Element {
  return (
    <div className="flex flex-col lg:h-full gap-4 p-4 border border-hp-border rounded-lg bg-hp-card lg:overflow-y-auto">
      <div>
        <h2 className="text-indigo-400 font-bold text-sm uppercase tracking-wide">Mission {mission.id}</h2>
        <h3 className="text-hp-fg font-semibold mt-1">{mission.title}</h3>
      </div>

      <p className="text-hp-muted text-sm leading-relaxed">{mission.story}</p>

      <div>
        <h4 className="text-hp-subtle text-xs uppercase tracking-wide mb-2">Checklist</h4>
        <MissionProgress steps={mission.steps} completedSteps={completedSteps} />
      </div>

      <TermsPanel terms={mission.terms} />

      {missionCompleted ? (
        <div className="animate-celebrate-in border border-green-400/40 rounded-md p-3 text-center">
          <div className="text-2xl">🎉</div>
          <p className="text-green-400 font-semibold text-sm mt-1">Tuyệt vời! Mày đã hoàn thành mission này.</p>
          <p className="text-hp-muted text-xs mt-1">Kỹ năng mới đã được mở khoá. Tiếp tục thôi!</p>

          <div className="flex flex-col gap-2 mt-3">
            {onNextMission && (
              <button
                onClick={onNextMission}
                className="text-sm text-gray-950 bg-green-400 hover:bg-green-300 rounded-md py-2 font-semibold transition-colors"
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
          ☠ Elite — không có hint, tự lực 100%.
        </p>
      ) : (
        <HintSystem onRequestHint={onRequestHint} hintsUsedCount={hintsUsedCount} maxHints={mission.hints.length} />
      )}

      {/* Debrief tách riêng, full-width của sidebar (không nén trong card celebration) — chỉ hiện khi xong */}
      {missionCompleted && <DebriefPanel debrief={mission.debrief} />}
    </div>
  );
}
