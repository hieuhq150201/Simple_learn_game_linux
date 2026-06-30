'use client'
import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Layout/Header.jsx';
import Sidebar from './components/Layout/Sidebar.jsx';
import BadgePanel from './components/Layout/BadgePanel.jsx';
import BadgeToast from './components/Layout/BadgeToast.jsx';
import WelcomeScreen from './components/Layout/WelcomeScreen.jsx';
import CommandCheatsheet from './components/Mission/CommandCheatsheet.jsx';
import ChapterMap from './components/Chapter/ChapterMap.jsx';
import MissionPanel from './components/Mission/MissionPanel.jsx';
import Terminal from './components/Terminal/Terminal.jsx';
import { useTerminal } from './components/Terminal/useTerminal.js';
import { useFilesystem } from './hooks/useFilesystem.js';
import { useProgress } from './hooks/useProgress.js';
import { chapters } from './data/chapters.js';
import { getMissionsForChapter, getMission } from './data/missions.js';
import { instantiateMission } from './utils/missionEngine.js';

// 1 mission đang chơi: filesystem + terminal logic riêng, remount mỗi khi đổi mission (key ở MissionScreen cha)
function MissionScreen({ chapter, mission, progress, onMissionComplete, onBack, onNextMission }) {
  const { filesystem, applyUpdate } = useFilesystem(mission.initialFilesystem);
  const { entries, commandHistory, handleSubmit, isLoading, missionCompleted, completedSteps } = useTerminal({
    chapter,
    mission,
    filesystem,
    applyFilesystemUpdate: applyUpdate,
    onMissionComplete: ({ usedHint }) => {
      progress.completeMission(chapter.id, mission.id, { usedHint });
      onMissionComplete?.();
    },
    onCommandRun: progress.incrementCommandsRun,
    onHintUsed: progress.incrementHintsUsed,
    onExit: onBack,
  });

  const hintsUsedCount = entries.filter((e) => e.command?.trim() === 'hint').length;

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-4 lg:flex-1 lg:min-h-0">
      <div className="flex flex-col gap-3 min-h-0">
        <div className="lg:flex-1 lg:min-h-0">
          <MissionPanel
            mission={mission}
            completedSteps={completedSteps}
            hintsUsedCount={hintsUsedCount}
            missionCompleted={missionCompleted}
            onRequestHint={() => handleSubmit('hint')}
            onNextMission={onNextMission}
            onBackToMap={onBack}
          />
        </div>
        <CommandCheatsheet />
      </div>
      <div className="min-h-[420px] lg:min-h-0">
        <Terminal entries={entries} commandHistory={commandHistory} onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}

function ChapterScreen({ chapterId, progress, onBack }) {
  const chapter = chapters.find((c) => c.id === chapterId);
  const missionList = getMissionsForChapter(chapterId);
  const [activeMissionId, setActiveMissionId] = useState(missionList[0]?.id ?? null);
  // instantiate 1 lần mỗi lần vào mission: chương có randomize (ch10) sinh flag ngẫu nhiên ổn định
  // suốt phiên chơi mission đó, không đổi giữa các lần re-render.
  const mission = useMemo(() => {
    const m = getMission(chapterId, activeMissionId);
    return m ? instantiateMission(m) : null;
  }, [chapterId, activeMissionId]);
  const nextMission = missionList.find((m) => m.id === activeMissionId + 1);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:flex-1 lg:min-h-0">
      <Sidebar
        chapter={chapter}
        missionList={missionList}
        activeMissionId={activeMissionId}
        isMissionCompleted={progress.isMissionCompleted}
        onSelectMission={setActiveMissionId}
        onBack={onBack}
      />
      {mission && (
        <MissionScreen
          key={mission.id}
          chapter={chapter}
          mission={mission}
          progress={progress}
          onBack={onBack}
          onNextMission={nextMission ? () => setActiveMissionId(nextMission.id) : undefined}
        />
      )}
    </div>
  );
}

const WELCOME_SEEN_KEY = 'hacker-path-seen-welcome';

export default function App() {
  const progress = useProgress();
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem(WELCOME_SEEN_KEY));
  const seenBadgeIdsRef = useRef(null);

  // Đóng màn chào: nhớ đã xem + vào thẳng Chương 1 cho người mới
  function dismissWelcome() {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    setShowWelcome(false);
    setActiveChapterId(1);
  }

  const totalMissions = chapters.reduce((sum, c) => sum + c.missionCount, 0);
  const completedCount = Object.keys(progress.progress.completedMissions).length;
  const progressPercent = totalMissions ? Math.round((completedCount / totalMissions) * 100) : 0;

  const badges = progress.getBadges();

  useEffect(() => {
    const unlockedIds = new Set(badges.filter((b) => b.unlocked).map((b) => b.id));
    if (seenBadgeIdsRef.current === null) {
      seenBadgeIdsRef.current = unlockedIds;
      return;
    }
    const newly = badges.find((b) => b.unlocked && !seenBadgeIdsRef.current.has(b.id));
    if (newly) setNewlyUnlockedBadge(newly);
    seenBadgeIdsRef.current = unlockedIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.progress.completedMissions]);

  useEffect(() => {
    if (!newlyUnlockedBadge) return;
    const timer = setTimeout(() => setNewlyUnlockedBadge(null), 4000);
    return () => clearTimeout(timer);
  }, [newlyUnlockedBadge]);

  return (
    <div className="h-screen flex flex-col text-gray-200">
      <Header
        title={activeChapterId ? `Chương ${activeChapterId}` : 'Bản đồ chương'}
        progressPercent={progressPercent}
      />

      <main className="flex-1 min-h-0 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden">
        <BadgePanel badges={badges} stats={progress.progress.stats} />
        {activeChapterId ? (
          <ChapterScreen chapterId={activeChapterId} progress={progress} onBack={() => setActiveChapterId(null)} />
        ) : (
          <ChapterMap progress={progress} onSelectChapter={setActiveChapterId} />
        )}
      </main>

      <BadgeToast badge={newlyUnlockedBadge} />
      {showWelcome && <WelcomeScreen onStart={dismissWelcome} />}
    </div>
  );
}
