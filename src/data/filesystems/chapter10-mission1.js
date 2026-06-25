// Chương 10 — Mission 1 (Web -> RCE -> container escape -> host). Flag RANDOM ở /root/flag.txt.
// Content FLAG{{{flag}}} -> sau substitute thành FLAG{<random>}.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': { type: 'file', content: 'ELITE CTF — Target: 10.10.20.10 (black-box). Không hint. Tự lực.' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
