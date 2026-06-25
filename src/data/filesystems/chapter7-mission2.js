// Chương 7 — Mission 2: Cron job root chạy script world-writable, inject shell
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/crontab': {
    type: 'file',
    content: [
      '# m h dom mon dow user  command',
      '*/5 *  * * *  root  /opt/scripts/cleanup.sh',
    ].join('\n'),
  },
  '/opt': { type: 'dir' },
  '/opt/scripts': { type: 'dir' },
  // VULN: script này world-writable (rwxrwxrwx), cron chạy bằng root
  '/opt/scripts/cleanup.sh': {
    type: 'file',
    content: '#!/bin/bash\n# perms: -rwxrwxrwx (world-writable!)\nrm -rf /tmp/*.tmp\n',
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{world_writable_cron_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
