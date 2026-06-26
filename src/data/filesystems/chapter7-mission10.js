// Chương 7 — Mission 10: Sudo wildcard misconfig (cp với wildcard ghi đè /etc/passwd).
// sudo -l là tool -> output canned. cat /etc/passwd và ghi đè bằng cp là thật trên FS.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'hacker:x:1000:1000:hacker:/home/hacker:/bin/bash',
    ].join('\n'),
  },
  '/etc/sudoers.d': { type: 'dir' },
  '/etc/sudoers.d/backup': {
    type: 'file',
    content: [
      '# misconfig: wildcard sau /bin/cp cho phép cp ghi BẤT KỲ đích nào, kể cả /etc/passwd',
      'hacker ALL=(root) NOPASSWD: /bin/cp /var/backups/* *',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/backups': { type: 'dir' },
  '/var/backups/dummy.txt': { type: 'file', content: 'file backup vô hại, chỉ để wildcard có gì khớp' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{sudo_wildcard_cp_overwrites_passwd}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'sudo -l cho cp với dấu * ở cuối. Wildcard sau lệnh sudo luôn là dấu hiệu nguy hiểm — nó cho phép tự chọn đích ghi.',
  },
};
