// Kiểm tra ĐỘC LẬP một chương extra (chỉ import file của chương đó -> an toàn khi nhiều agent chạy song song).
// Dùng: node scripts/check-chapter.mjs <N>
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { chapters } from '../src/data/chapters.js';

const N = Number(process.argv[2]);
if (!N || N < 1 || N > 14) {
  console.error('Dùng: node scripts/check-chapter.mjs <1..14>');
  process.exit(1);
}

const meta = chapters.find((c) => c.id === N);
if (!meta) {
  console.error(`Không tìm thấy chapter ${N} trong chapters.js`);
  process.exit(1);
}
const target = meta.missionCount;
// Ch1-10: 3 bài gốc (id 1-3) nằm trong missions.js -> extra chỉ chứa id 4+.
// Ch11+: TOÀN BỘ mission nằm trong extra/chapterN.js (id 1..missionCount), FS inline.
const BASE = N >= 11 ? 0 : 3;
const expectedExtra = target - BASE;

const extraPath = path.resolve(process.cwd(), `src/data/extra/chapter${N}.js`);
const mod = await import(pathToFileURL(extraPath).href);
const extra = mod.default;

const errs = [];
if (!Array.isArray(extra)) {
  errs.push('default export không phải mảng');
} else {
  if (extra.length !== expectedExtra) {
    errs.push(`cần ${expectedExtra} bài (target ${target}${BASE ? ` - ${BASE} gốc` : ''}), đang có ${extra.length}`);
  }
  const ids = extra.map((m) => m.id);
  const expectIds = Array.from({ length: expectedExtra }, (_, i) => i + 1 + BASE); // (BASE+1)..target
  if (new Set(ids).size !== ids.length) errs.push(`id trùng: ${ids.join(',')}`);
  if (JSON.stringify(ids) !== JSON.stringify(expectIds)) {
    errs.push(`id phải liền mạch ${expectIds[0]}..${expectIds[expectIds.length - 1]}; đang là ${ids.join(',')}`);
  }
  for (const m of extra) {
    const tag = `bài id=${m?.id}`;
    if (m.chapterId !== N) errs.push(`${tag}: chapterId ${m.chapterId} != ${N}`);
    if (typeof m.title !== 'string' || !m.title) errs.push(`${tag}: thiếu title`);
    if (typeof m.story !== 'string' || !m.story) errs.push(`${tag}: thiếu story`);
    if (!Array.isArray(m.steps) || m.steps.length === 0) errs.push(`${tag}: thiếu steps`);
    else
      for (const s of m.steps) {
        if (typeof s.description !== 'string' || !s.description) errs.push(`${tag}: step thiếu description`);
        if (!(s.match instanceof RegExp)) errs.push(`${tag}: step "${s.id}" match không phải RegExp`);
      }
    const hintOk = N === 10 ? Array.isArray(m.hints) && m.hints.length >= 1 : Array.isArray(m.hints) && m.hints.length === 3;
    if (!hintOk) errs.push(`${tag}: hints phải ${N === 10 ? '>=1 (elite)' : '=3'}, đang ${m.hints?.length}`);
    if (!Array.isArray(m.terms) || m.terms.length < 3) errs.push(`${tag}: cần >=3 terms, đang ${m.terms?.length}`);
    else
      for (const t of m.terms) {
        if (typeof t.term !== 'string' || typeof t.def !== 'string') errs.push(`${tag}: term thiếu term/def`);
      }
    if (!m.initialFilesystem || !m.initialFilesystem['/'] || !m.initialFilesystem['/home/hacker']) {
      errs.push(`${tag}: initialFilesystem phải có '/' và '/home/hacker'`);
    }
  }
}

if (errs.length) {
  console.error(`❌ chapter ${N} CHƯA đạt (${errs.length} lỗi):`);
  for (const e of errs) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✅ chapter ${N} OK: ${extra.length} bài (id ${BASE + 1}..${target}).`);
