// Chương 8 — CTF Easy: Web SQLi + sudo misconfig -> flag
// Flag nằm ở /root/flag.txt (chỉ đọc được sau khi privesc qua sudo misconfig).
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/login.php': {
    type: 'file',
    content: '<?php $q = "SELECT * FROM users WHERE user=\'$u\' AND pass=\'$p\'"; // SQLi: input concatenated directly',
  },
  '/etc': { type: 'dir' },
  '/etc/sudoers': {
    type: 'file',
    content: 'www-data ALL=(root) NOPASSWD: /usr/bin/python3  # misconfig: privesc to root via python3',
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{easy_sqli_then_sudo_python3}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'CTF EASY — Target IP: 10.10.10.20. Black-box. Tìm flag.' },
};
