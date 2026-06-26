// Chương 8 — Box Pivot (Medium): web shell -> phát hiện subnet nội bộ 172.16 -> ssh -D pivot
// -> proxychains nmap box nội bộ -> khai thác -> flag. Flag CỐ ĐỊNH ở /root/flag.txt (box nội bộ).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX PIVOT — Foothold: 10.10.10.45 (máy biên, dual-homed).',
      'Gợi ý: từ web shell xem route/arp -> lộ subnet 172.16.0.0/24 -> dựng SOCKS (ssh -D)',
      '-> proxychains quét + khai thác box nội bộ -> đọc flag.',
    ].join('\n'),
  },
  // Dấu vết route nội bộ để người chơi cat ra thấy (foothold là máy 2 card mạng).
  '/etc/proxychains.conf': {
    type: 'file',
    content: [
      '# proxychains: định tuyến traffic qua SOCKS proxy của tunnel',
      'strict_chain',
      '[ProxyList]',
      'socks5 127.0.0.1 1080',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/notes.txt': {
    type: 'file',
    content: [
      'Máy biên có 2 interface:',
      '  eth0 10.10.10.45  (mạng ngoài)',
      '  eth1 172.16.0.45  (mạng nội bộ - server quan trọng ở đây)',
      'DB server nội bộ: 172.16.0.10 (chỉ tới được từ máy biên).',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{pivot_through_dualhomed_host_via_proxychains}' },
};
