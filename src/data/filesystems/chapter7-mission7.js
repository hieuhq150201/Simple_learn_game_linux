// Chương 7 — Mission 7: Cướp PATH.
// cat /opt/backup.sh THẬT (gọi `tar` không full path). echo > /tmp/tar + chmod chạy thật trên FS.
// export PATH và chạy script: bước canned (script chạy bằng root). Flag đặt thật để cat.
export default {
  '/': { type: 'dir' },
  '/opt': { type: 'dir' },
  // Script này (cron của root chạy) gọi `tar` bằng tên trần, KHÔNG dùng /bin/tar -> PATH hijack.
  '/opt/backup.sh': {
    type: 'file',
    content: [
      '#!/bin/bash',
      '# Chạy mỗi 5 phút bởi root. LỖI: gọi "tar" không full path -> bị PATH hijack',
      'cd /var/www/html',
      'tar -czf /opt/backups/site.tgz .',
    ].join('\n'),
  },
  '/opt/backups': { type: 'dir' },
  '/tmp': { type: 'dir' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{path_hijack_relative_binary_runs_as_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Có script root chạy định kỳ. Đọc nó: lệnh nào gọi bằng tên trần (không /bin/...) là cướp PATH được.',
  },
};
