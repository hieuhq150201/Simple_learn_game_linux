import { useCallback, useState } from 'react';
import { badges, isBadgeUnlocked } from '../data/badges.js';
import { chapters } from '../data/chapters.js';

const STORAGE_KEY = 'hacker-path-progress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { completedMissions: {}, stats: { commandsRun: 0, hintsUsed: 0 } };
  } catch {
    return { completedMissions: {}, stats: { commandsRun: 0, hintsUsed: 0 } };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Quản lý progress (mission hoàn thành, stats) lưu ở localStorage
export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const isMissionCompleted = useCallback(
    (chapterId, missionId) => Boolean(progress.completedMissions[`${chapterId}-${missionId}`]),
    [progress]
  );

  const completeMission = useCallback((chapterId, missionId, { usedHint = false } = {}) => {
    setProgress((prev) => {
      const key = `${chapterId}-${missionId}`;
      const next = {
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
      const next = { ...prev, stats: { ...prev.stats, commandsRun: prev.stats.commandsRun + 1 } };
      saveProgress(next);
      return next;
    });
  }, []);

  const incrementHintsUsed = useCallback(() => {
    setProgress((prev) => {
      const next = { ...prev, stats: { ...prev.stats, hintsUsed: prev.stats.hintsUsed + 1 } };
      saveProgress(next);
      return next;
    });
  }, []);

  const isChapterUnlocked = useCallback(
    (chapterId, missionsInChapter) => {
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
      badges.map((badge) => ({
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
