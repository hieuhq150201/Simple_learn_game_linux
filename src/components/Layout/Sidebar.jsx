// Sidebar chọn mission trong 1 chương, hiện check khi đã hoàn thành
export default function Sidebar({ chapter, missionList, activeMissionId, isMissionCompleted, onSelectMission, onBack }) {
  return (
    <div className="flex flex-col gap-3 p-4 border border-term-border rounded-lg bg-gray-950/60 w-full lg:w-56 lg:shrink-0 min-h-0">
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-1.5 w-full text-sm text-gray-200 border border-term-border rounded-md px-3 py-2 hover:border-indigo-400/60 hover:text-indigo-400 transition-colors shrink-0"
      >
        ← Về bản đồ chương
      </button>

      <h2 className="text-gray-100 font-semibold text-sm shrink-0">
        Chương {chapter.id}: {chapter.title}
      </h2>

      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 max-h-64 lg:max-h-none">
        {missionList.map((mission) => {
          const done = isMissionCompleted(chapter.id, mission.id);
          const active = mission.id === activeMissionId;
          return (
            <button
              key={mission.id}
              onClick={() => onSelectMission(mission.id)}
              className={`text-left text-sm px-2 py-1.5 rounded ${
                active ? 'bg-indigo-400/10 text-indigo-400' : 'text-gray-400 hover:text-gray-200'
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
