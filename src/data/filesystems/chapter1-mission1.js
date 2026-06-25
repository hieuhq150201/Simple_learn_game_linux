// Mission 1: Tìm file log trong /var/log/ và đọc 50 dòng cuối
const logLines = Array.from({ length: 60 }, (_, i) => {
  if (i === 57) return '[2026-06-24 03:14:02] ERROR: Database connection pool exhausted (max_connections=100)';
  if (i === 58) return '[2026-06-24 03:14:03] ERROR: Failed to acquire connection after 30000ms';
  if (i === 59) return '[2026-06-24 03:14:05] FATAL: Service entering degraded mode';
  return `[2026-06-24 02:${String(10 + Math.floor(i / 4)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}] INFO: heartbeat ok`;
}).join('\n');

export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/syslog': { type: 'file', content: logLines },
  '/var/log/auth.log': { type: 'file', content: '[2026-06-24 01:00:00] INFO: sshd session opened for user deploy' },
  '/var/log/app': { type: 'dir' },
  '/var/log/app/production.log': { type: 'file', content: logLines },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
