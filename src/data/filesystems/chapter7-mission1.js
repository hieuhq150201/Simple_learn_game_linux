// Chương 7 — Mission 1: Tìm binary có SUID bit, leo root
export default {
  '/': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/find': { type: 'file', content: '(binary) find — SUID bit set, owner root, exploitable via GTFOBins' },
  '/usr/bin/bash': { type: 'file', content: '(binary) bash' },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{suid_find_to_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Mày là user thường. Có vài binary SUID lạ trên hệ thống. Tìm và lợi dụng để thành root.',
  },
};
