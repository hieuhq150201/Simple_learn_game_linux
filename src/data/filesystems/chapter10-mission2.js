// Chương 10 — Mission 2 (Binary exploit ret2win -> privesc). Flag RANDOM ở /root/flag.txt.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'ELITE CTF — Target: 10.10.20.20 (black-box). Có service nhị phân lạ trên port 31337.' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
