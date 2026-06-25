// Chương 2 — Mission 2: Service bị crash, restart và set auto-start khi boot
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/systemd': { type: 'dir' },
  '/etc/systemd/system': { type: 'dir' },
  '/etc/systemd/system/nginx.service': {
    type: 'file',
    content: [
      '[Unit]',
      'Description=nginx web server',
      'After=network.target',
      '',
      '[Service]',
      'ExecStart=/usr/sbin/nginx -g "daemon off;"',
      'Restart=on-failure',
      '',
      '[Install]',
      'WantedBy=multi-user.target',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/log': { type: 'dir' },
  '/var/log/nginx': { type: 'dir' },
  '/var/log/nginx/error.log': {
    type: 'file',
    content: [
      '[2026-06-24 03:10:02] [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)',
      '[2026-06-24 03:10:02] [emerg] nginx: master process exited with code 1',
      '[2026-06-24 03:10:03] nginx.service: main process exited, status=1/FAILURE',
    ].join('\n'),
  },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
