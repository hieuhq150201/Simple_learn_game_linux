// Chương 5 — Mission 2: Tìm tất cả subdomain của domain target
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/scope.txt': {
    type: 'file',
    content: [
      'Target domain: acme-corp.com',
      'Nhiệm vụ: enumerate tất cả subdomain (passive + active).',
      'Gợi ý có thể tồn tại: dev, staging, mail, vpn, admin...',
      'Dùng subfinder/amass và check crt.sh.',
    ].join('\n'),
  },
};
