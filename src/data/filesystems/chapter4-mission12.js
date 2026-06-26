// Chương 4 — Mission 12: Fail2ban (tự động chặn brute-force)
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/fail2ban': { type: 'dir' },
  '/etc/fail2ban/jail.conf': {
    type: 'file',
    content: [
      '[DEFAULT]',
      'bantime = 600',
      'findtime = 600',
      'maxretry = 5',
      '[sshd]',
      'enabled = true',
      'port = ssh',
      'logpath = /var/log/auth.log',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/fail2ban.log': {
    type: 'file',
    content: '[2026-06-25 10:00:00,000] fail2ban.filter [403]: INFO [sshd] Found 203.0.113.7\n[2026-06-25 10:00:05,000] fail2ban.actions [404]: NOTICE [sshd] Ban 203.0.113.7',
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
};
