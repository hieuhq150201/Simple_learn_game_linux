'use client'
import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import ProgressHero from './components/Layout/ProgressHero';
import BadgeToast from './components/Layout/BadgeToast';
import WelcomeScreen from './components/Layout/WelcomeScreen';
import ChapterCompleteModal from './components/Achievement/ChapterCompleteModal';
import type { TrophyTier } from './components/Achievement/TrophyIcon';
import CommandCheatsheet from './components/Mission/CommandCheatsheet';
import ChapterMap from './components/Chapter/ChapterMap';
import MissionPanel from './components/Mission/MissionPanel';
import Terminal from './components/Terminal/Terminal';
import { useTerminal } from './components/Terminal/useTerminal';
import { useFilesystem } from './hooks/useFilesystem';
import { useProgress } from './hooks/useProgress';
import { chapters } from './data/chapters.js';
import { getMissionsForChapter, getMission } from './data/missions.js';
import { instantiateMission } from './utils/missionEngine';

// 1 mission đang chơi: filesystem + terminal logic riêng, remount mỗi khi đổi mission (key ở MissionScreen cha)
function MissionScreen({ chapter, mission, progress, onMissionComplete, onBack, onNextMission }: {
  chapter: any;
  mission: any;
  progress: any;
  onMissionComplete?: () => void;
  onBack: () => void;
  onNextMission?: () => void;
}): JSX.Element {
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

function ChapterScreen({ chapterId, progress, onBack }: {
  chapterId: number;
  progress: any;
  onBack: () => void;
}): JSX.Element {
  const chapter = chapters.find((c: any) => c.id === chapterId);
  const missionList = getMissionsForChapter(chapterId);
  const [activeMissionId, setActiveMissionId] = useState<number | null>(missionList[0]?.id ?? null);
  // instantiate 1 lần mỗi lần vào mission: chương có randomize (ch10) sinh flag ngẫu nhiên ổn định
  // suốt phiên chơi mission đó, không đổi giữa các lần re-render.
  const mission = useMemo(() => {
    const m = getMission(chapterId, activeMissionId);
    return m ? instantiateMission(m) : null;
  }, [chapterId, activeMissionId]);
  const nextMission = missionList.find((m: any) => m.id === activeMissionId! + 1);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
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

export default function App(): JSX.Element {
  const progress = useProgress();
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<{ emoji: string; name: string; description?: string; tier?: TrophyTier } | null>(null);
  const [chapterCompleteModal, setChapterCompleteModal] = useState<{ id: number; title: string } | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem(WELCOME_SEEN_KEY));
  const seenBadgeIdsRef = useRef<Set<string> | null>(null);
  const seenChapterCompleteRef = useRef<Set<number> | null>(null);

  // Đóng màn chào: nhớ đã xem + vào thẳng Chương 1 cho người mới
  function dismissWelcome() {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    setShowWelcome(false);
    setActiveChapterId(1);
  }

  const totalMissions = chapters.reduce((sum: number, c: any) => sum + c.missionCount, 0);
  const completedCount = Object.keys(progress.progress.completedMissions).length;
  const progressPercent = totalMissions ? Math.round((completedCount / totalMissions) * 100) : 0;

  const badges = progress.getBadges();

  useEffect(() => {
    const unlockedIds = new Set<string>(badges.filter((b: any) => b.unlocked).map((b: any) => b.id as string));
    if (seenBadgeIdsRef.current === null) {
      seenBadgeIdsRef.current = unlockedIds;
      return;
    }
    const newly = badges.find((b: any) => b.unlocked && !seenBadgeIdsRef.current!.has(b.id));
    if (newly) setNewlyUnlockedBadge(newly);
    seenBadgeIdsRef.current = unlockedIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.progress.completedMissions]);

  // Detect newly completed chapters
  useEffect(() => {
    const completedChapterIds = new Set<number>();
    for (const chapter of chapters as any[]) {
      const allDone = getMissionsForChapter(chapter.id).every(
        (m: any) => progress.progress.completedMissions[`${chapter.id}-${m.id}`]
      );
      if (allDone) completedChapterIds.add(chapter.id);
    }
    if (seenChapterCompleteRef.current === null) {
      seenChapterCompleteRef.current = completedChapterIds;
      return;
    }
    const newlyCompleted = [...completedChapterIds].find((id) => !seenChapterCompleteRef.current!.has(id));
    if (newlyCompleted) {
      const chapter = (chapters as any[]).find((c) => c.id === newlyCompleted);
      setChapterCompleteModal({ id: newlyCompleted, title: chapter?.title ?? '' });
    }
    seenChapterCompleteRef.current = completedChapterIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.progress.completedMissions]);

  useEffect(() => {
    if (!newlyUnlockedBadge) return;
    const timer = setTimeout(() => setNewlyUnlockedBadge(null), 5000);
    return () => clearTimeout(timer);
  }, [newlyUnlockedBadge]);

  return (
    <div className="h-screen flex flex-col text-hp-fg">
      <Header
        title={activeChapterId ? `Chương ${activeChapterId}` : 'Bản đồ chương'}
      />

      <main className={`flex-1 min-h-0 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto ${activeChapterId ? 'lg:overflow-hidden' : ''}`}>
        {activeChapterId ? (
          <ChapterScreen chapterId={activeChapterId} progress={progress} onBack={() => setActiveChapterId(null)} />
        ) : (
          <>
            <ProgressHero
              progressPercent={progressPercent}
              completedCount={completedCount}
              totalMissions={totalMissions}
              badges={badges}
              stats={progress.progress.stats}
            />
            <ChapterMap progress={progress} onSelectChapter={setActiveChapterId} />
          </>
        )}
      </main>

      <BadgeToast badge={newlyUnlockedBadge} />
      {chapterCompleteModal && (
        <ChapterCompleteModal
          chapterId={chapterCompleteModal.id}
          chapterTitle={chapterCompleteModal.title}
          onClose={() => { setChapterCompleteModal(null); setActiveChapterId(null); }}
          onNextChapter={
            (chapters as any[]).find((c) => c.id === chapterCompleteModal.id + 1)
              ? () => { setChapterCompleteModal(null); setActiveChapterId(chapterCompleteModal.id + 1); }
              : undefined
          }
        />
      )}
      {showWelcome && <WelcomeScreen onStart={dismissWelcome} />}
    </div>
  );
}
