// Chương 10 — Kernel Exploit (DirtyPipe CVE-2022-0847). Elite, no-hint. Flag RANDOM ở /root/flag.txt.
// Shell www-data quyền thấp -> xác định kernel version dính lỗi -> ghi đè file read-only qua pipe
// page cache (CVE-2022-0847) -> patch /etc/passwd hoặc cấy SUID -> root -> flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — Shell www-data trên host nội bộ. Kernel cũ. Không hint. Tự lực.',
  },
  // Manh mối: uname đã lộ version, attacker tự tra CVE.
  '/home/hacker/recon.txt': {
    type: 'file',
    content: [
      'whoami -> www-data (uid=33, quyền thấp, không sudo)',
      'uname -r -> 5.16.7  (kernel Linux dòng 5.8 - 5.16.11, trước patch tháng 3/2022)',
      'cat /etc/passwd -> root:x:0:0:root:/root:/bin/bash  (world-readable nhưng KHÔNG world-writable)',
      'find / -perm -4000 2>/dev/null -> không có SUID binary nào hữu ích sẵn',
    ].join('\n'),
  },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: 'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nhacker:x:1000:1000:hacker:/home/hacker:/bin/bash\n',
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
