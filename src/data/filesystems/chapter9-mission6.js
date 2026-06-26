// Chương 9 — Lạm dụng Delegation: tìm tài khoản có (un)constrained delegation -> getST -impersonate
// Administrator -> psexec SYSTEM. Output canned. Flag CỐ ĐỊNH ở /root/.flag (đọc sau khi là SYSTEM trên DC).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã kiểm soát 1 tài khoản service có cấu hình Kerberos delegation.',
      'Constrained delegation cho phép mạo danh (S4U2Self/S4U2Proxy) tới dịch vụ khác.',
      'Kế hoạch: tìm account delegation -> getST mạo danh Administrator -> psexec lên SYSTEM -> đọc /root/.flag.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{constrained_delegation_s4u_impersonation}' },
};
