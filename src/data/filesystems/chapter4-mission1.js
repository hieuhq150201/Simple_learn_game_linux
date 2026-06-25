// Chương 4 — Mission 1: Setup SSH key cho server mới, disable password auth
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/ssh': { type: 'dir' },
  '/etc/ssh/sshd_config': {
    type: 'file',
    content: [
      '# /etc/ssh/sshd_config',
      'Port 22',
      'PermitRootLogin yes',
      '#PasswordAuthentication yes',
      'PubkeyAuthentication yes',
      'AuthorizedKeysFile .ssh/authorized_keys',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
};
