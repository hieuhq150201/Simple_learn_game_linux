// Chương 9 — AS-REP Roasting: GetNPUsers (no-pass) -> hashcat -m 18200 -> crackmapexec verify.
// Output canned. Notes trong FS. Không có flag file (bài kỹ thuật creds, kết thúc bằng verify [+]).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Từ bước enum: phát hiện vài user bật cờ "Do not require Kerberos preauthentication".',
      'Những user đó có thể bị AS-REP Roast: xin AS-REP không cần mật khẩu -> hash crack offline.',
      'DC: 10.10.10.5, domain corp.local. Wordlist: rockyou.txt.',
    ].join('\n'),
  },
};
