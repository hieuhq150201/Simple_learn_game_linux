// Chương 6 — Mission 7: Đọc file qua LFI (path traversal + php://filter + log chain).
// curl là tool -> output canned. Đặt /etc/passwd THẬT để cat/grep ra root khi giải thích traversal.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'mysql:x:111:118:MySQL Server:/nonexistent:/bin/false',
      'devops:x:1000:1000:DevOps:/home/devops:/bin/bash',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/index.php': {
    type: 'file',
    content: [
      '<?php',
      '// VULN LFI: include thẳng tham số page, không whitelist, không chặn ../',
      '$page = $_GET["page"];',
      'include("/var/www/html/pages/" . $page);',
      '?>',
    ].join('\n'),
  },
  '/var/log': { type: 'dir' },
  '/var/log/apache2': { type: 'dir' },
  '/var/log/apache2/access.log': {
    type: 'file',
    content: [
      '10.10.14.9 - - [25/Jun:10:00:01] "GET / HTTP/1.1" 200 512 "-" "Mozilla/5.0"',
      '10.10.14.9 - - [25/Jun:10:00:09] "GET /favicon.ico HTTP/1.1" 404 209 "-" "Mozilla/5.0"',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'http://target/index.php?page=... — LFI. Đọc /etc/passwd, thử php://filter base64, rồi nghĩ tới log chain.' },
};
