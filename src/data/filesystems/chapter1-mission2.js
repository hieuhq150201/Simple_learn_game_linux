// Mission 2: Có ai đó xóa nhầm config — tìm tất cả file .conf trong hệ thống
export default {
  '/': { type: 'dir' },
  '/etc': { type: 'dir' },
  '/etc/nginx': { type: 'dir' },
  '/etc/nginx/nginx.conf': { type: 'file', content: 'user www-data;\nworker_processes auto;\n' },
  '/etc/ssh': { type: 'dir' },
  '/etc/ssh/sshd_config.conf': { type: 'file', content: 'Port 22\nPermitRootLogin no\n' },
  '/opt': { type: 'dir' },
  '/opt/app': { type: 'dir' },
  '/opt/app/app.conf': { type: 'file', content: 'env=production\nport=8080\n' },
  '/opt/app/backup.conf.bak': { type: 'file', content: 'env=staging\nport=8081\n' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};
