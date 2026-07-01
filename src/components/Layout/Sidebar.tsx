'use client'

interface SidebarProps {
  chapter: any;
  missionList: any[];
  activeMissionId: number | null;
  isMissionCompleted: (chapterId: number, missionId: number) => boolean;
  onSelectMission: (id: number) => void;
  onBack: () => void;
}

export default function Sidebar({ chapter, missionList, activeMissionId, isMissionCompleted, onSelectMission, onBack }: SidebarProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3 p-4 border border-hp-border rounded-lg bg-hp-card w-full lg:w-56 lg:shrink-0 min-h-0 overflow-hidden">
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 w-full text-sm text-hp-fg border border-hp-border rounded-md px-3 py-2 hover:border-indigo-400/60 hover:text-indigo-400 transition-colors shrink-0"
      >
        ← Về bản đồ chương
      </button>

      <h2 className="text-hp-fg font-semibold text-sm shrink-0">
        Chương {chapter.id}: {chapter.title}
      </h2>

      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {missionList.map((mission) => {
          const done = isMissionCompleted(chapter.id, mission.id);
          const active = mission.id === activeMissionId;
          return (
            <button
              key={mission.id}
              onClick={() => onSelectMission(mission.id)}
              className={`text-left text-sm px-2 py-1.5 rounded ${
                active ? 'bg-indigo-400/10 text-indigo-400' : 'text-hp-muted hover:text-hp-fg'
              }`}
            >
              {done ? '✓' : '○'} Mission {mission.id}: {mission.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
