// Chương 4 — Mission 5: Cấu hình SSH không mệt mỏi (~/.ssh/config)
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/id_ed25519': {
    type: 'file',
    content: '-----BEGIN OPENSSH PRIVATE KEY-----\n...(private key content)...\n-----END OPENSSH PRIVATE KEY-----',
  },
  '/home/hacker/.ssh/id_ed25519.pub': {
    type: 'file',
    content: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJx9K8p... hacker@lab',
  },
};
