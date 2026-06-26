// Chương 7 — Mission 13: Linux capabilities (cap_setuid trên python3 qua getcap).
// getcap -r / là tool -> output canned. cat note + flag là thật.
export default {
  '/': { type: 'dir' },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/python3.9': { type: 'file', content: '(binary) python3.9 — cap_setuid+ep (KHÔNG phải SUID bit, là capability)' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{capability_cap_setuid_python_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'find -perm -4000 lần này sạch, không SUID nào lạ. Nhưng SUID không phải cách duy nhất để binary có quyền root — còn capabilities.',
  },
};
