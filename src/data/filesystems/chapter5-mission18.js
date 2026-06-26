// Chương 5 — Mission 18: Bài tốt nghiệp — full recon chain, tự lưu report tổng hợp.
// dig/nmap/gobuster là tool -> output canned. report.txt được tạo thật qua redirect.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/engagement.txt': {
    type: 'file',
    content: [
      'Hợp đồng pentest acme-corp.com — bài tốt nghiệp Chương 5.',
      'Yêu cầu: chạy đủ chuỗi recon (DNS -> port -> service -> web) và nộp report.txt tổng hợp cho khách.',
    ].join('\n'),
  },
};
