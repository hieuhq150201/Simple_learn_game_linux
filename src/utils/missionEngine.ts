import { runShell, type Filesystem } from './localShell';

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

function normalize(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

// Thay placeholder {{key}} trong 1 chuỗi bằng vars[key]; giữ nguyên nếu thiếu key.
function substitute(str: string, vars: Record<string, string>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? vars[k] : `{{${k}}}`));
}

// Sinh 1 phiên bản mission cụ thể: nếu mission có randomize(), tạo vars ngẫu nhiên
// rồi thay {{key}} trong mọi field STRING (step.output, hints, debrief, content file
// trong initialFilesystem). Deep-clone, KHÔNG mutate mission/initialFilesystem gốc
// (vì là import dùng chung). KHÔNG đụng `match` — regex giữ value-agnostic.
export function instantiateMission(mission: any): any {
  if (typeof mission.randomize !== 'function') return mission;
  const vars = mission.randomize();

  const steps = mission.steps.map((s: any) => (s.output != null ? { ...s, output: substitute(s.output, vars) } : { ...s }));
  const hints = Array.isArray(mission.hints) ? mission.hints.map((h: string) => substitute(h, vars)) : mission.hints;
  const debrief = Array.isArray(mission.debrief) ? mission.debrief.map((d: string) => substitute(d, vars)) : mission.debrief;

  const initialFilesystem: Filesystem = {};
  for (const [path, node] of Object.entries(mission.initialFilesystem as Filesystem)) {
    initialFilesystem[path] =
      node.type === 'file' && typeof node.content === 'string'
        ? { ...node, content: substitute(node.content, vars) }
        : { ...node };
  }

  return { ...mission, steps, hints, debrief, initialFilesystem };
}

function stepMatches(step: any, normalizedRaw: string, ctx: { cwd: string; fs: Filesystem }): boolean {
  if (!step.match) return false;
  if (typeof step.match === 'function') return step.match(normalizedRaw, ctx);
  return step.match.test(normalizedRaw);
}

export interface EvaluateResult {
  output: string;
  completedStepIds: string[];
  missionCompleted: boolean;
  fsUpdate: Record<string, any> | null;
  newCwd: string | null;
}

export function evaluateCommand(
  rawCommand: string,
  { mission, fs, cwd, completedSteps }: { mission: any; fs: Filesystem; cwd: string; completedSteps: Set<string> }
): EvaluateResult {
  const normalizedRaw = normalize(rawCommand);
  const shellResult = runShell(rawCommand, fs, cwd);

  // 1 lệnh có thể hoàn thành NHIỀU step đang chờ cùng khớp (vd `ps aux` vừa liệt kê vừa xác định) — forgiving
  const matchedSteps = mission.steps.filter(
    (s: any) => !completedSteps.has(s.id) && stepMatches(s, normalizedRaw, { cwd, fs })
  );

  // Output: ưu tiên step đầu tiên (theo thứ tự mission) có output "đóng hộp"; nếu không có thì dùng output thật từ localShell
  const cannedStep = matchedSteps.find((s: any) => s.output != null);
  const output = cannedStep ? cannedStep.output : shellResult.output;

  const nextCompleted = new Set(completedSteps);
  matchedSteps.forEach((s: any) => nextCompleted.add(s.id));
  const missionCompleted = mission.steps.every((s: any) => nextCompleted.has(s.id));

  return {
    output,
    completedStepIds: matchedSteps.map((s: any) => s.id),
    missionCompleted,
    fsUpdate: shellResult.fsUpdate,
    newCwd: shellResult.newCwd,
  };
}
