// Badge gamification — mỗi badge unlock khi đã hoàn thành đủ các chương trong requiredChapters
export const badges = [
  {
    id: 'script-kiddie',
    emoji: '🔰',
    name: 'Script Kiddie',
    description: 'Hoàn thành Chương 1 — Terminal Sinh Tồn.',
    requiredChapters: [1],
  },
  {
    id: 'linux-native',
    emoji: '🐧',
    name: 'Linux Native',
    description: 'Hoàn thành Chương 1 đến 3.',
    requiredChapters: [1, 2, 3],
  },
  {
    id: 'network-ninja',
    emoji: '🌐',
    name: 'Network Ninja',
    description: 'Hoàn thành Chương 3 và 4.',
    requiredChapters: [3, 4],
  },
  {
    id: 'recon-master',
    emoji: '🔍',
    name: 'Recon Master',
    description: 'Hoàn thành Chương 5 — Recon & Enumeration.',
    requiredChapters: [5],
  },
  {
    id: 'full-hacker',
    emoji: '💀',
    name: 'Full Hacker',
    description: 'Hoàn thành tất cả 8 chương.',
    requiredChapters: [1, 2, 3, 4, 5, 6, 7, 8],
  },
  {
    id: 'lateral-master',
    emoji: '🥷',
    name: 'Lateral Master',
    description: 'Hoàn thành Chương 9 — Lateral Movement & AD.',
    requiredChapters: [9],
  },
  {
    id: 'elite-hacker',
    emoji: '👑',
    name: 'Elite Hacker',
    description: 'Hoàn thành tất cả 10 chương.',
    requiredChapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
];

// Một chương coi là hoàn thành khi đủ missionCount mission completed
function isChapterComplete(chapterId, completedMissions, chapters) {
  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter) return false;
  for (let i = 1; i <= chapter.missionCount; i++) {
    if (!completedMissions[`${chapterId}-${i}`]) return false;
  }
  return true;
}

export function isBadgeUnlocked(badge, completedMissions, chapters) {
  return badge.requiredChapters.every((chapterId) =>
    isChapterComplete(chapterId, completedMissions, chapters)
  );
}
