// Chương 7 — Mission 3: Sudo cho phép chạy vim, escape ra root shell
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/sudoers': {
    type: 'file',
    content: [
      '# User privilege specification',
      'root    ALL=(ALL:ALL) ALL',
      '# VULN: hacker may run vim as root without a password',
      'hacker  ALL=(root) NOPASSWD: /usr/bin/vim',
    ].join('\n'),
  },
  '/usr': { type: 'dir' },
  '/usr/bin': { type: 'dir' },
  '/usr/bin/vim': { type: 'file', content: '(binary) vim' },
  '/root': { type: 'dir' },
  '/root/.flag': { type: 'file', content: 'FLAG{sudo_vim_shell_escape}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
