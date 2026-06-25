// Chương 3 — Mission 3: Traffic lạ đến server, dùng tcpdump capture
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/suspicious.log': {
    type: 'file',
    content: [
      '[2026-06-24 04:12:00] WARN: many unusual connections to port 4444',
      '[2026-06-24 04:12:10] WARN: source IP 198.51.100.7 sending packets continuously',
      '[2026-06-24 04:13:00] WARN: suspected C2 beacon, capture traffic for analysis',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
