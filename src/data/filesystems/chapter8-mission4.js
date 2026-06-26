// Chương 8 — Box Wordpress (Easy-Med): nmap -> wpscan vuln plugin -> www-data -> cron privesc.
// Privesc đọc THẬT /etc/crontab (root chạy script world-writable). Flag CỐ ĐỊNH ở /root/flag.txt.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX WORDPRESS — Target IP: 10.10.10.40 (black-box).',
      'Gợi ý chain: nmap -sV -> wpscan (plugin dính lỗi) -> www-data shell -> cron privesc -> root.',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/wp-config.php': {
    type: 'file',
    content: "<?php define('DB_NAME','wordpress'); define('DB_USER','wp'); define('DB_PASSWORD','wp_p4ss'); // WordPress site",
  },
  '/etc': { type: 'dir' },
  // VULN: cron của root chạy script world-writable -> inject lệnh để leo root.
  '/etc/crontab': {
    type: 'file',
    content: [
      '# m h dom mon dow user  command',
      '*/2 *  * * *  root  /opt/backup/wp-backup.sh',
    ].join('\n'),
  },
  '/opt': { type: 'dir' },
  '/opt/backup': { type: 'dir' },
  // perms -rwxrwxrwx (world-writable!): www-data ghi được, cron chạy bằng root.
  '/opt/backup/wp-backup.sh': {
    type: 'file',
    content: '#!/bin/bash\n# perms: -rwxrwxrwx (world-writable!)\ntar czf /tmp/wp.tgz /var/www/html\n',
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{wordpress_plugin_rce_then_cron_root}' },
};
