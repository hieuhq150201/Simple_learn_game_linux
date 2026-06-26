// Chương 7 — Mission 12: LD_PRELOAD trong sudo -l (env_keep+=LD_PRELOAD).
// sudo -l output canned. Việc viết file .c giả + compile + chạy sudo: canned (không có compiler thật trong fake shell).
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/sudoers': {
    type: 'file',
    content: [
      '# misconfig: env_keep giữ lại LD_PRELOAD khi chạy sudo -> nạp .so tuỳ ý bằng quyền root',
      'Defaults        env_keep += "LD_PRELOAD"',
      'hacker ALL=(root) NOPASSWD: /usr/bin/find',
    ].join('\n'),
  },
  '/tmp': { type: 'dir' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{ld_preload_env_keep_root_shell}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'sudo -l có dòng env_keep += "LD_PRELOAD" — đây không phải lỗi binary, mà lỗi MÔI TRƯỜNG được giữ lại khi sudo chạy.',
  },
};
