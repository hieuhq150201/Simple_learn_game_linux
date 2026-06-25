// Chương 5 — Mission 14: OSINT qua Shodan/Censys/crt.sh API (curl), hoàn toàn thụ động.
// curl gọi API ngoài -> output canned. Dump JSON đặt thật để cat/grep.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'IP: 203.0.113.42 (acme-corp.com). Không chạm trực tiếp — chỉ hỏi Shodan/Censys/crt.sh để xem ai đã quét/index host này trước mày.',
  },
  '/home/hacker/shodan.json': {
    type: 'file',
    content: [
      '{',
      '  "ip_str": "203.0.113.42",',
      '  "org": "DigitalOcean LLC",',
      '  "os": "Ubuntu",',
      '  "ports": [22, 80, 443, 3306],',
      '  "vulns": ["CVE-2021-3449"],',
      '  "hostnames": ["acme-corp.com", "www.acme-corp.com"]',
      '}',
    ].join('\n'),
  },
};
