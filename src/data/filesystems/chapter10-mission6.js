// Chương 10 — Vượt tường lửa & Pivot sâu (elite, no-hint). Flag RANDOM ở /root/flag.txt.
// Foothold host biên -> phát hiện egress bị chặn -> reverse tunnel (chisel/ligolo) -> proxychains
// chạm segment cô lập -> khai thác box cuối. Output canned ở mission; notes nằm trong FS.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'ELITE — Foothold: 10.10.30.10 (host biên). Firewall chặn egress. Không hint. Tự lực.',
  },
  // Manh mối mạng phân đoạn để người chơi cat ra.
  '/home/hacker/recon.txt': {
    type: 'file',
    content: [
      'Host biên 2 interface:',
      '  eth0 10.10.30.10  (DMZ - bị firewall chặn outbound, chỉ cho 443 ra)',
      '  eth1 192.168.50.10 (segment nội bộ cô lập)',
      'Box cuối (crown jewel): 192.168.50.99 — chỉ tới được qua host biên.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{{{flag}}}' },
};
