// Chương 8 — Box GitLeak (Medium-Hard): /.git lộ trên web -> dump source -> tìm API key trong
// lịch sử commit (đã "xoá" nhưng còn trong git log) -> dùng key SSH vào -> binary có Linux
// capability cap_setuid -> privesc root. Flag CỐ ĐỊNH.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX GITLEAK — Target: 10.10.10.75 (black-box).',
      'Gợi ý chain: /.git lộ trên webroot -> dump cả repo -> soi commit log tìm API key đã "xoá"',
      '-> key đó chính là mật khẩu SSH user deploy -> tìm binary có Linux capability -> privesc root.',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/.git': { type: 'dir' },
  '/var/www/html/.git/config': {
    type: 'file',
    content: '[core]\n\trepositoryformatversion = 0\n[remote "origin"]\n\turl = git@internal:acme/deploy-app.git',
  },
  // "Đã xoá" ở commit mới nhất, nhưng vẫn còn nguyên trong lịch sử git log -p.
  '/var/www/html/.git/logs/HEAD': {
    type: 'file',
    content: [
      'commit a1b2c3d  Initial commit with hardcoded DEPLOY_API_KEY=sk_live_9fK2mQpL7xZ',
      'commit e4f5g6h  "remove secret from config" (key vẫn còn trong lịch sử commit cũ!)',
    ].join('\n'),
  },
  '/var/www/html/config.php': {
    type: 'file',
    content: "<?php // DEPLOY_API_KEY đã bị xoá ở đây, nhưng git log -p HEAD~1 vẫn show được\ndefine('DB_HOST', 'localhost');",
  },
  '/home/deploy': { type: 'dir' },
  '/usr/bin/perl': { type: 'file', content: '<binary> perl' },
  '/etc': { type: 'dir' },
  // Linux capability thay cho SUID: cap_setuid+ep trên perl -> GTFOBins privesc qua capabilities.
  '/etc/security/capability.conf': {
    type: 'file',
    content: '# getcap -r / sẽ liệt kê THẬT từ đây\n/usr/bin/perl cap_setuid+ep',
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{git_history_leak_apikey_then_capability_privesc}' },
};
