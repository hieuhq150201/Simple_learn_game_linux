// Chương 7 — Mission 9: Kernel & capabilities.
// uname -r / searchsploit / getcap / python3 setuid: tất cả tool -> output canned. FS giữ note.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Hết đường sudo/SUID thường. Soi kernel version tìm public exploit, và quét capabilities — cap_setuid là vé lên root.',
  },
};
