import { describe, expect, it } from 'vitest';
import { getMission } from '../data/missions.js';
import { HOME } from './localShell.js';
import { evaluateCommand, instantiateMission } from './missionEngine.js';

// Helper: chạy 1 lệnh trên 1 phiên giả lập (fs + cwd + completedSteps tích luỹ),
// trả về kết quả evaluateCommand. Dùng cho test 1 lệnh đơn lẻ.
function run(mission, raw, { fs = mission.initialFilesystem, cwd = HOME, completedSteps = new Set() } = {}) {
  return evaluateCommand(raw, { mission, fs, cwd, completedSteps });
}

// Helper: chạy 1 chuỗi lệnh tuần tự, tự tích luỹ completedSteps + cập nhật cwd + fs,
// y như useTerminal làm trong app. Trả về trạng thái cuối + log từng bước.
function runSequence(mission, commands) {
  let fs = { ...mission.initialFilesystem };
  let cwd = HOME;
  const completedSteps = new Set();
  const log = [];
  for (const raw of commands) {
    const res = evaluateCommand(raw, { mission, fs, cwd, completedSteps });
    res.completedStepIds.forEach((id) => completedSteps.add(id));
    if (res.newCwd) cwd = res.newCwd;
    if (res.fsUpdate) {
      for (const [path, node] of Object.entries(res.fsUpdate)) {
        if (node === null) delete fs[path];
        else fs[path] = node;
      }
    }
    log.push({ raw, res });
  }
  return { completedSteps, cwd, fs, log, last: log[log.length - 1].res };
}

describe('missionEngine.evaluateCommand', () => {
  it('lệnh file-based: tail đọc 50 dòng cuối syslog thật, hoàn thành step "tail"', () => {
    const m = getMission(1, 1);
    // tail bằng đường dẫn tuyệt đối để không phụ thuộc cwd
    const res = run(m, 'tail -n 50 /var/log/syslog');
    expect(res.completedStepIds).toContain('tail');
    // output là nội dung THẬT từ filesystem giả, không phải canned
    expect(res.output).toContain('ERROR: Database connection pool exhausted');
    expect(res.output).toContain('FATAL: Service entering degraded mode');
  });

  it('lệnh file-based qua cwd: cd /var/log rồi tail syslog (đường dẫn tương đối)', () => {
    const m = getMission(1, 1);
    const cd = run(m, 'cd /var/log');
    expect(cd.completedStepIds).toContain('navigate');
    expect(cd.newCwd).toBe('/var/log');
    // tail file tương đối, dùng cwd vừa đổi
    const res = run(m, 'tail -n 50 syslog', { cwd: cd.newCwd });
    expect(res.completedStepIds).toContain('tail');
    expect(res.output).toContain('FATAL');
  });

  it('lệnh canned: ps aux trả output có "miner" và hoàn thành cùng lúc list_proc + identify', () => {
    const m = getMission(2, 1);
    const res = run(m, 'ps aux');
    // 1 lệnh khớp nhiều step đang chờ
    expect(res.completedStepIds).toEqual(expect.arrayContaining(['list_proc', 'identify']));
    expect(res.output).toContain('miner');
  });

  it('kill -9 6713 hoàn thành step "kill"', () => {
    const m = getMission(2, 1);
    // giả định list_proc + identify đã xong trước đó
    const res = run(m, 'kill -9 6713', { completedSteps: new Set(['list_proc', 'identify']) });
    expect(res.completedStepIds).toContain('kill');
    // output kill giờ theo dạng bash thật (silent + job-kill line), không chèn PID -> kiểm tra process bị Killed
    expect(res.output).toContain('Killed');
  });

  it('CTF flag: cat /root/flag.txt đọc flag THẬT từ fs, hoàn thành capture_flag', () => {
    const m = getMission(8, 1);
    const res = run(m, 'cat /root/flag.txt', { completedSteps: new Set(['foothold', 'privesc']) });
    expect(res.completedStepIds).toContain('capture_flag');
    // flag đọc thật từ filesystem giả, khớp đúng nội dung file
    expect(res.output).toContain('FLAG{easy_sqli_then_sudo_python3}');
  });

  it('mission_completed=true sau khi chạy tuần tự đủ các lệnh (ch1m1)', () => {
    const m = getMission(1, 1);
    // không complete giữa chừng, chỉ true ở lệnh cuối
    const { log, last, completedSteps } = runSequence(m, ['cd /var/log', 'ls', 'tail -n 50 syslog']);
    expect(log[0].res.missionCompleted).toBe(false);
    expect(log[1].res.missionCompleted).toBe(false);
    expect(last.missionCompleted).toBe(true);
    // đủ cả 3 step
    expect(completedSteps).toEqual(new Set(['navigate', 'list', 'tail']));
  });

  it('lệnh không khớp + không phải shell hợp lệ -> command not found, không tiến độ', () => {
    const m = getMission(1, 1);
    const res = run(m, 'foobar');
    expect(res.output).toContain('command not found');
    expect(res.completedStepIds).toEqual([]);
    expect(res.missionCompleted).toBe(false);
  });

  it('không double-count: step đã hoàn thành thì lần gọi sau không xuất hiện lại trong completedStepIds', () => {
    const m = getMission(1, 1);
    // navigate đã xong; chạy lại cd /var/log không được report lại
    const res = run(m, 'cd /var/log', { completedSteps: new Set(['navigate']) });
    expect(res.completedStepIds).not.toContain('navigate');
  });
});

describe('instantiateMission — randomize placeholder', () => {
  it('no-op khi mission không có randomize (ch1-8 không đổi)', () => {
    const m = getMission(1, 1);
    expect(instantiateMission(m)).toBe(m);
  });

  it('randomize 2 lần cho ra flag KHÁC nhau', () => {
    const m = getMission(10, 1);
    const a = instantiateMission(m);
    const b = instantiateMission(m);
    const flagA = a.initialFilesystem['/root/flag.txt'].content;
    const flagB = b.initialFilesystem['/root/flag.txt'].content;
    expect(flagA).toMatch(/^FLAG\{[a-z0-9]+\}$/);
    expect(flagB).toMatch(/^FLAG\{[a-z0-9]+\}$/);
    expect(flagA).not.toBe(flagB);
  });

  it('placeholder {{...}} được thay sạch trong mọi field string', () => {
    const m = getMission(10, 1);
    const inst = instantiateMission(m);
    const blob = JSON.stringify({
      fs: inst.initialFilesystem,
      steps: inst.steps,
      hints: inst.hints,
      debrief: inst.debrief,
    });
    expect(blob).not.toContain('{{');
  });

  it('KHÔNG mutate mission/initialFilesystem gốc (vẫn còn placeholder)', () => {
    const m = getMission(10, 1);
    instantiateMission(m);
    expect(m.initialFilesystem['/root/flag.txt'].content).toBe('FLAG{{{flag}}}');
  });

  it('match vẫn khớp `cat /root/flag.txt` sau instantiate, đọc đúng flag random từ fs', () => {
    const inst = instantiateMission(getMission(10, 1));
    const expectedFlag = inst.initialFilesystem['/root/flag.txt'].content;
    const res = evaluateCommand('cat /root/flag.txt', {
      mission: inst,
      fs: inst.initialFilesystem,
      cwd: HOME,
      completedSteps: new Set(['recon_rce', 'escape']),
    });
    expect(res.completedStepIds).toContain('capture_flag');
    expect(res.output).toBe(expectedFlag);
    expect(res.output).toMatch(/^FLAG\{[a-z0-9]+\}$/);
  });
});
