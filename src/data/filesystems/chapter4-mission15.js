// Chương 4 — Mission 15: SSH security audit (tổng hợp)
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
  '/etc/fail2ban': { type: 'dir' },
  '/etc/fail2ban/jail.conf': {
    type: 'file',
    content: '[DEFAULT]\nbantime = 600\nfindtime = 600\nmaxretry = 5',
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/authorized_keys': {
    type: 'file',
    content: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC5... old_key@lab\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKp9... hacker@lab',
  },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
};
