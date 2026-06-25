// Chương 10 — Mission 3 (Full red-team capstone: OSINT -> AD -> DCSync -> DA). Flag RANDOM ở /root/flag.txt.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'ELITE CTF CAPSTONE — Tổ chức: globex.io. Chỉ có tên miền. Tự đi từ OSINT tới Domain Admin.' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
