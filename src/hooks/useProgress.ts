'use client'
import { useCallback, useState } from 'react';
import { badges, isBadgeUnlocked } from '../data/badges.js';
import { chapters } from '../data/chapters.js';

const STORAGE_KEY = 'hacker-path-progress';

interface ProgressState {
  completedMissions: Record<string, { completedAt: number; usedHint: boolean }>;
  stats: { commandsRun: number; hintsUsed: number };
}

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completedMissions: {}, stats: { commandsRun: 0, hintsUsed: 0 } };
  } catch {
    return { completedMissions: {}, stats: { commandsRun: 0, hintsUsed: 0 } };
  }
}

function saveProgress(progress: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Quản lý progress (mission hoàn thành, stats) lưu ở localStorage
export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);

  const isMissionCompleted = useCallback(
    (chapterId: number, missionId: number) => Boolean(progress.completedMissions[`${chapterId}-${missionId}`]),
    [progress]
  );

  const completeMission = useCallback((chapterId: number, missionId: number, { usedHint = false } = {}) => {
    setProgress((prev) => {
      const key = `${chapterId}-${missionId}`;
      const next: ProgressState = {
        ...prev,
        completedMissions: {
          ...prev.completedMissions,
          [key]: { completedAt: Date.now(), usedHint },
        },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const incrementCommandsRun = useCallback(() => {
    setProgress((prev) => {
      const next: ProgressState = { ...prev, stats: { ...prev.stats, commandsRun: prev.stats.commandsRun + 1 } };
      saveProgress(next);
      return next;
    });
  }, []);

  const incrementHintsUsed = useCallback(() => {
    setProgress((prev) => {
      const next: ProgressState = { ...prev, stats: { ...prev.stats, hintsUsed: prev.stats.hintsUsed + 1 } };
      saveProgress(next);
      return next;
    });
  }, []);

  const isChapterUnlocked = useCallback(
    (chapterId: number, missionsInChapter: number) => {
      if (chapterId === 1) return true;
      const prevChapterMissionCount = missionsInChapter;
      for (let i = 1; i <= prevChapterMissionCount; i++) {
        if (!isMissionCompleted(chapterId - 1, i)) return false;
      }
      return true;
    },
    [isMissionCompleted]
  );

  const getBadges = useCallback(
    () =>
      badges.map((badge: any) => ({
        ...badge,
        unlocked: isBadgeUnlocked(badge, progress.completedMissions, chapters),
      })),
    [progress]
  );

  return {
    progress,
    isMissionCompleted,
    completeMission,
    incrementCommandsRun,
    incrementHintsUsed,
    isChapterUnlocked,
    getBadges,
  };
}
