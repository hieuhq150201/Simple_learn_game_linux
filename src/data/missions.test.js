import { describe, expect, test } from 'vitest';
import { getMission, getMissionsForChapter, missions } from './missions.js';

describe('missions data', () => {
  test('every chapter 1-8 has exactly 3 missions', () => {
    for (let chapterId = 1; chapterId <= 8; chapterId++) {
      expect(missions[chapterId]).toHaveLength(3);
    }
  });

  test('every mission has required fields and 3 hint levels', () => {
    for (let chapterId = 1; chapterId <= 8; chapterId++) {
      for (const mission of missions[chapterId]) {
        expect(mission.chapterId).toBe(chapterId);
        expect(typeof mission.title).toBe('string');
        expect(typeof mission.story).toBe('string');
        expect(mission.steps.length).toBeGreaterThan(0);
        expect(mission.hints).toHaveLength(3);
        expect(mission.initialFilesystem['/']).toBeTruthy();
        expect(mission.initialFilesystem['/home/hacker']).toBeTruthy();
      }
    }
  });

  test('getMission returns the matching mission', () => {
    const mission = getMission(1, 1);
    expect(mission).not.toBeNull();
    expect(mission.id).toBe(1);
    expect(mission.chapterId).toBe(1);
  });

  test('getMission returns null for unknown chapter or mission id', () => {
    expect(getMission(99, 1)).toBeNull();
    expect(getMission(1, 99)).toBeNull();
  });

  test('getMissionsForChapter returns empty array for unknown chapter', () => {
    expect(getMissionsForChapter(99)).toEqual([]);
  });

  test('CTF chapter 8 missions hide the flag behind a final capture step, not in step 1', () => {
    for (const mission of missions[8]) {
      const lastStep = mission.steps[mission.steps.length - 1];
      expect(lastStep.description.toLowerCase()).toContain('flag');
    }
  });
});
