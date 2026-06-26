// Chương 5 — Mission 17: Virtual host fuzzing (gobuster vhost / ffuf Host header) — site ẩn cùng IP.
// gobuster/ffuf/curl là tool -> output canned. FS giữ note ngữ cảnh.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: '10.10.14.55 chỉ trả về 1 site khi gõ thẳng IP. Nhưng domain wildcard *.acme-corp.com đều trỏ về IP này — có thể nhiều site khác đang giấu sau header Host.',
  },
  '/home/hacker/vhosts.txt': {
    type: 'file',
    content: ['www', 'dev', 'staging', 'admin', 'api', 'internal', 'test'].join('\n'),
  },
};
