// Chương 9 — NTLM relay (ntlmrelayx): relay hash hứng được sang máy khác có SMB signing tắt -> dump SAM.
// Output canned. Không flag — nối tiếp M7 (đã có hash NTLMv2, giờ relay thay vì crack).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã hứng được NTLMv2 hash của WS02$ qua Responder, nhưng crack offline chậm và có thể không ra.',
      'WS01 (10.10.10.21) báo SMB signing:False ở bài enum trước — máy này nhận relay được.',
      'Kế hoạch: tắt phần crack hash của Responder, chỉ poison để hứng connection, relay sống ngay sang WS01.',
    ].join('\n'),
  },
};
