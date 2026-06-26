// Chương 4 — Mission 10: Nâng SSH key từ RSA cũ lên ED25519
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/id_rsa': {
    type: 'file',
    content: '-----BEGIN RSA PRIVATE KEY-----\n...(RSA private key)...\n-----END RSA PRIVATE KEY-----',
  },
  '/home/hacker/.ssh/id_rsa.pub': {
    type: 'file',
    content: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC5... hacker@lab',
  },
  '/home/hacker/.ssh/id_ed25519.pub': {
    type: 'file',
    content: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKp9... hacker@lab',
  },
  '/home/hacker/.ssh/authorized_keys.bak': {
    type: 'file',
    content: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC5... hacker@lab',
  },
};
