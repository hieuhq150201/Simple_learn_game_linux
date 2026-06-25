// Chương 2 — Mission 1: Tìm process ngốn CPU nhiều nhất và kill nó
// Process list là ảo, do AI generate dựa vào context. Filesystem chỉ cung cấp manh mối.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/syslog': {
    type: 'file',
    content: [
      '[2026-06-24 02:58:11] INFO: system load average rising: 1.20',
      '[2026-06-24 03:01:45] WARN: CPU usage above 90% for 120s',
      '[2026-06-24 03:02:30] WARN: process "miner" spawned by user www-data (pid 6713)',
      '[2026-06-24 03:05:00] WARN: load average 8.40, server unresponsive',
    ].join('\n'),
  },
  '/tmp': { type: 'dir' },
  '/tmp/miner': { type: 'file', content: '#!/bin/sh\nwhile true; do :; done\n' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
