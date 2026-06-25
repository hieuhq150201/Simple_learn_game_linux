// Chương 9 — Mission 3 (DCSync -> Domain Admin): trích krbtgt, golden ticket. Flag CỐ ĐỊNH ở /root/.flag.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/notes.txt': {
    type: 'file',
    content: [
      'Đã có quyền replication trên DC (qua tài khoản chiếm được ở bước trước).',
      'Đòn kết: DCSync để rút hash krbtgt, từ đó forge Golden Ticket -> Domain Admin.',
      'Sau khi là DA, đọc cờ tại /root/.flag trên DC.',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{domain_admin_via_dcsync}' },
};
