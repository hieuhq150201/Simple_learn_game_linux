// Chương 5 — Mission 1: Từ 1 IP, xác định OS, services, version
// nmap/scan là ảo do AI generate. Filesystem chứa note target + banner gợi ý.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'PENTEST ENGAGEMENT — đã ký hợp đồng',
      'Target IP: 10.10.14.55',
      'Scope: full port scan, service/version detection, OS fingerprint.',
      'Mục tiêu: liệt kê OS, các service đang chạy và phiên bản cụ thể.',
    ].join('\n'),
  },
  '/home/hacker/notes': { type: 'dir' },
};
