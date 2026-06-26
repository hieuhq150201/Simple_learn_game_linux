// Chương 4 — Mission 11: Hardening SSH server (disable root)
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
      'PubkeyAuthentication yes',
      'PasswordAuthentication yes',
      'MaxAuthTries 6',
      'AuthorizedKeysFile .ssh/authorized_keys',
      'Protocol 2',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
};
