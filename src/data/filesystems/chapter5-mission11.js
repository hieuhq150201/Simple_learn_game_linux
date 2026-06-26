// Chương 5 — Mission 11: dirb + theHarvester (thu thập email/host từ nguồn mở).
// dirb/theHarvester là tool -> output canned. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'Web: http://10.10.14.55/. Domain: acme-corp.com. Cần thêm góc nhìn directory (dirb) và email/host công khai (theHarvester).',
  },
};
