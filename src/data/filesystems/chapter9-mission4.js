// Chương 9 — Liệt kê miền (AD enum): crackmapexec SMB sweep -> enum4linux-ng -> ldapsearch.
// Toàn bộ là enum (output canned). Notes nằm trong FS; không có flag riêng (bài enum nền tảng).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Mục tiêu: lập bản đồ miền corp.local trước khi tấn công.',
      'Đã có 1 creds domain user quèn: corp.local\\jdoe : Welcome1',
      'DC: 10.10.10.5 (subnet 10.10.10.0/24).',
      'Cần: liệt kê host SMB, user/group/policy, danh sách sAMAccountName qua LDAP.',
    ].join('\n'),
  },
};
