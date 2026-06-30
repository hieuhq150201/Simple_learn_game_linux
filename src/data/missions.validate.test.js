import { describe, expect, test } from 'vitest';
import { missions } from './missions.js';
import { chapters } from './chapters.js';

// Validator schema cho CẢ 14 chương — "hợp đồng" mọi mission phải tuân thủ.
// Mỗi sub-agent chạy `npx vitest run -t "chapter N"` để verify chương mình tới khi xanh.
const CHAPTER_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

describe('missions schema validation', () => {
  for (const ch of CHAPTER_IDS) {
    describe(`chapter ${ch}`, () => {
      const list = missions[ch] ?? [];
      const meta = chapters.find((c) => c.id === ch);

      test('reaches target missionCount', () => {
        expect(meta).toBeTruthy();
        expect(list.length).toBe(meta.missionCount);
      });

      test('ids are unique', () => {
        const ids = list.map((m) => m.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      for (const m of list) {
        test(`mission ${m.id} has valid shape`, () => {
          expect(m.chapterId).toBe(ch);
          expect(typeof m.title).toBe('string');
          expect(m.title.length).toBeGreaterThan(0);
          expect(typeof m.story).toBe('string');
          expect(m.story.length).toBeGreaterThan(0);

          expect(m.steps.length).toBeGreaterThan(0);
          for (const s of m.steps) {
            expect(typeof s.description).toBe('string');
            expect(s.match).toBeInstanceOf(RegExp);
          }

          if (ch === 10) {
            // Ch10 elite: thiết kế "không hint" — giữ tối thiểu 1 hint placeholder.
            expect(m.hints.length).toBeGreaterThanOrEqual(1);
          } else {
            expect(m.hints).toHaveLength(3);
          }

          expect(Array.isArray(m.terms)).toBe(true);
          expect(m.terms.length).toBeGreaterThanOrEqual(3);
          for (const t of m.terms) {
            expect(typeof t.term).toBe('string');
            expect(typeof t.def).toBe('string');
          }

          expect(m.initialFilesystem['/']).toBeTruthy();
          expect(m.initialFilesystem['/home/hacker']).toBeTruthy();
        });
      }
    });
  }
});
