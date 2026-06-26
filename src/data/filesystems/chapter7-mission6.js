// Chương 7 — Mission 6: Sudo cấu hình sai (vim/tar NOPASSWD).
// sudo -l và sudo vim là tool -> output canned. Flag đặt thật để cat sau khi có root shell.
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/sudoers': {
    type: 'file',
    content: [
      '# misconfig: cho hacker chạy vim và tar bằng root không cần mật khẩu',
      'hacker ALL=(root) NOPASSWD: /usr/bin/vim, /usr/bin/tar',
    ].join('\n'),
  },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{sudo_vim_shell_escape_to_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'Check sudo -l. Nếu được chạy editor/archiver bằng root, GTFOBins luôn có đường escape ra shell.',
  },
};
