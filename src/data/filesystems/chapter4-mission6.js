// Chương 4 — Mission 6: Remote port forward (ssh -R)
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/config': {
    type: 'file',
    content: [
      'Host server',
      '  HostName example.com',
      '  User deploy',
      '  IdentityFile ~/.ssh/id_ed25519',
      '  Port 22',
    ].join('\n'),
  },
};
