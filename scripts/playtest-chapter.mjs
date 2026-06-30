// GATE HÀNH VI: mô phỏng "chơi" mọi mission của 1 chương bằng cách đẩy các lệnh trong
// backtick của hint qua chính engine (evaluateCommand). Mỗi step PHẢI được hoàn thành —
// nghĩa là player đi theo hint là qua được mission. Step kẹt = regex `match` lệch lệnh hint dạy.
//
// Dùng: node scripts/playtest-chapter.mjs <N>
// Pass (exit 0) khi MỌI mission extra (id>=4) hoàn thành. Bài noHints (Ch10) báo riêng (check tay).
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { missions } from '../src/data/missions.js';
import { evaluateCommand, instantiateMission } from '../src/utils/missionEngine.ts';
import { HOME } from '../src/utils/localShell.ts';
// chạm vào pathToFileURL/path để giữ import gọn nếu sau này cần
void pathToFileURL; void path;

const N = Number(process.argv[2]);
if (!N || N < 1 || N > 14) { console.error('Dùng: node scripts/playtest-chapter.mjs <1..14>'); process.exit(1); }

function extractCmds(hints) {
  const out = [];
  for (const h of hints || []) { if (typeof h !== 'string') continue; const re = /`([^`]+)`/g; let m; while ((m = re.exec(h)) !== null) out.push(m[1]); }
  return out;
}

function playMission(m0) {
  const m = instantiateMission(m0);
  const cmds = extractCmds(m.hints);
  let cwd = HOME; const done = new Set(); const fs = structuredClone(m.initialFilesystem);
  for (const c of cmds) {
    try { const r = evaluateCommand(c, { mission: m, fs, cwd, completedSteps: done }); r.completedStepIds.forEach((x) => done.add(x)); if (r.newCwd) cwd = r.newCwd; } catch {}
  }
  return m.steps.filter((s) => !done.has(s.id));
}

const list = missions[N] ?? [];
const failures = []; const noHintReports = [];
for (const m of list) {
  const stuck = playMission(m);
  if (!stuck.length) continue;
  if (m.noHints) { noHintReports.push({ id: m.id, title: m.title, stuck }); continue; }
  // Ch1-10: bài gốc id<=3 do opus xử (không gate). Ch11+: TẤT CẢ mission đều gate.
  failures.push({ id: m.id, title: m.title, base: N <= 10 && m.id <= 3, stuck });
}

const extraFails = failures.filter((f) => !f.base);
const baseFails = failures.filter((f) => f.base);

if (extraFails.length) {
  console.error(`❌ chapter ${N}: ${extraFails.length} mission extra KHÔNG chơi được bằng hint:\n`);
  for (const f of extraFails) {
    console.error(`  id${f.id} "${f.title}":`);
    for (const s of f.stuck) console.error(`     - step "${s.id}" (${s.description})\n       regex: ${s.match}  <- lệnh trong hint không khớp regex này`);
  }
}
if (baseFails.length) console.error(`\n(ℹ️ ${baseFails.length} bài GỐC id<=3 cũng kẹt — opus xử, không thuộc phạm vi agent.)`);
if (noHintReports.length) console.error(`\n(ℹ️ ${noHintReports.length} bài noHints — check tay, gate này bỏ qua.)`);

if (extraFails.length === 0) {
  console.log(`✅ chapter ${N}: mọi mission extra (id>=4) chơi được bằng hint.${noHintReports.length ? ` (${noHintReports.length} bài noHints check tay riêng)` : ''}`);
  process.exit(0);
}
process.exit(1);
