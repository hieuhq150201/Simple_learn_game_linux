import { describe, expect, test } from 'vitest';
import { badges, isBadgeUnlocked } from './badges.js';

const testChapters = [
  { id: 1, missionCount: 3 },
  { id: 2, missionCount: 3 },
  { id: 3, missionCount: 3 },
  { id: 4, missionCount: 3 },
  { id: 5, missionCount: 3 },
];

function completed(...pairs) {
  const map = {};
  for (const [chapterId, missionId] of pairs) map[`${chapterId}-${missionId}`] = { completedAt: 1 };
  return map;
}

function getBadge(id) {
  const badge = badges.find((b) => b.id === id);
  if (!badge) throw new Error(`badge not found: ${id}`);
  return badge;
}

describe('isBadgeUnlocked', () => {
  test('script-kiddie unlocks only when chapter 1 is fully completed', () => {
    const badge = getBadge('script-kiddie');
    const partial = completed([1, 1], [1, 2]);
    const full = completed([1, 1], [1, 2], [1, 3]);

    expect(isBadgeUnlocked(badge, partial, testChapters)).toBe(false);
    expect(isBadgeUnlocked(badge, full, testChapters)).toBe(true);
  });

  test('linux-native requires chapters 1-3 all fully completed, not just one', () => {
    const badge = getBadge('linux-native');
    const onlyChapter1 = completed([1, 1], [1, 2], [1, 3]);
    const all1to3 = completed(
      [1, 1], [1, 2], [1, 3],
      [2, 1], [2, 2], [2, 3],
      [3, 1], [3, 2], [3, 3]
    );

    expect(isBadgeUnlocked(badge, onlyChapter1, testChapters)).toBe(false);
    expect(isBadgeUnlocked(badge, all1to3, testChapters)).toBe(true);
  });

  test('network-ninja requires chapters 3 and 4, ignores chapter 1/2 state', () => {
    const badge = getBadge('network-ninja');
    const chapters3and4 = completed(
      [3, 1], [3, 2], [3, 3],
      [4, 1], [4, 2], [4, 3]
    );

    expect(isBadgeUnlocked(badge, chapters3and4, testChapters)).toBe(true);
    expect(isBadgeUnlocked(badge, completed([3, 1], [3, 2], [3, 3]), testChapters)).toBe(false);
  });

  test('does not unlock when a chapter is missing from the chapters list', () => {
    const badge = getBadge('recon-master'); // requires chapter 5
    const full = completed([5, 1], [5, 2], [5, 3]);
    expect(isBadgeUnlocked(badge, full, testChapters.filter((c) => c.id !== 5))).toBe(false);
  });
});
