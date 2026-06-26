// Chương 7 — Mission 5: Săn SUID & GTFOBins.
// `find / -perm -4000` chạy THẬT trên FS -> phải đặt binary có sẵn để find ra list.
// find -exec /bin/sh -p và cat flag: bước exploit canned, nhưng flag đặt thật để cat đọc.
export default {
  '/': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/sudo': { type: 'file', content: '(binary) sudo — SUID root (bình thường)' },
  '/usr/bin/passwd': { type: 'file', content: '(binary) passwd — SUID root (bình thường)' },
  '/usr/bin/mount': { type: 'file', content: '(binary) mount — SUID root (bình thường)' },
  // Thằng bất thường: find có SUID -> GTFOBins privesc.
  '/usr/bin/find': { type: 'file', content: '(binary) find — SUID root, BẤT THƯỜNG, exploit qua GTFOBins (-exec /bin/sh -p)' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{suid_find_exec_p_keeps_euid_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Tìm mọi binary có SUID bit. Cái nào không-bình-thường thì tra GTFOBins. Cờ nằm trong /root.',
  },
};
