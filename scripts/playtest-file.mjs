// GATE HÀNH VI ĐỘC LẬP — playtest 1 file extra chương TRỰC TIẾP (không qua missions.js),
// để agent tự verify playability trước khi người điều phối wire vào missions.js.
// Dùng: node scripts/playtest-file.mjs src/data/extra/chapter11.js
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { evaluateCommand, instantiateMission } from '../src/utils/missionEngine.js';
import { HOME } from '../src/utils/localShell.js';

const rel = process.argv[2];
if (!rel) {
  console.error('Dùng: node scripts/playtest-file.mjs <path-to-extra-file>');
  process.exit(1);
}
const mod = await import(pathToFileURL(path.resolve(process.cwd(), rel)).href);
const list = mod.default ?? [];

function extractCmds(hints) {
  const out = [];
  for (const h of hints || []) {
    if (typeof h !== 'string') continue;
    const re = /`([^`]+)`/g;
    let m;
    while ((m = re.exec(h)) !== null) out.push(m[1]);
  }
  return out;
}

function playMission(m0) {
  const m = instantiateMission(m0);
  const cmds = extractCmds(m.hints);
  let cwd = HOME;
  const done = new Set();
  const fs = structuredClone(m.initialFilesystem);
  for (const c of cmds) {
    try {
      const r = evaluateCommand(c, { mission: m, fs, cwd, completedSteps: done });
      r.completedStepIds.forEach((x) => done.add(x));
      if (r.newCwd) cwd = r.newCwd;
    } catch {}
  }
  return m.steps.filter((s) => !done.has(s.id));
}

let fails = 0;
for (const m of list) {
  if (m.noHints) continue;
  const stuck = playMission(m);
  if (stuck.length) {
    fails++;
    console.error(`❌ id${m.id} "${m.title}": ${stuck.length} step kẹt`);
    for (const s of stuck)
      console.error(`   - step "${s.id}" (${s.description})\n     regex: ${s.match}  <- lệnh trong hint KHÔNG khớp regex này`);
  }
}
if (fails) {
  console.error(`\n${fails} mission KHÔNG chơi được bằng hint. Sửa hint hoặc regex.`);
  process.exit(1);
}
console.log(`✅ ${list.length} mission chơi được bằng hint (playtest trực tiếp file).`);
