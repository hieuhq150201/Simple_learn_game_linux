import { runShell } from './localShell.js';

// Engine offline thay cho AI: nhận 1 lệnh, quyết output + tiến độ mission, hoàn toàn cục bộ.
//
// Mỗi step trong mission có thể khai báo:
//   - match: RegExp hoặc function(normalizedRaw, { cwd, fs }) => boolean — nhận diện lệnh đúng của step
//   - output: string (tuỳ chọn) — output "đóng hộp" cho lệnh KHÔNG thao tác file thật
//             (ps, nmap, ssh, sudo...). Nếu bỏ trống, dùng output thật từ localShell.
//
// Thứ tự quyết output:
//   1. Nếu khớp 1 step và step có `output` cứng -> dùng output đó (lệnh giả lập).
//   2. Ngược lại nếu localShell xử lý được -> dùng output thật từ filesystem giả.
//   3. Ngược lại -> báo lỗi kiểu bash (command not found...).

function normalize(raw) {
  return raw.trim().replace(/\s+/g, ' ');
}

// Thay placeholder {{key}} trong 1 chuỗi bằng vars[key]; giữ nguyên nếu thiếu key.
function substitute(str, vars) {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? vars[k] : `{{${k}}}`));
}

// Sinh 1 phiên bản mission cụ thể: nếu mission có randomize(), tạo vars ngẫu nhiên
// rồi thay {{key}} trong mọi field STRING (step.output, hints, debrief, content file
// trong initialFilesystem). Deep-clone, KHÔNG mutate mission/initialFilesystem gốc
// (vì là import dùng chung). KHÔNG đụng `match` — regex giữ value-agnostic.
export function instantiateMission(mission) {
  if (typeof mission.randomize !== 'function') return mission;
  const vars = mission.randomize();

  const steps = mission.steps.map((s) => (s.output != null ? { ...s, output: substitute(s.output, vars) } : { ...s }));
  const hints = Array.isArray(mission.hints) ? mission.hints.map((h) => substitute(h, vars)) : mission.hints;
  const debrief = Array.isArray(mission.debrief) ? mission.debrief.map((d) => substitute(d, vars)) : mission.debrief;

  const initialFilesystem = {};
  for (const [path, node] of Object.entries(mission.initialFilesystem)) {
    initialFilesystem[path] =
      node.type === 'file' && typeof node.content === 'string'
        ? { ...node, content: substitute(node.content, vars) }
        : { ...node };
  }

  return { ...mission, steps, hints, debrief, initialFilesystem };
}

function stepMatches(step, normalizedRaw, ctx) {
  if (!step.match) return false;
  if (typeof step.match === 'function') return step.match(normalizedRaw, ctx);
  return step.match.test(normalizedRaw);
}

export function evaluateCommand(rawCommand, { mission, fs, cwd, completedSteps }) {
  const normalizedRaw = normalize(rawCommand);
  const shellResult = runShell(rawCommand, fs, cwd);

  // 1 lệnh có thể hoàn thành NHIỀU step đang chờ cùng khớp (vd `ps aux` vừa liệt kê vừa xác định) — forgiving
  const matchedSteps = mission.steps.filter(
    (s) => !completedSteps.has(s.id) && stepMatches(s, normalizedRaw, { cwd, fs })
  );

  // Output: ưu tiên step đầu tiên (theo thứ tự mission) có output "đóng hộp"; nếu không có thì dùng output thật từ localShell
  const cannedStep = matchedSteps.find((s) => s.output != null);
  const output = cannedStep ? cannedStep.output : shellResult.output;

  const nextCompleted = new Set(completedSteps);
  matchedSteps.forEach((s) => nextCompleted.add(s.id));
  const missionCompleted = mission.steps.every((s) => nextCompleted.has(s.id));

  return {
    output,
    completedStepIds: matchedSteps.map((s) => s.id),
    missionCompleted,
    fsUpdate: shellResult.fsUpdate,
    newCwd: shellResult.newCwd,
  };
}
