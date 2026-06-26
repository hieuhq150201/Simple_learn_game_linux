// Chương 7 — Mission 16: Docker group privesc (mount root filesystem qua container).
// id / docker run là tool -> output canned. cat note + flag thật.
export default {
  '/': { type: 'dir' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{docker_group_mount_host_root}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/note.txt': {
    type: 'file',
    content: 'id liệt kê hacker thuộc group docker. Group đó tương đương root — docker daemon chạy bằng root và không hỏi lại mật khẩu.',
  },
};
