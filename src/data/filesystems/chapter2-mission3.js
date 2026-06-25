// Chương 2 — Mission 3: Tạo cron job chạy script backup mỗi ngày lúc 2h sáng
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/crontab': {
    type: 'file',
    content: [
      '# /etc/crontab: system-wide crontab',
      'SHELL=/bin/sh',
      'PATH=/usr/sbin:/usr/bin:/sbin:/bin',
      '# m h dom mon dow user  command',
      '17 *  * * *  root  cd / && run-parts --report /etc/cron.hourly',
    ].join('\n'),
  },
  '/opt': { type: 'dir' },
  '/opt/scripts': { type: 'dir' },
  '/opt/scripts/backup.sh': {
    type: 'file',
    content: [
      '#!/bin/bash',
      '# Backup /var/www ra /backup',
      'tar -czf /backup/www-$(date +%F).tar.gz /var/www',
    ].join('\n'),
  },
  '/backup': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
