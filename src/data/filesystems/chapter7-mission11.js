// Chương 7 — Mission 11: SUID trên python3 (GTFOBins os.setuid/os.setgid).
// find -perm -4000 chạy thật trên FS list binary có sẵn.
export default {
  '/': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/sudo': { type: 'file', content: '(binary) sudo — SUID root (bình thường)' },
  '/usr/bin/passwd': { type: 'file', content: '(binary) passwd — SUID root (bình thường)' },
  '/usr/bin/su': { type: 'file', content: '(binary) su — SUID root (bình thường)' },
  // Thằng bất thường: python3 có SUID -> GTFOBins os.setuid(0).
  '/usr/bin/python3': { type: 'file', content: '(binary) python3 — SUID root, BẤT THƯỜNG, exploit qua GTFOBins (os.setuid(0))' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{suid_python3_os_setuid_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Lần trước là find. Lần này soi lại toàn bộ danh sách SUID — một ngôn ngữ scripting có SUID còn nguy hiểm hơn nhiều.',
  },
};
