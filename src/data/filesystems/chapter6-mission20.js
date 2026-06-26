// Chương 6 — Mission 20 (boss bài Chương 6): SSTI (Jinja2) -> RCE -> đọc cờ.
// curl là tool -> output canned (SSTI confirm + RCE qua __class__ chain). Flag thật trong filesystem.
export default {
  '/': { type: 'dir' },
  '/var': { type: 'dir' },
  '/var/www': { type: 'dir' },
  '/var/www/html': { type: 'dir' },
  '/var/www/html/greet.py': {
    type: 'file',
    content: [
      '# VULN: render_template_string ghép thẳng input người dùng vào template Jinja2',
      'from flask import Flask, request, render_template_string',
      'app = Flask(__name__)',
      '',
      '@app.route("/greet")',
      'def greet():',
      '    name = request.args.get("name", "")',
      '    return render_template_string("<h1>Hello " + name + "</h1>")',
    ].join('\n'),
  },
  '/var/www/html/flag.txt': { type: 'file', content: 'FLAG{ssti_jinja2_sandbox_escape_to_rce}' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
  '/home/hacker/target.txt': {
    type: 'file',
    content:
      'Endpoint: http://target/greet?name=... ghép thẳng vào Jinja2 template. Thử {{7*7}} xác nhận SSTI trước, rồi leo dùng __class__.__mro__ chain để gọi os.popen và đọc /var/www/html/flag.txt.',
  },
};
