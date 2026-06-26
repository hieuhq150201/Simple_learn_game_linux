// Chương 9 — LLMNR/NBT-NS poisoning: bật Responder, hứng NTLMv2 hash khi máy khác broadcast sai tên.
// Toàn bộ output canned. Không flag — bài enum/capture nền tảng dẫn sang crack offline.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đang ở trong mạng nội bộ corp.local, chưa có creds nào dùng được.',
      'Windows mặc định fallback LLMNR/NBT-NS khi DNS không resolve được — đây là cửa hứng hash.',
      'Kế hoạch: bật Responder nghe trên interface, đợi máy khác gõ sai tên share, hứng NTLMv2, đem crack offline.',
    ].join('\n'),
  },
};
