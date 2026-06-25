// Chương 5 — Mission 12: dnsrecon brute-force subdomain qua DNS (khác hẳn subfinder/amass passive đã dùng ở bài 8).
// dnsrecon là tool -> output canned. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'Domain: acme-corp.com. Passive recon đã xong (subfinder/amass). Giờ brute-force chủ động qua DNS để bắt subdomain mà passive bỏ sót.',
  },
};
