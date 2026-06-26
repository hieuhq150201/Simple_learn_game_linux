// Chương 8 — Box CMS Weak Auth (Medium-Hard): WP REST API lộ username -> brute-force password yếu
// -> Plugin/Theme Editor trong wp-admin để RCE -> www-data -> PATH hijack một script root chạy
// (gọi "backup" KHÔNG dùng path tuyệt đối) -> root. Khác hẳn chain cron ở box Wordpress đầu (id 4).
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX CMS WEAK AUTH — Target: 10.10.10.80 (black-box).',
      'Gợi ý chain: /wp-json/wp/v2/users lộ username "j.admin" -> mật khẩu yếu đoán được',
      '-> đăng nhập wp-admin -> Theme Editor sửa 404.php chèn PHP -> RCE www-data',
      '-> root chạy script gọi "backup" không path tuyệt đối -> PATH hijack -> root.',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/wp-json-users.txt': {
    type: 'file',
    content: '[{"id":1,"name":"j.admin","slug":"j-admin"}]  // dump từ /wp-json/wp/v2/users — lộ username thật',
  },
  '/var/www/html/wp-content': { type: 'dir' },
  '/var/www/html/wp-content/themes': { type: 'dir' },
  '/var/www/html/wp-content/themes/active': { type: 'dir' },
  '/var/www/html/wp-content/themes/active/404.php': {
    type: 'file',
    content: "<?php // Theme Editor cho phép sửa file này trực tiếp trong wp-admin -> chèn webshell tại đây",
  },
  '/etc': { type: 'dir' },
  // VULN: root chạy "backup" KHÔNG dùng path tuyệt đối -> shell tìm theo $PATH -> hijack được.
  '/etc/cron.d/site-backup': {
    type: 'file',
    content: ['# m h dom mon dow user  command', '*/5 *  * * *  root  cd /var/www/html && backup'].join('\n'),
  },
  '/usr/local/bin': { type: 'dir' },
  '/usr/bin/backup': { type: 'file', mode: '0755', content: '#!/bin/bash\ntar czf /backup/site.tgz /var/www/html\n' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{wp_weak_password_theme_editor_then_path_hijack}' },
};
