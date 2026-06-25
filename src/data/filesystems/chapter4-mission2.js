// Chương 4 — Mission 2: DB chỉ mở localhost, tạo SSH tunnel để access từ máy local
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/config': {
    type: 'file',
    content: [
      'Host prod',
      '    HostName 203.0.113.42',
      '    User deploy',
      '    Port 22',
    ].join('\n'),
  },
  '/home/hacker/db-note.txt': {
    type: 'file',
    content: [
      'PostgreSQL trên server prod chỉ listen 127.0.0.1:5432.',
      'Không mở ra ngoài vì lý do bảo mật.',
      'Muốn dùng pgAdmin từ máy local thì phải tạo SSH tunnel (local forward).',
      'Forward local 5432 -> prod 127.0.0.1:5432.',
    ].join('\n'),
  },
};
