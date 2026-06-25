// Chương 9 — Mission 2 (Pass-the-Hash lateral): dump NTLM, move sang host khác.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã chiếm svc_sql (mật khẩu Summer2024) — local admin trên WS01 (10.10.10.21).',
      'Subnet nội bộ: 10.10.10.0/24. Còn WS02 (10.10.10.22), FILE01 (10.10.10.30).',
      'Không bao giờ cần plaintext: dump NTLM hash rồi Pass-the-Hash sang máy khác.',
    ].join('\n'),
  },
};
