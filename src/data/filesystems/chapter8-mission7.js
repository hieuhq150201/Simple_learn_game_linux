// Chương 8 — Box Template (Easy-Med): web app render template động -> SSTI (Jinja2) -> RCE www-data
// -> sudo -l lộ /usr/bin/find chạy được KHÔNG cần password -> GTFOBins find -> root. Flag CỐ ĐỊNH.
export default {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content: [
      'BOX TEMPLATE — Target: 10.10.10.60 (black-box).',
      'Gợi ý chain: web app có ô nhập tên hiển thị lại y nguyên -> nghi SSTI -> RCE www-data',
      '-> sudo -l -> GTFOBins find -> root.',
    ].join('\n'),
  },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/app': { type: 'dir' },
  '/var/www/app/render.py': {
    type: 'file',
    content: [
      'from flask import Flask, request, render_template_string',
      'app = Flask(__name__)',
      '',
      "@app.route('/greet')",
      'def greet():',
      "    name = request.args.get('name', 'guest')",
      '    # VULN: nối thẳng input vào template, KHÔNG sanitize -> Server-Side Template Injection',
      "    return render_template_string(f'<h1>Xin chào {name}</h1>')",
    ].join('\n'),
  },
  '/etc': { type: 'dir' },
  // sudo -l sẽ đọc ra dòng này: www-data NOPASSWD chạy /usr/bin/find -> GTFOBins privesc.
  '/etc/sudoers.d/www-data': {
    type: 'file',
    content: '# Cấu hình sai: cho phép chạy find với quyền root, không cần password\nwww-data ALL=(ALL) NOPASSWD: /usr/bin/find',
  },
  '/usr/bin/find': { type: 'file', mode: '0755', content: '<binary> find (GNU findutils)' },
  '/root': { type: 'dir' },
  '/root/flag.txt': { type: 'file', content: 'FLAG{ssti_jinja2_rce_then_sudo_find_gtfobins}' },
};
