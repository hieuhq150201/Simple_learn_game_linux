// Chương 4 — Mission 14: SSH certificate (short-lived key)
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/.ssh': { type: 'dir' },
  '/home/hacker/.ssh/ssh-ca': {
    type: 'file',
    content: '-----BEGIN OPENSSH PRIVATE KEY-----\n...(CA private key)...\n-----END OPENSSH PRIVATE KEY-----',
  },
  '/home/hacker/.ssh/ssh-ca.pub': {
    type: 'file',
    content: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAm... ca@lab',
  },
  '/home/hacker/.ssh/user-key': {
    type: 'file',
    content: '-----BEGIN OPENSSH PRIVATE KEY-----\n...(user private key)...\n-----END OPENSSH PRIVATE KEY-----',
  },
  '/home/hacker/.ssh/user-key.pub': {
    type: 'file',
    content: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJx... user@lab',
  },
};
