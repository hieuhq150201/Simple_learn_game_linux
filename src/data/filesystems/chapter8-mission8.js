// Chương 8 — Box Redis (Medium): Redis không auth -> ghi SSH key qua redis-cli (CVE-2022-0543 style)
// -> SSH vào với key -> cron world-writable của root -> privesc -> flag. Flag CỐ ĐỊNH.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX REDIS — Target: 10.10.10.65 (black-box).',
      'Gợi ý chain: scan ra Redis 6379 không auth -> dùng redis-cli ghi authorized_keys',
      '-> SSH vào bằng key mình tự đẩy lên -> cron root world-writable -> root.',
    ].join('\n'),
  },
  '/etc': { type: 'dir' },
  // VULN: cron của root chạy script world-writable trong /opt/sync — vector privesc thứ 2.
  '/etc/cron.d/redis-sync': {
    type: 'file',
    content: ['# m h dom mon dow user  command', '*/3 *  * * *  root  /opt/sync/flush.sh'].join('\n'),
  },
  '/opt': { type: 'dir' },
  '/opt/sync': { type: 'dir' },
  '/opt/sync/flush.sh': {
    type: 'file',
    content: '#!/bin/bash\n# perms: -rwxrwxrwx (world-writable!)\nredis-cli BGSAVE\n',
  },
  '/var': { type: 'dir' },
  '/var/lib': { type: 'dir' },
  '/var/lib/redis': { type: 'dir' },
  '/var/lib/redis/dump.rdb': { type: 'file', content: '<binary RDB dump — redis service ghi tại đây>' },
  '/var/lib/redis/.ssh': { type: 'dir' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{redis_unauth_ssh_key_then_cron_root}' },
};
