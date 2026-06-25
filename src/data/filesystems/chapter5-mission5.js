// Chương 5 — Mission 5: Quét cổng toàn diện (nmap host discovery, -p-, -sV -sC, -O).
// Tất cả là tool nmap -> output canned. FS chỉ giữ note cho ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'Scope active: subnet 10.10.14.0/24. Host chính nghi là 10.10.14.55. Quét cho kỹ, đừng bỏ port cao.',
  },
};
