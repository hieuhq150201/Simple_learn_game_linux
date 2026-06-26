// Chương 4 — Mission 8: SCP copy file từ xa
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/config': {
    type: 'file',
    content: [
      'Host prod',
      '  HostName 203.0.113.42',
      '  User deploy',
      '  IdentityFile ~/.ssh/id_ed25519',
      '  Port 22',
    ].join('\n'),
  },
  '/home/hacker/project': { type: 'dir' },
};
