// Chương 10 — Race Condition / TOCTOU. Elite, no-hint. Flag RANDOM ở /root/flag.txt.
// Script setuid-root kiểm tra file rồi mở file (check-then-use) -> đua giữa check và use,
// swap symlink đúng khoảnh khắc (TOCTOU) -> script đọc/ghi file mày chọn với quyền root -> flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — Có một backup-helper chạy bằng root theo cron, thao tác file dò theo input của mày. Không hint. Tự lực.',
  },
  '/home/hacker/recon.txt': {
    type: 'file',
    content: [
      'ls -la /usr/local/bin/backup-helper.sh -> -rwsr-xr-x root root  (setuid root)',
      'cat /usr/local/bin/backup-helper.sh:',
      '  #!/bin/bash',
      '  FILE="/tmp/backup/$1"',
      '  if [ -O "$FILE" ]; then        # CHECK: file thuộc về mày?',
      '    sleep 1                       # <-- khoảng hở giữa check và use (TOCTOU window)',
      '    cat "$FILE" >> /root/backup.log   # USE: root append nội dung vào file root quản lý',
      '  fi',
      'Nhận xét: check ownership rồi mới dùng — đổi file (symlink) NGAY SAU check, TRƯỚC use, là root sẽ cat nhầm file của attacker chọn.',
    ].join('\n'),
  },
  '/tmp': { type: 'dir' },
  '/tmp/backup': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/local': { type: 'dir' },
  '/usr/local/bin': { type: 'dir' },
  '/usr/local/bin/backup-helper.sh': {
    type: 'file',
    content: '#!/bin/bash\nFILE="/tmp/backup/$1"\nif [ -O "$FILE" ]; then\n  sleep 1\n  cat "$FILE" >> /root/backup.log\nfi\n',
  },
  '/root': { type: 'dir' },
  '/root/backup.log': { type: 'file', content: '' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
