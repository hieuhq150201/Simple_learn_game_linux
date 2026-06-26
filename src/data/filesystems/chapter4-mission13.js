// Chương 4 — Mission 13: Ansible (SSH dùng cho automation)
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/config': {
    type: 'file',
    content: [
      'Host web1',
      '  HostName web1.example.com',
      '  User deploy',
      '  IdentityFile ~/.ssh/id_ed25519',
      'Host web2',
      '  HostName web2.example.com',
      '  User deploy',
      '  IdentityFile ~/.ssh/id_ed25519',
    ].join('\n'),
  },
  '/home/hacker/inventory': {
    type: 'file',
    content: '[prod]\nweb1.example.com\nweb2.example.com\n\n[db]\ndb.example.com',
  },
};
