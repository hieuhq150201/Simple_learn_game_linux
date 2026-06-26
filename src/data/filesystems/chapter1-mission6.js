// Ch1 M6 — Săn chuỗi trong đống rơm: grep. File-based thật (grep substring chạy thật).
const authLog = [
  'Jun 25 02:01:09 web sshd[1201]: Accepted password for deploy from 10.0.0.5 port 51920',
  'Jun 25 02:14:33 web sshd[1233]: Failed password for root from 203.0.113.7 port 40222',
  'Jun 25 02:14:35 web sshd[1233]: Failed password for root from 203.0.113.7 port 40224',
  'Jun 25 02:14:39 web sshd[1233]: Failed password for admin from 203.0.113.7 port 40231',
  'Jun 25 02:20:01 web sshd[1301]: Accepted publickey for deploy from 10.0.0.5 port 52001',
  'Jun 25 03:02:11 web sshd[1450]: Failed password for root from 198.51.100.9 port 33890',
].join('\n');

const appLog = [
  '[INFO] 2026-06-25 02:00 server started',
  '[WARN] 2026-06-25 02:05 high memory usage 82%',
  '[ERROR] 2026-06-25 02:14 db connection timeout',
  '[ERROR] 2026-06-25 02:15 retry failed',
  '[WARN] 2026-06-25 02:30 slow query 1200ms',
  '[ERROR] 2026-06-25 03:02 unhandled exception in /api/login',
].join('\n');

export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/auth.log': { type: 'file', content: authLog },
  '/var/log/app.log': { type: 'file', content: appLog },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
