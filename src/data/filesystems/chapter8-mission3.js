// Chương 8 — CTF Hard: full chain OSINT -> subdomain -> LFI -> log poisoning -> cron privesc -> flag
// Flag nằm ở /root/flag.txt (đọc được sau khi cron privesc thành root).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'CTF HARD — Domain: mega-corp.com (black-box).',
      'Chain gợi ý: OSINT -> tìm subdomain -> LFI trên web -> log poisoning lấy RCE -> cron privesc -> root.',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/index.php': {
    type: 'file',
    content: '<?php include($_GET["page"]); // VULN: LFI, can include /var/log/apache2/access.log',
  },
  '/var/log': { type: 'dir' },
  '/var/log/apache2': { type: 'dir' },
  '/var/log/apache2/access.log': {
    type: 'file',
    content: '10.10.10.50 - - "GET / HTTP/1.1" 200  # User-Agent injectable -> log poisoning for RCE',
  },
  '/etc': { type: 'dir' },
  '/etc/crontab': {
    type: 'file',
    content: '* * * * * root /opt/maint/run.sh  # run.sh world-writable -> inject shell to become root',
  },
  '/opt': { type: 'dir' },
  '/opt/maint': { type: 'dir' },
  '/opt/maint/run.sh': { type: 'file', content: '#!/bin/bash\n# perms -rwxrwxrwx (world-writable)\necho maintenance\n' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{full_chain_lfi_logpoison_cron_root}' },
};
