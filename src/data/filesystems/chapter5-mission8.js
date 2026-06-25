// Chương 5 — Mission 8: Bản đồ subdomain (subfinder, amass, dig +short lộ IP nội bộ).
// subfinder/dig là tool -> output canned. File amass đặt thật để cat ra danh sách.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/scope.txt': {
    type: 'file',
    content: 'Target: acme-corp.com. Tìm hết subdomain, chú ý cái nào trỏ về IP private (10.x / 192.168.x) — đó là cửa nội bộ.',
  },
  // Output đã lưu từ amass — cat/grep thật được.
  '/home/hacker/amass.txt': {
    type: 'file',
    content: [
      'www.acme-corp.com',
      'mail.acme-corp.com',
      'vpn.acme-corp.com',
      'dev.acme-corp.com',
      'staging.acme-corp.com',
      'admin.acme-corp.com',
      'jira.acme-corp.com',
      'internal.acme-corp.com',
    ].join('\n'),
  },
};
