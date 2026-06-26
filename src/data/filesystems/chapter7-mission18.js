// Chương 7 — Mission 18: Capstone full-chain enum -> nhiều vector -> chọn đúng đường -> root.
// Tổng hợp: id/sudo -l/uname -a canned; cat /etc/passwd, find SUID thật trên FS có cài cắm nhiều mồi nhử.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/passwd': {
    type: 'file',
    content: [
      'root:x:0:0:root:/root:/bin/bash',
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
      'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
      'deploy:x:1001:1001:Deploy bot:/home/deploy:/bin/bash',
      'hacker:x:1000:1000:hacker:/home/hacker:/bin/bash',
    ].join('\n'),
  },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/sudo': { type: 'file', content: '(binary) sudo — SUID root (bình thường)' },
  '/usr/bin/passwd': { type: 'file', content: '(binary) passwd — SUID root (bình thường)' },
  // Mồi nhử: SUID binary tồn tại nhưng KHÔNG phải đường nhanh nhất — đường thật là sudo NOPASSWD.
  '/usr/bin/base64': { type: 'file', content: '(binary) base64 — SUID root, khai thác được qua GTFOBins nhưng có đường ngắn hơn ở dưới' },
  '/opt': { type: 'dir' },
  '/opt/deploy.sh': { type: 'file', content: '#!/bin/bash\n# script deploy nội bộ, không liên quan privesc trực tiếp\necho "deploying..."\n' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{full_chain_enum_sudo_nopasswd_bash_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Đây là bài tốt nghiệp Chương 7. Enum đủ bộ: id, sudo -l, uname -a, /etc/passwd, SUID. Có nhiều mồi nhử — chọn đường NGẮN NHẤT tới root, đừng đi vòng.',
  },
};
