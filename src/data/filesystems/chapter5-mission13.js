// Chương 5 — Mission 13: nmap --script vuln (CVE scanning tự động qua NSE).
// nmap là tool -> output canned. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/services.txt': {
    type: 'file',
    content: '10.10.14.55 đã biết: SSH 8.2p1, Apache 2.4.41, Samba 4.11.6, MySQL 5.7.33. Soi xem NSE vuln script có bắt được CVE nào không.',
  },
};
