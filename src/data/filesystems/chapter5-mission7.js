// Chương 5 — Mission 7: Liệt kê web ẩn (gobuster dir, gobuster -x, ffuf -mc 200).
// gobuster/ffuf là tool -> output canned. Đặt wordlist thật để ngữ cảnh khớp lệnh -w.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: 'Web: http://10.10.14.55/. Trang chủ trống. Brute-force directory + file ẩn (.php, .txt).',
  },
  '/home/hacker/common.txt': {
    type: 'file',
    content: ['admin', 'login', 'backup', 'config', 'uploads', 'dashboard', 'api', 'robots', 'index'].join('\n'),
  },
};
