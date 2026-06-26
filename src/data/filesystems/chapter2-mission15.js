export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/systemd': { type: 'dir' },
  '/etc/systemd/system': { type: 'dir' },
  '/etc/systemd/system/backup.service': { type: 'file', content: '[Unit]\nDescription=Backup Service\n[Service]\nType=oneshot\nExecStart=/opt/backup.sh\nStandardOutput=journal\n[Install]\nWantedBy=multi-user.target' },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
};
