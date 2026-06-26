// Chương 7 — Mission 17: GTFOBins qua SUID trên `less` (pager) kèm bypass file bị chặn đọc trực tiếp.
// find -perm -4000 thật trên FS. cat /root/secret.key bị deny vì quyền -> phải qua less.
export default {
  '/': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/sudo': { type: 'file', content: '(binary) sudo — SUID root (bình thường)' },
  '/usr/bin/mount': { type: 'file', content: '(binary) mount — SUID root (bình thường)' },
  // Thằng bất thường: less có SUID -> GTFOBins (!/bin/sh trong less).
  '/usr/bin/less': { type: 'file', content: '(binary) less — SUID root, BẤT THƯỜNG, exploit qua GTFOBins (!/bin/sh trong less)' },
  '/root': { type: 'dir' },
  '/root/secret.key': { type: 'file', content: '-rw------- 1 root root — chỉ root đọc được, trừ khi mày LÀ root' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{suid_less_bang_shell_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'cat /root/secret.key báo Permission denied. Nhưng có một pager mang SUID — escape ra shell từ trong nó là chuyện cũ, vẫn hiệu quả.',
  },
};
