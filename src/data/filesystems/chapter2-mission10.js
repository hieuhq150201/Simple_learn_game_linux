export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/systemd': { type: 'dir' },
  '/etc/systemd/system': { type: 'dir' },
  '/etc/systemd/system/mysql.service': { type: 'file', content: '[Unit]\nDescription=MySQL Database Server\nAfter=network.target\n\n[Service]\nType=notify\nExecStart=/usr/sbin/mysqld\nRestart=on-failure\n\n[Install]\nWantedBy=multi-user.target' },
  '/etc/systemd/system/app.service': { type: 'file', content: '[Unit]\nDescription=Web Application\nAfter=mysql.service\nRequires=mysql.service\n\n[Service]\nType=simple\nExecStart=/opt/app/start.sh\nRestart=always\n\n[Install]\nWantedBy=multi-user.target' },
};
