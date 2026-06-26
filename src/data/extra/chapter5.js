// Mission MỚI (bổ sung) cho Chương 5 — Recon & Enumeration. Bám OSCP PEN-200 (M5/M6/M7) / eJPT / PNPT.
// Engine offline: lệnh file-based (cat/grep/find) KHÔNG có output (engine tự sinh từ filesystem);
// lệnh tool (whois/dig/nmap/nc/gobuster/ffuf/subfinder/whatweb/nikto) PHẢI có output canned tiếng Anh.
import fsC5M4 from '../filesystems/chapter5-mission4.js';
import fsC5M5 from '../filesystems/chapter5-mission5.js';
import fsC5M6 from '../filesystems/chapter5-mission6.js';
import fsC5M7 from '../filesystems/chapter5-mission7.js';
import fsC5M8 from '../filesystems/chapter5-mission8.js';
import fsC5M9 from '../filesystems/chapter5-mission9.js';
import fsC5M10 from '../filesystems/chapter5-mission10.js';
import fsC5M11 from '../filesystems/chapter5-mission11.js';
import fsC5M12 from '../filesystems/chapter5-mission12.js';
import fsC5M13 from '../filesystems/chapter5-mission13.js';
import fsC5M14 from '../filesystems/chapter5-mission14.js';
import fsC5M15 from '../filesystems/chapter5-mission15.js';
import fsC5M16 from '../filesystems/chapter5-mission16.js';
import fsC5M17 from '../filesystems/chapter5-mission17.js';
import fsC5M18 from '../filesystems/chapter5-mission18.js';

export default [
  {
    id: 4,
    chapterId: 5,
    title: 'Trinh sát thụ động',
    story:
      'Khách ký hợp đồng OSINT cho acme-corp.com nhưng dặn: chưa được đụng trực tiếp vào server. Mày phải moi thông tin từ nguồn công khai — WHOIS, DNS, và log chứng chỉ — mà không gửi một gói tin nào tới hạ tầng của họ.',
    steps: [
      {
        id: 'whois',
        description: 'Tra WHOIS để biết registrar, name server, ngày tạo/hết hạn',
        match: /^whois\s+acme-corp\.com/i,
        output: [
          'Domain Name: ACME-CORP.COM',
          'Registrar: NameCheap, Inc.',
          'Creation Date: 2014-03-11T09:22:00Z',
          'Registry Expiry Date: 2027-03-11T09:22:00Z',
          'Name Server: NS1.DIGITALOCEAN.COM',
          'Name Server: NS2.DIGITALOCEAN.COM',
          'Registrant Organization: Acme Corp Ltd',
          'Registrant Email: admin@acme-corp.com',
        ].join('\n'),
      },
      {
        id: 'dig_a',
        description: 'Lấy nhanh A record của domain bằng dig +short',
        match: /^dig\s+(\+short\s+)?acme-corp\.com(\s+a)?(\s+\+short)?\s*$/i,
        output: '203.0.113.42',
      },
      {
        id: 'dig_txt',
        description: 'Đọc TXT record (thường lộ SPF, verification, hạ tầng mail/cloud)',
        match: /^dig\s+(\+short\s+)?(txt\s+acme-corp\.com|acme-corp\.com\s+txt)/i,
        output: [
          '"v=spf1 include:_spf.google.com include:sendgrid.net ~all"',
          '"google-site-verification=Hh3kL9pQ2rT..."',
          '"atlassian-domain-verification=8fJ2..."',
        ].join('\n'),
      },
      {
        id: 'ct_log',
        description: 'Đọc dump Certificate Transparency để moi subdomain đã cấp cert',
        match: /^(cat|grep)\b.*crtsh\.txt/,
      },
    ],
    hints: [
      'Thụ động nghĩa là KHÔNG chạm host target — chỉ hỏi bên thứ ba (registrar, DNS, CT log).',
      'Bắt đầu `whois acme-corp.com`, rồi `dig +short acme-corp.com` và `dig +short txt acme-corp.com`.',
      'Log chứng chỉ (Certificate Transparency) lưu mọi cert đã cấp -> lộ subdomain. Mở file đã tải: `cat /home/hacker/crtsh.txt` (chú ý gitlab-internal, admin).',
    ],
    debrief: [
      'Recon thụ động không gửi gói nào tới hạ tầng nạn nhân nên gần như vô hình — không log nào ở phía họ ghi lại mày.',
      'WHOIS/DNS/CT là vàng OSINT: registrar và name server lộ nhà cung cấp hạ tầng; TXT lộ SaaS đang dùng (Google, SendGrid, Atlassian); CT log lộ subdomain nội bộ mà admin tưởng đã giấu.',
      'Certificate Transparency là sổ cái công khai bắt buộc cho mọi cert TLS — vô tình biến thành nguồn liệt kê subdomain miễn phí cho attacker.',
      'DEFENDER: dùng wildcard cert để bớt lộ tên host cụ thể; tách tên DNS nội bộ ra khỏi DNS public; ẩn thông tin registrant (WHOIS privacy); coi mọi thứ đã lên CT log là công khai vĩnh viễn.',
    ],
    terms: [
      { term: 'OSINT', def: 'Thu thập thông tin từ nguồn công khai (WHOIS, DNS, mạng xã hội, log cert) — không tấn công trực tiếp.' },
      { term: 'Passive vs Active', def: 'Thụ động = không chạm target (vô hình); chủ động = gửi gói trực tiếp (nhanh hơn nhưng để lại dấu vết).' },
      { term: 'WHOIS', def: 'Bản ghi đăng ký tên miền: registrar, name server, ngày tạo/hết hạn, email liên hệ.' },
      { term: 'Certificate Transparency', def: 'Sổ cái công khai ghi mọi cert TLS đã cấp; tra cứu (crt.sh) để liệt kê subdomain.' },
    ],
    initialFilesystem: fsC5M4,
  },
  {
    id: 5,
    chapterId: 5,
    title: 'Quét cổng toàn diện',
    story:
      'Đã sang giai đoạn active. Scope: subnet 10.10.14.0/24, host chính nghi là 10.10.14.55. Mày phải tìm host nào sống, quét HẾT 65535 cổng (đừng để sót port cao), rồi lấy version dịch vụ và đoán OS.',
    steps: [
      {
        id: 'host_discovery',
        description: 'Host discovery cả subnet để biết máy nào đang sống',
        match: /^nmap\s+.*-sn\b.*10\.10\.14\.0\/24|^nmap\s+-sn\b/i,
        output: [
          'Starting Nmap 7.94 ( https://nmap.org )',
          'Nmap scan report for 10.10.14.1   Host is up (0.012s latency).',
          'Nmap scan report for 10.10.14.55  Host is up (0.009s latency).',
          'Nmap scan report for 10.10.14.80  Host is up (0.030s latency).',
          'Nmap done: 256 IP addresses (3 hosts up) scanned in 2.41s',
        ].join('\n'),
      },
      {
        id: 'all_ports',
        description: 'Quét toàn bộ 65535 cổng TCP (-p-) trên host chính',
        match: /^nmap\b.*-p-(\s|$)/,
        output: [
          'Nmap scan report for 10.10.14.55',
          'PORT      STATE SERVICE',
          '22/tcp    open  ssh',
          '80/tcp    open  http',
          '139/tcp   open  netbios-ssn',
          '445/tcp   open  microsoft-ds',
          '3306/tcp  open  mysql',
          '8080/tcp  open  http-proxy',
          '49152/tcp open  unknown      <- port cao, scan mặc định (top-1000) sẽ bỏ sót',
        ].join('\n'),
      },
      {
        id: 'version_scripts',
        description: 'Lấy version dịch vụ (-sV) và chạy NSE mặc định (-sC)',
        match: /^nmap\b.*(-sv\b.*-sc\b|-sc\b.*-sv\b|-scv\b)/i,
        output: [
          'PORT     STATE SERVICE     VERSION',
          '22/tcp   open  ssh         OpenSSH 8.2p1 Ubuntu 4ubuntu0.5',
          '80/tcp   open  http        Apache httpd 2.4.41 ((Ubuntu))',
          '445/tcp  open  netbios-ssn Samba smbd 4.11.6-Ubuntu',
          '3306/tcp open  mysql       MySQL 5.7.33',
          '| http-title: Acme Internal Portal',
          '|_http-server-header: Apache/2.4.41',
        ].join('\n'),
      },
      {
        id: 'os_detect',
        description: 'Fingerprint hệ điều hành (-O)',
        match: /^nmap\b.*-o\b/i,
        output: [
          'Running: Linux 5.X',
          'OS CPE: cpe:/o:linux:linux_kernel:5.4',
          'OS details: Linux 5.4 (Ubuntu 20.04)',
          'Network Distance: 2 hops',
        ].join('\n'),
      },
    ],
    hints: [
      'Trình tự chuẩn: tìm host sống -> quét full port -> đào version/OS trên port mở.',
      'Host discovery: `nmap -sn 10.10.14.0/24`. Full port: `nmap -p- 10.10.14.55` (mặc định chỉ quét top-1000, bỏ sót port cao).',
      'Sau khi biết port mở: `nmap -sV -sC -p22,80,445,3306 10.10.14.55` rồi `nmap -O 10.10.14.55` để đoán OS. Hoặc gộp `nmap -A`.',
    ],
    debrief: [
      'Quét mặc định của nmap chỉ chạm 1000 port phổ biến — service nằm ở port cao (vd 49152) sẽ vô hình nếu mày không dùng -p-. Bỏ sót một port là bỏ sót cả một đường vào.',
      '-sS (SYN scan) gửi SYN rồi RST trước khi bắt tay xong nên nhanh và ít bị log hơn full connect; -sV bắt tay với dịch vụ để đọc banner xác định version; -sC chạy bộ script NSE mặc định để moi thêm thông tin.',
      'Attacker đối chiếu version cụ thể (OpenSSH 8.2p1, MySQL 5.7.33) với CSDL CVE — version là cầu nối từ "có service" sang "có exploit".',
      'DEFENDER: chỉ mở port thật sự cần; đặt dịch vụ nhạy sau VPN/firewall; ẩn/đổi banner version; IDS phát hiện SYN scan và scan toàn dải port; rate-limit kết nối để làm chậm trinh sát.',
    ],
    terms: [
      { term: 'SYN scan (-sS)', def: 'Quét nửa-mở: gửi SYN, nhận SYN/ACK là port mở, rồi RST — nhanh, ít để lại log hơn.' },
      { term: '-p-', def: 'Quét toàn bộ 65535 cổng thay vì chỉ top-1000 mặc định, tránh bỏ sót service ở port cao.' },
      { term: '-sV', def: 'Service/version detection: bắt tay với dịch vụ để đọc banner, xác định đúng phần mềm và phiên bản.' },
      { term: '-sC (NSE mặc định)', def: 'Chạy bộ script Nmap Scripting Engine "default" để enum thêm (title, share, cert...).' },
      { term: 'Host discovery', def: 'Bước tìm host nào đang sống trong dải mạng (-sn) trước khi quét port từng máy.' },
    ],
    initialFilesystem: fsC5M5,
  },
  {
    id: 6,
    chapterId: 5,
    title: 'Đào sâu dịch vụ',
    story:
      'Scan trước cho thấy 10.10.14.55 mở SMB (139/445) và HTTP. Port mở chỉ là khởi đầu — giá trị thật nằm ở chỗ enum sâu từng service: share SMB nào đọc được, web tiêu đề gì, banner để lộ version gì.',
    steps: [
      {
        id: 'smb_shares',
        description: 'Dùng NSE liệt kê SMB share (xem có null session / share đọc được)',
        match: /^nmap\b.*--script[ =]smb-enum-shares/i,
        output: [
          'Host script results:',
          '| smb-enum-shares:',
          '|   account_used: guest',
          '|   \\\\10.10.14.55\\IPC$:      READ          (null session allowed)',
          '|   \\\\10.10.14.55\\backups:   READ          Anonymous access!',
          '|_  \\\\10.10.14.55\\C$:        <access denied>',
        ].join('\n'),
      },
      {
        id: 'http_title',
        description: 'Dùng NSE lấy http-title của web service',
        match: /^nmap\b.*--script[ =]http-title/i,
        output: [
          'PORT   STATE SERVICE',
          '80/tcp open  http',
          '|_http-title: Acme Internal Portal - Login',
        ].join('\n'),
      },
      {
        id: 'banner_grab',
        description: 'Banner grab thủ công bằng netcat (vd cổng SSH)',
        match: /^nc\b.*10\.10\.14\.55\s+22|^nc\b.*-v.*22/i,
        output: [
          'Connection to 10.10.14.55 22 port [tcp/ssh] succeeded!',
          'SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5',
        ].join('\n'),
      },
    ],
    hints: [
      'Port mở mới là tiêu đề; enum sâu mới ra nội dung. SMB hay để hớ nhất.',
      'SMB: `nmap --script smb-enum-shares -p445 10.10.14.55` xem share nào cho guest/anonymous đọc.',
      'Web: `nmap --script http-title -p80 10.10.14.55`. Banner thủ công: `nc -v 10.10.14.55 22` để đọc dòng version SSH.',
    ],
    debrief: [
      'NSE (Nmap Scripting Engine) biến nmap từ máy quét port thành công cụ enum: smb-enum-shares, http-title, ssl-cert... mỗi script moi một lớp thông tin sâu hơn.',
      'Null session (đăng nhập SMB không cần creds) là cấu hình sai kinh điển: cho guest READ một share = lộ file nội bộ, đôi khi cả mật khẩu trong script/backup.',
      'Banner grabbing đọc dòng chào của dịch vụ (SSH/FTP/SMTP) để lấy đúng version — rẻ, nhanh, và thường đủ để map sang CVE.',
      'DEFENDER: tắt SMBv1 và cấm null/guest session; không để share chứa dữ liệu nhạy mở cho anonymous; che bớt banner version; chỉ expose service cần thiết, phần còn lại đặt sau firewall.',
    ],
    terms: [
      { term: 'NSE', def: 'Nmap Scripting Engine — kho script (--script) để enum sâu và dò lỗ hổng ngoài việc quét port.' },
      { term: 'Banner grabbing', def: 'Đọc dòng "chào" của dịch vụ (qua nc/nmap) để lấy tên + version phần mềm.' },
      { term: 'SMB enum', def: 'Liệt kê share, user, policy qua giao thức SMB/445 — hay lộ file nội bộ nếu cấu hình lỏng.' },
      { term: 'Null session', def: 'Kết nối SMB không cần username/password; nếu được phép sẽ lộ share và thông tin hệ thống.' },
    ],
    initialFilesystem: fsC5M6,
  },
  {
    id: 7,
    chapterId: 5,
    title: 'Liệt kê web ẩn',
    story:
      'http://10.10.14.55/ nhìn trống trơn, nhưng dev hay để quên /admin, /backup, file .php cũ. Mày phải brute-force directory và file ẩn bằng wordlist để vẽ ra cấu trúc thật của web.',
    steps: [
      {
        id: 'dir_brute',
        description: 'Brute-force directory bằng gobuster với wordlist',
        match: /^gobuster\s+dir\b.*-w\b/,
        output: [
          '===============================================================',
          'Gobuster v3.6',
          '[+] Url: http://10.10.14.55',
          '[+] Wordlist: /home/hacker/common.txt',
          '===============================================================',
          '/admin                (Status: 301) [--> /admin/]',
          '/login                (Status: 200)',
          '/backup               (Status: 200)',
          '/api                  (Status: 301) [--> /api/]',
          '/uploads              (Status: 403)',
          '===============================================================',
        ].join('\n'),
      },
      {
        id: 'ext_brute',
        description: 'Brute-force kèm phần mở rộng (-x php,txt) để bắt file ẩn',
        match: /^gobuster\s+dir\b.*-x\b/,
        output: [
          '/config.php           (Status: 200)',
          '/backup.txt           (Status: 200)',
          '/admin.php            (Status: 200)',
          '/robots.txt           (Status: 200)',
          '/db.php               (Status: 500)',
        ].join('\n'),
      },
      {
        id: 'ffuf_filter',
        description: 'Dùng ffuf lọc chỉ lấy status 200 (-mc 200) cho gọn',
        match: /^ffuf\b.*-mc\s*200/,
        output: [
          '________________________________________________',
          ' :: Method           : GET',
          ' :: Matcher          : Response status: 200',
          '________________________________________________',
          'login                   [Status: 200, Size: 1843, Words: 210]',
          'backup                  [Status: 200, Size: 944,  Words: 88]',
          'config.php              [Status: 200, Size: 0,    Words: 1]',
          ':: Progress: [9/9] :: Job [1/1] :: 412 req/sec :: Duration: [0:00:02]',
        ].join('\n'),
      },
    ],
    hints: [
      'Cần một wordlist và công cụ fuzz đường dẫn. File đã có: /home/hacker/common.txt.',
      'Directory: `gobuster dir -u http://10.10.14.55 -w /home/hacker/common.txt`.',
      'Bắt file ẩn: thêm đuôi `gobuster dir -u http://10.10.14.55 -w /home/hacker/common.txt -x php,txt`. Hoặc dùng `ffuf -u http://10.10.14.55/FUZZ -w /home/hacker/common.txt -mc 200` để chỉ thấy status 200.',
    ],
    debrief: [
      'Content discovery (dir busting) đoán đường dẫn không có link trỏ tới — admin panel, backup, file config — những thứ "ẩn" chỉ vì không ai link, chứ không hề được bảo vệ.',
      'Chất lượng wordlist quyết định kết quả: list nhỏ nhanh nhưng sót, list lớn (raft, SecLists) phủ rộng nhưng ồn và chậm; -x thêm đuôi để bắt file (.php/.bak/.txt) chứ không chỉ thư mục.',
      'Lọc theo status code là nghệ thuật: 200 = tồn tại, 301/302 = redirect (thường là thư mục), 403 = có nhưng cấm (vẫn đáng chú ý), 404 = bỏ. -mc/-fc giúp cắt nhiễu.',
      'DEFENDER: đừng để file backup/config trong webroot; tắt directory listing; trả 404 đồng nhất cho path không tồn tại để chống fuzz; theo dõi log thấy hàng trăm 404/giây là dấu hiệu bị bust; đặt WAF rate-limit.',
    ],
    terms: [
      { term: 'Dir busting', def: 'Brute-force đường dẫn/thư mục ẩn trên web bằng wordlist (gobuster/ffuf/dirb).' },
      { term: 'Wordlist', def: 'Danh sách tên đường dẫn/file thường gặp dùng để đoán; chất lượng list quyết định độ phủ.' },
      { term: 'Status filter', def: 'Lọc kết quả theo HTTP code (vd -mc 200 chỉ lấy tồn tại, -fc 404 bỏ không-tồn-tại) để giảm nhiễu.' },
      { term: '-x (extensions)', def: 'Thêm đuôi file vào mỗi từ để bắt file ẩn: -x php,txt,bak -> thử admin.php, admin.txt...' },
    ],
    initialFilesystem: fsC5M7,
  },
  {
    id: 8,
    chapterId: 5,
    title: 'Bản đồ subdomain',
    story:
      'Domain chính acme-corp.com đã vá kỹ, nhưng bề mặt thật nằm ở subdomain. Mày phải enumerate tất cả, rồi tìm cái nào trỏ về IP private — đó chính là cánh cửa vào mạng nội bộ.',
    steps: [
      {
        id: 'subfinder',
        description: 'Enumerate subdomain passive bằng subfinder',
        match: /^subfinder\b.*-d\s+acme-corp\.com/,
        output: [
          '[INF] Enumerating subdomains for acme-corp.com',
          'www.acme-corp.com',
          'mail.acme-corp.com',
          'vpn.acme-corp.com',
          'dev.acme-corp.com',
          'staging.acme-corp.com',
          'admin.acme-corp.com',
          'jira.acme-corp.com',
          'internal.acme-corp.com',
          '[INF] Found 8 subdomains for acme-corp.com',
        ].join('\n'),
      },
      {
        id: 'amass_file',
        description: 'Đối chiếu thêm với kết quả amass đã lưu',
        match: /^(cat|grep)\b.*amass\.txt/,
      },
      {
        id: 'resolve_internal',
        description: 'Resolve subdomain để phát hiện cái nào trỏ IP nội bộ',
        match: /^dig\s+(\+short\s+)?internal\.acme-corp\.com/i,
        output: '10.0.5.20      <- IP private! internal.acme-corp.com chỉ định route được khi đã ở trong mạng nội bộ',
      },
    ],
    hints: [
      'Subdomain mở rộng bề mặt tấn công gấp nhiều lần domain gốc. Bắt đầu bằng nguồn passive.',
      'Dùng `subfinder -d acme-corp.com`, rồi đối chiếu `cat /home/hacker/amass.txt` cho khỏi sót.',
      'Resolve từng cái: `dig +short internal.acme-corp.com`. Cái nào trả 10.x/192.168.x là dịch vụ nội bộ — vàng để pivot.',
    ],
    debrief: [
      'Mỗi subdomain là một host/ứng dụng riêng = thêm một bề mặt tấn công; dev/staging/admin/jira thường được vá lỏng hơn production vì "đâu ai biết tới".',
      'Subdomain trỏ IP private (10.x, 192.168.x, 172.16-31.x) tự tố cáo đó là dịch vụ nội bộ — vô dụng từ Internet nhưng là mục tiêu ngon ngay khi attacker có một chỗ đứng bên trong (pivot).',
      'Kết hợp nhiều nguồn (subfinder passive + amass + brute-force DNS) cho độ phủ cao nhất; mỗi công cụ thấy một phần khác nhau, gộp lại mới đủ.',
      'DEFENDER: kiểm kê toàn bộ DNS record định kỳ để diệt "dangling subdomain" (dễ bị subdomain takeover); tách hẳn DNS nội bộ khỏi public; đặt môi trường dev/staging sau VPN; coi mọi tên đã lên CT/passive DNS là đã công khai.',
    ],
    terms: [
      { term: 'Subdomain enum', def: 'Liệt kê toàn bộ subdomain của một domain để lập bản đồ bề mặt tấn công.' },
      { term: 'DNS bruteforce', def: 'Thử hàng loạt tên (dev, staging, vpn...) ghép vào domain rồi resolve để tìm host tồn tại.' },
      { term: 'Virtual host', def: 'Nhiều site cùng chia sẻ một IP, phân biệt qua header Host — fuzz vhost lộ site ẩn cùng IP.' },
      { term: 'Scope', def: 'Phạm vi được phép test trong hợp đồng; subdomain trỏ IP nội bộ có thể ngoài scope — phải xác nhận trước khi đụng.' },
    ],
    initialFilesystem: fsC5M8,
  },
  {
    id: 9,
    chapterId: 5,
    title: 'Soi lỗ hổng web',
    story:
      'Đã có web http://10.10.14.55/ vào được. Trước khi khai thác tay, mày chạy một vòng fingerprint tech stack và scan lỗ hổng tự động để khoanh vùng — và scanner để lộ một thư mục backup quên xoá, bên trong có cờ.',
    steps: [
      {
        id: 'whatweb',
        description: 'Fingerprint công nghệ web bằng whatweb',
        match: /^whatweb\b/,
        output: [
          'http://10.10.14.55 [200 OK]',
          'Apache[2.4.41], PHP[7.4.3], Country[RESERVED][ZZ],',
          'HTTPServer[Ubuntu Linux][Apache/2.4.41 (Ubuntu)],',
          'X-Powered-By[PHP/7.4.3], Title[Acme Corp Portal], jQuery[3.4.1]',
        ].join('\n'),
      },
      {
        id: 'nikto',
        description: 'Scan lỗ hổng web tự động bằng nikto',
        match: /^nikto\b.*(-h\b|-host\b)/,
        output: [
          '- Nikto v2.5.0',
          '+ Server: Apache/2.4.41 (Ubuntu)',
          '+ /: Server may leak inodes via ETags.',
          '+ Apache/2.4.41 appears outdated.',
          '+ OSVDB-3268: /backup/: Directory indexing found.',
          '+ /backup/: This might be interesting (possible backup files).',
          '+ /config.php.bak: Backup file found, may reveal credentials.',
          '+ 7 host(s) tested',
        ].join('\n'),
      },
      {
        id: 'read_flag',
        description: 'Vào thư mục backup nikto chỉ ra, đọc cờ recon',
        match: /^cat\s+\/var\/www\/html\/backup\/flag\.txt/,
      },
    ],
    hints: [
      'Trước khi khai thác tay, để scanner khoanh vùng: tech stack + lỗ hổng thường gặp.',
      'Fingerprint: `whatweb http://10.10.14.55`. Quét lỗ hổng: `nikto -h http://10.10.14.55`.',
      'Nikto báo /backup/ bật directory indexing — vào đó. Đọc cờ bằng `cat /var/www/html/backup/flag.txt`.',
    ],
    debrief: [
      'Vulnerability scanning tự động (nikto) phủ nhanh các lỗi cấu hình & file nhạy quen thuộc — nhưng ồn (đầy log) và nhiều false positive, nên dùng để khoanh vùng rồi xác minh tay, đừng tin mù.',
      'Tech fingerprint (whatweb) cho biết đang đánh nhau với gì (Apache 2.4.41, PHP 7.4.3, jQuery 3.4.1) — từ đó tra đúng CVE và chọn payload phù hợp framework.',
      'Directory indexing bật trên /backup/ là cấu hình sai cổ điển: server liệt kê thẳng mọi file trong thư mục, biến một path đoán-mò thành kho dữ liệu mở (config.php.bak chứa creds là chuyện thường).',
      'DEFENDER: tắt directory listing (Options -Indexes); không để file .bak/.old/.zip trong webroot; gỡ/đổi header lộ version (Server, X-Powered-By); cập nhật Apache/PHP; WAF + rate-limit để chặn và phát hiện scanner.',
    ],
    terms: [
      { term: 'Vuln scanning', def: 'Quét tự động (nikto/nuclei) tìm lỗ hổng & cấu hình sai phổ biến; nhanh nhưng ồn và dễ false positive.' },
      { term: 'Tech fingerprint', def: 'Xác định công nghệ web đang chạy (server, ngôn ngữ, framework, thư viện JS) để chọn hướng tấn công.' },
      { term: 'CVE', def: 'Mã định danh chuẩn cho một lỗ hổng đã biết công khai; đối chiếu version dịch vụ với CVE để tìm exploit.' },
      { term: 'Directory indexing', def: 'Server liệt kê toàn bộ file trong thư mục khi không có index — lộ file nhạy (backup, config).' },
    ],
    initialFilesystem: fsC5M9,
  },
  {
    id: 10,
    chapterId: 5,
    title: 'Đào sâu bản ghi DNS',
    story:
      'WHOIS đã chỉ ra name server, nhưng mày chưa khai thác hết DNS. Mày phải lấy MX để biết mail server, NS để xác nhận hạ tầng, và thử zone transfer (AXFR) — nếu admin cấu hình sai, cả vùng DNS sẽ phơi bày trong một lệnh.',
    steps: [
      {
        id: 'dig_ns',
        description: 'Liệt kê NS record để xác nhận name server đang phục vụ domain',
        match: /^dig\s+(\+short\s+)?(ns\s+acme-corp\.com|acme-corp\.com\s+ns)/i,
        output: ['ns1.digitalocean.com.', 'ns2.digitalocean.com.'].join('\n'),
      },
      {
        id: 'dig_mx',
        description: 'Liệt kê MX record để biết mail server xử lý thư của domain',
        match: /^dig\s+(\+short\s+)?(mx\s+acme-corp\.com|acme-corp\.com\s+mx)/i,
        output: ['10 mail.acme-corp.com.', '20 alt-mail.acme-corp.com.'].join('\n'),
      },
      {
        id: 'axfr',
        description: 'Thử zone transfer (AXFR) trực tiếp với name server — xem có bị cấu hình sai không',
        match: /^dig\s+.*axfr.*acme-corp\.com.*@ns1\.digitalocean\.com|^dig\s+axfr\s+@ns1\.digitalocean\.com\s+acme-corp\.com/i,
        output: [
          '; Transfer failed.',
          ';; communications error to ns1.digitalocean.com#53: end of file',
          '; Transfer failed.',
        ].join('\n'),
      },
      {
        id: 'read_note',
        description: 'Đọc lại ghi chú target ban đầu để đối chiếu với NS/MX vừa đào được',
        match: /^cat\s+.*target\.txt/,
      },
    ],
    hints: [
      'DNS không chỉ có A record — MX cho mail, NS cho name server, và một thử nghiệm "được ăn cả ngã về không": zone transfer.',
      'Dùng `dig ns acme-corp.com` và `dig mx acme-corp.com` để lấy 2 loại record này.',
      'Thử AXFR: `dig axfr acme-corp.com @ns1.digitalocean.com` — nếu bị từ chối (transfer failed) là server cấu hình ĐÚNG. Đối chiếu lại ghi chú ban đầu bằng `cat /home/hacker/target.txt`.',
    ],
    debrief: [
      'NS record xác nhận ai đang authoritative cho domain; MX record lộ luôn nhà cung cấp mail (tự host hay dùng Google/Microsoft) — cả hai giúp khoanh vùng hạ tầng mà không chạm host nào.',
      'Zone transfer (AXFR) ban đầu được thiết kế để đồng bộ giữa primary và secondary DNS — nhưng nếu name server không giới hạn ai được hỏi, BẤT KỲ AI gửi AXFR cũng nhận được TOÀN BỘ zone: mọi subdomain, mọi IP nội bộ, trong một lệnh.',
      'Một AXFR thành công là jackpot trinh sát — biến hàng giờ subdomain enum/brute-force thành một dòng lệnh; đây là lý do nó luôn nằm trong checklist đầu tiên của mọi pentest DNS.',
      'DEFENDER: chỉ cho phép AXFR tới IP của secondary DNS server đã khai báo (allow-transfer trong BIND); với hầu hết domain hiện đại, AXFR công khai PHẢI bị từ chối — nếu thành công thì đó là một misconfiguration cần vá ngay.',
    ],
    terms: [
      { term: 'NS record', def: 'Bản ghi DNS chỉ định name server nào chịu trách nhiệm trả lời cho domain.' },
      { term: 'MX record', def: 'Bản ghi DNS chỉ định mail server nhận thư cho domain, có độ ưu tiên (priority).' },
      { term: 'Zone transfer (AXFR)', def: 'Cơ chế đồng bộ toàn bộ DNS zone giữa các name server; nếu mở công khai sẽ lộ hết subdomain/IP trong một lần hỏi.' },
      { term: 'Authoritative DNS', def: 'Name server giữ bản ghi gốc, chính thức của một zone — khác với resolver chỉ cache lại.' },
    ],
    initialFilesystem: fsC5M10,
  },
  {
    id: 11,
    chapterId: 5,
    title: 'Moi email và host công khai',
    story:
      'Trước khi đụng web bằng tay, mày muốn có thêm một góc nhìn về cấu trúc đường dẫn (dirb thay vì gobuster) và một danh sách email/host công khai để dựng kịch bản phishing/social engineering trong báo cáo cuối.',
    steps: [
      {
        id: 'dirb',
        description: 'Brute-force directory bằng dirb với wordlist mặc định',
        match: /^dirb\s+http:\/\/10\.10\.14\.55/i,
        output: [
          '-----------------',
          'DIRB v2.22',
          'URL_BASE: http://10.10.14.55/',
          'WORDLIST_FILES: /usr/share/dirb/wordlists/common.txt',
          '-----------------',
          '+ http://10.10.14.55/admin (CODE:301|SIZE:0)',
          '+ http://10.10.14.55/backup (CODE:200|SIZE:512)',
          '+ http://10.10.14.55/login (CODE:200|SIZE:1843)',
          '-----------------',
          'END_TIME: Wed Jun 25 10:02:11 2026',
          'DOWNLOADED: 4612 - FOUND: 3',
        ].join('\n'),
      },
      {
        id: 'theharvester',
        description: 'Thu thập email/host công khai bằng theHarvester',
        match: /^theharvester\s+.*-d\s+acme-corp\.com/i,
        output: [
          '*******************************************************************',
          '*  theHarvester 4.4.3                                              *',
          '*******************************************************************',
          '[*] Target: acme-corp.com',
          '[*] Searching Google.',
          '[+] Emails found: 3',
          '------------------------',
          'admin@acme-corp.com',
          'support@acme-corp.com',
          'j.tran@acme-corp.com',
          '[+] Hosts found: 2',
          '------------------------',
          'mail.acme-corp.com:203.0.113.50',
          'www.acme-corp.com:203.0.113.42',
        ].join('\n'),
      },
    ],
    hints: [
      'dirb làm việc giống gobuster nhưng cú pháp khác; theHarvester chuyên moi email/host từ search engine.',
      'Dùng `dirb http://10.10.14.55` (wordlist mặc định tự chọn).',
      'Gõ `theHarvester -d acme-corp.com -b google` để lấy email + host từ Google; chú ý email j.tran@... có thể là target cho phishing trong báo cáo.',
    ],
    debrief: [
      'dirb và gobuster cùng mục đích (content discovery) nhưng dirb cũ hơn, chậm hơn, tự mang theo wordlist mặc định — biết cả hai để dùng cái nào có sẵn trên máy đang ngồi.',
      'theHarvester quét search engine, PGP key server, và các nguồn mở khác để moi email/subdomain — không gửi request nào tới target, vẫn là recon thụ động.',
      'Email thu thập được không chỉ để liệt kê — chúng là input cho tấn công social engineering (phishing) và đoán username pattern (firstname.lastname, j.lastname...) khi tấn công brute-force login sau này.',
      'DEFENDER: hạn chế công khai email cá nhân của nhân viên trên web; cảnh báo nhân viên về pattern username dễ đoán; theo dõi domain mình bị "harvest" qua các cảnh báo Have I Been Pwned hoặc dịch vụ giám sát brand.',
    ],
    terms: [
      { term: 'dirb', def: 'Công cụ brute-force directory/file trên web bằng wordlist, tương tự gobuster nhưng cú pháp riêng.' },
      { term: 'theHarvester', def: 'Công cụ OSINT moi email, subdomain, host từ search engine và nguồn mở.' },
      { term: 'Username pattern', def: 'Quy luật đặt tên đăng nhập (firstname.lastname, initial+lastname) suy ra được từ email công khai.' },
      { term: 'Social engineering', def: 'Tấn công nhằm vào con người (phishing, giả danh) thay vì lỗ hổng kỹ thuật thuần.' },
    ],
    initialFilesystem: fsC5M11,
  },
  {
    id: 12,
    chapterId: 5,
    title: 'Brute-force DNS chủ động',
    story:
      'Passive recon (subfinder/amass) đã cho một danh sách subdomain, nhưng passive chỉ thấy cái đã từng public. Mày phải brute-force chủ động qua DNS với wordlist để bắt subdomain mà không nguồn passive nào biết tới.',
    steps: [
      {
        id: 'dnsrecon_std',
        description: 'Chạy dnsrecon kiểu standard (lấy SOA, NS, MX, A trong một lệnh)',
        match: /^dnsrecon\s+.*-d\s+acme-corp\.com(?!.*-D)/i,
        output: [
          '[*] Std Record Enumeration',
          '[*]      SOA ns1.digitalocean.com 173.245.58.51',
          '[*]      NS ns1.digitalocean.com 173.245.58.51',
          '[*]      NS ns2.digitalocean.com 173.245.59.10',
          '[*]      MX mail.acme-corp.com 203.0.113.50',
          '[*]      A acme-corp.com 203.0.113.42',
        ].join('\n'),
      },
      {
        id: 'dnsrecon_brute',
        description: 'Brute-force subdomain qua DNS với wordlist (-D)',
        match: /^dnsrecon\s+.*-D\s+\S+.*-d\s+acme-corp\.com|^dnsrecon\s+.*-d\s+acme-corp\.com.*-D\s+\S+/i,
        output: [
          '[*] Performing Brute Force Enumeration:',
          '[+] api.acme-corp.com 10.0.5.30',
          '[+] vpn.acme-corp.com 203.0.113.60',
          '[+] test.acme-corp.com 10.0.5.31',
          '[+] 3 Records Found',
        ].join('\n'),
      },
    ],
    hints: [
      'dnsrecon vừa enum record chuẩn vừa brute-force subdomain bằng wordlist riêng (-D).',
      'Dùng `dnsrecon -d acme-corp.com` để lấy SOA/NS/MX/A trước.',
      'Brute-force thật: `dnsrecon -d acme-corp.com -D /usr/share/wordlists/subdomains.txt -t brt` — chú ý api/test trỏ IP 10.x, lại là cửa nội bộ.',
    ],
    debrief: [
      'dnsrecon khác subfinder/amass ở cách tiếp cận: nó không chỉ hỏi nguồn passive mà còn TỰ resolve hàng loạt tên (api, vpn, test, dev2...) ghép với domain — gọi là DNS brute-force chủ động.',
      'Subdomain bắt được qua brute-force chủ động thường KHÔNG nằm trong bất kỳ nguồn passive nào — vì chúng chưa từng lên CT log hay bị crawl — nên đây là lớp phủ bổ sung bắt buộc, không thể chỉ dừng ở passive.',
      'Kết quả lần này (api, test trỏ 10.0.5.x) tiếp tục xác nhận mẫu hình đã thấy ở bài subfinder/amass: dải dev/test/internal luôn là nơi cấu hình lỏng nhất vì "không ai ngó tới".',
      'DEFENDER: brute-force DNS sinh ra lượng query lớn dễ bị phát hiện qua giám sát DNS traffic bất thường (nhiều NXDOMAIN liên tiếp từ một IP); rate-limit DNS resolver công khai, và đừng đặt tên subdomain dễ đoán cho dịch vụ nội bộ nhạy cảm.',
    ],
    terms: [
      { term: 'dnsrecon', def: 'Công cụ enum DNS toàn diện: lấy record chuẩn (SOA/NS/MX) và brute-force subdomain bằng wordlist.' },
      { term: 'DNS brute-force chủ động', def: 'Thử resolve hàng loạt tên ghép với domain, khác passive vì có gửi query thật tới DNS.' },
      { term: 'NXDOMAIN', def: 'Phản hồi DNS báo tên không tồn tại — brute-force tạo ra rất nhiều NXDOMAIN liên tiếp, dễ bị giám sát phát hiện.' },
      { term: 'SOA record', def: 'Start of Authority — bản ghi chứa thông tin quản trị zone (primary NS, serial, refresh).' },
    ],
    initialFilesystem: fsC5M12,
  },
  {
    id: 13,
    chapterId: 5,
    title: 'Quét CVE tự động qua NSE',
    story:
      'Version dịch vụ đã có trong tay từ scan trước (OpenSSH 8.2p1, Samba 4.11.6...). Trước khi tra CVE bằng tay từng cái, mày để bộ script vuln của nmap tự đối chiếu và báo ngay cái nào đã có lỗ hổng công khai.',
    steps: [
      {
        id: 'vuln_script',
        description: 'Chạy nmap với bộ script vuln để tự dò CVE trên các port đã biết',
        match: /^nmap\b.*--script[ =]vuln/i,
        output: [
          'PORT     STATE SERVICE',
          '139/tcp  open  netbios-ssn',
          '445/tcp  open  microsoft-ds',
          '| smb-vuln-cve-2017-7494:',
          '|   VULNERABLE: SAMBA Remote Code Execution from Writable Share',
          '|     State: VULNERABLE',
          '|     IDs: CVE:CVE-2017-7494',
          '|_    Disclosure date: 2017-05-24',
          '3306/tcp open  mysql',
          '|_mysql-empty-password: NOT VULNERABLE: \'root\' account has password',
        ].join('\n'),
      },
      {
        id: 'read_note',
        description: 'Đọc lại ghi chú services đã lưu để đối chiếu version với CVE vừa lộ',
        match: /^cat\s+.*services\.txt/,
      },
    ],
    hints: [
      'nmap có một bộ script chuyên đi dò lỗ hổng đã biết, không chỉ liệt kê thông tin chung.',
      'Dùng `nmap --script vuln -p139,445,3306 10.10.14.55` để chạy hết script nhóm "vuln".',
      'Kết quả báo VULNERABLE trên Samba với mã CVE-2017-7494 — đối chiếu lại version đã ghi bằng `cat /home/hacker/services.txt`.',
    ],
    debrief: [
      'NSE chia script theo category (default, vuln, exploit, safe, intrusive...); category "vuln" gom các script chuyên kiểm tra một CVE cụ thể đã biết — nhanh hơn tra CVE tay từng version.',
      'Một kết quả VULNERABLE từ script tự động vẫn cần xác minh thủ công (false positive tồn tại) — nhưng nó thu hẹp hàng chục version xuống một danh sách CVE cụ thể để tập trung khai thác.',
      'Script vuln thuộc nhóm "intrusive" có thể gửi payload thử nghiệm thật tới service — khác hẳn category "safe" chỉ đọc thông tin; cần cân nhắc trong scope test (có được phép intrusive hay không).',
      'DEFENDER: vá ngay các CVE có sẵn exploit công khai (như CVE-2017-7494 SambaCry); patch management dựa trên banner/version chính là phòng tuyến đầu tiên trước khi script vuln scan của attacker tìm ra.',
    ],
    terms: [
      { term: 'NSE category "vuln"', def: 'Nhóm script Nmap Scripting Engine chuyên kiểm tra các CVE/lỗ hổng đã biết cụ thể.' },
      { term: 'Intrusive vs safe script', def: 'Script "safe" chỉ đọc thông tin; "intrusive" có thể gửi payload thử nghiệm, có rủi ro ảnh hưởng dịch vụ.' },
      { term: 'False positive', def: 'Kết quả báo lỗ hổng nhưng thực tế không khai thác được — cần xác minh tay trước khi báo cáo.' },
      { term: 'Patch management', def: 'Quy trình cập nhật phần mềm định kỳ để vá các CVE đã công khai trước khi bị khai thác.' },
    ],
    initialFilesystem: fsC5M13,
  },
  {
    id: 14,
    chapterId: 5,
    title: 'Soi qua mắt người khác',
    story:
      'Có những công cụ liên tục quét cả Internet và lưu lại kết quả công khai — Shodan, Censys. Mày không cần tự quét gì cả, chỉ cần hỏi đúng API là biết người khác đã thấy gì ở host target, hoàn toàn không chạm vào nó.',
    steps: [
      {
        id: 'shodan_cli',
        description: 'Tra host trên Shodan để xem port/service/CVE đã được index sẵn',
        match: /^shodan\s+host\s+203\.0\.113\.42/i,
        output: [
          '203.0.113.42',
          'Organization: DigitalOcean LLC',
          'Operating System: Ubuntu',
          '',
          'Ports:',
          '22/tcp   OpenSSH 8.2p1',
          '80/tcp   Apache httpd 2.4.41',
          '443/tcp  Apache httpd 2.4.41',
          '3306/tcp MySQL 5.7.33',
          '',
          'Vulnerabilities:',
          'CVE-2021-3449   OpenSSL denial of service',
        ].join('\n'),
      },
      {
        id: 'read_json',
        description: 'Đọc bản dump JSON Shodan đã lưu để đối chiếu chi tiết',
        match: /^cat\s+.*shodan\.json/,
      },
      {
        id: 'grep_vuln',
        description: 'Lọc riêng dòng "vulns" trong file JSON đã lưu',
        match: /^grep\s+.*vulns.*shodan\.json/,
      },
    ],
    hints: [
      'Có những "kính viễn vọng" quét cả Internet 24/7 và lưu sẵn kết quả — mày chỉ cần hỏi, không cần tự bắn gói.',
      'Dùng `shodan host 203.0.113.42` để xem snapshot port/CVE đã được Shodan index từ trước.',
      'Đối chiếu file đã lưu: `cat /home/hacker/shodan.json`, rồi `grep vulns /home/hacker/shodan.json` để chỉ lấy đúng dòng CVE.',
    ],
    debrief: [
      'Shodan/Censys là search engine cho thiết bị kết nối Internet: chúng quét liên tục toàn bộ IPv4 và lưu banner, port, cert, CVE khớp — tra cứu một host có sẵn không sinh ra traffic mới tới target.',
      'Vì index có thể cũ (vài ngày tới vài tuần), dữ liệu Shodan là điểm khởi đầu tốt để khoanh vùng nhưng không thay được active scan để xác nhận trạng thái HIỆN TẠI.',
      'CVE-2021-3449 xuất hiện sẵn trong index nghĩa là ai đó (kể cả attacker khác) đã có thể thấy lỗ hổng này TRƯỚC khi mày bắt đầu — một lý do để vá nhanh, vì "security through obscurity" không tồn tại với host có IP public.',
      'DEFENDER: tự tra Shodan/Censys cho IP range của mình định kỳ — đây là cách rẻ nhất để biết "thế giới thấy gì ở mình" trước khi attacker dùng đúng nguồn đó; cân nhắc opt-out hoặc tối thiểu hoá banner lộ ra ngoài.',
    ],
    terms: [
      { term: 'Shodan', def: 'Search engine quét và index liên tục thiết bị/service công khai trên Internet (port, banner, CVE).' },
      { term: 'Censys', def: 'Dịch vụ tương tự Shodan, mạnh về index certificate TLS và metadata hạ tầng.' },
      { term: 'Internet-wide scanning', def: 'Quét toàn bộ không gian địa chỉ IPv4 định kỳ — nền tảng dữ liệu của Shodan/Censys.' },
      { term: 'Security through obscurity', def: 'Ảo tưởng "giấu thì an toàn" — sai với host có IP public vì luôn có ai đó đã quét và lưu lại.' },
    ],
    initialFilesystem: fsC5M14,
  },
  {
    id: 15,
    chapterId: 5,
    title: 'Quét né tránh ánh mắt SOC',
    story:
      'Lần scan -p- tốc độ cao trước đã bị SOC ghi log nghi ngờ. Lần này khách hàng vẫn muốn full port nhưng phải kín đáo — quét chậm lại, phân mảnh gói tin, và trộn lẫn vào nhiễu bằng decoy IP.',
    steps: [
      {
        id: 'timing',
        description: 'Quét với timing template chậm nhất để giảm khả năng bị IDS phát hiện (-T0 hoặc -T1)',
        match: /^nmap\b.*-t0\b|^nmap\b.*-t1\b/i,
        output: [
          'Starting Nmap 7.94 ( https://nmap.org )',
          '[Scanning at reduced rate — -T1 spreads probes over a much longer window]',
          'PORT    STATE SERVICE',
          '22/tcp  open  ssh',
          '80/tcp  open  http',
          'Nmap done: scan completed in 14m32s (paranoid timing applied)',
        ].join('\n'),
      },
      {
        id: 'fragment',
        description: 'Phân mảnh gói tin (-f) để qua mặt một số IDS/firewall đơn giản',
        match: /^nmap\b.*-f\b/i,
        output: [
          'PORT    STATE SERVICE',
          '22/tcp  open  ssh',
          '80/tcp  open  http',
          '[Packets fragmented into 8-byte chunks before sending]',
        ].join('\n'),
      },
      {
        id: 'decoy',
        description: 'Trộn IP nguồn với decoy giả (-D) để SOC khó xác định ai mới là kẻ scan thật',
        match: /^nmap\b.*-d\s+\S/i,
        output: [
          'PORT    STATE SERVICE',
          '22/tcp  open  ssh',
          '80/tcp  open  http',
          '[Spoofed source addresses mixed with real one — defenders see multiple "attackers"]',
        ].join('\n'),
      },
    ],
    hints: [
      'Nmap có cả một nhóm flag để "đi nhẹ nói khẽ": làm chậm tốc độ, vỡ gói tin, và giả nhiều IP nguồn.',
      'Chậm lại: `nmap -T1 10.10.14.55` (T0 paranoid còn chậm hơn). Vỡ gói: `nmap -f 10.10.14.55`.',
      'Trộn nguồn: `nmap -D RND:5 10.10.14.55` sinh 5 IP giả ngẫu nhiên trộn cùng IP thật, khiến log SOC khó biết ai là kẻ quét thật.',
    ],
    debrief: [
      'Timing template (-T0 đến -T5) điều chỉnh tốc độ gửi probe: chậm (paranoid/sneaky) giúp lọt qua threshold của IDS dựa trên số lượng kết nối/giây, nhưng đổi lại scan có thể mất hàng giờ.',
      '-f phân mảnh gói TCP thành nhiều phần nhỏ trước khi gửi — một số firewall/IDS cũ không ráp lại để inspect nên không phát hiện được pattern scan.',
      '-D (decoy) thêm IP giả vào danh sách "nguồn" của gói SYN, khiến log phía defender thấy nhiều địa chỉ cùng quét — gây nhiễu điều tra ai là kẻ tấn công thật (không ẩn hoàn toàn vì response vẫn cần về đúng IP thật).',
      'DEFENDER: IDS/IPS hiện đại (Suricata, Snort) đã có rule phát hiện timing bất thường và packet fragmentation; threat hunting nên nhìn vào pattern dài hạn (nhiều giờ) thay vì chỉ window ngắn, và không tin tưởng mù vào IP nguồn khi có dấu hiệu decoy.',
    ],
    terms: [
      { term: 'Timing template (-T0..T5)', def: 'Bộ tốc độ định trước của nmap, từ paranoid (cực chậm, né IDS) tới insane (cực nhanh, dễ bị phát hiện).' },
      { term: 'Packet fragmentation (-f)', def: 'Chia gói tin thành nhiều phần nhỏ để một số thiết bị inspect không ráp lại kiểm tra được.' },
      { term: 'Decoy scan (-D)', def: 'Trộn IP nguồn giả vào gói quét thật để gây nhiễu việc xác định ai là kẻ quét thật.' },
      { term: 'IDS/IPS', def: 'Hệ thống phát hiện/ngăn chặn xâm nhập, giám sát traffic để báo động hoặc chặn hành vi bất thường.' },
    ],
    initialFilesystem: fsC5M15,
  },
  {
    id: 16,
    chapterId: 5,
    title: 'Mặt tối bị bỏ quên: UDP',
    story:
      'Mọi scan trước chỉ soi TCP. Nhưng SNMP, DNS, DHCP chạy trên UDP — và admin thường quên đổi default community string "public" của SNMP. Mày phải quét UDP riêng và thử khai thác cấu hình mặc định đó.',
    steps: [
      {
        id: 'udp_scan',
        description: 'Quét UDP trên các port phổ biến (-sU) — chậm hơn TCP nhiều',
        match: /^nmap\b.*-su\b/i,
        output: [
          'Starting Nmap 7.94 ( https://nmap.org ) -- UDP scan',
          'PORT    STATE SERVICE',
          '53/udp  open  domain',
          '161/udp open  snmp',
          'Nmap done: UDP scan takes much longer than TCP (no handshake to confirm open fast)',
        ].join('\n'),
      },
      {
        id: 'snmp_walk',
        description: 'Thử SNMP với community string mặc định "public" (snmpwalk)',
        match: /^snmpwalk\b.*-c\s+public\b/i,
        output: [
          'SNMPv2-MIB::sysDescr.0 = STRING: Linux web01 5.4.0-150-generic',
          'SNMPv2-MIB::sysName.0 = STRING: web01.acme-corp.internal',
          'IF-MIB::ifDescr.1 = STRING: eth0',
          'HOST-RESOURCES-MIB::hrSWRunName.12 = STRING: "mysqld"',
        ].join('\n'),
      },
    ],
    hints: [
      'UDP không có handshake nên scan chậm và dễ bỏ sót nếu chỉ quen quét TCP.',
      'Dùng `nmap -sU --top-ports 20 10.10.14.55` để quét nhanh các port UDP phổ biến nhất, tránh chờ cả -sU -p- (cực chậm).',
      'SNMP mở thì thử default community: `snmpwalk -v2c -c public 10.10.14.55` — community "public"/"private" là mặc định kinh điển không ai đổi.',
    ],
    debrief: [
      'UDP scan (-sU) khó và chậm hơn TCP vì không có handshake xác nhận: nmap phải đợi timeout hoặc ICMP port-unreachable để suy luận port đóng — đây là lý do nhiều pentester bỏ qua UDP, và chính là lý do attacker giỏi luôn check nó.',
      'SNMP (port 161/udp) là giao thức quản lý mạng cổ; community string đóng vai trò như "mật khẩu" nhưng default "public" (read) và "private" (write) vẫn còn sống trên rất nhiều thiết bị legacy.',
      'snmpwalk với community đúng có thể đọc cả thông tin hệ thống (OS, process đang chạy, route mạng) — đôi khi đủ để vẽ lại toàn bộ topology nội bộ chỉ từ một port UDP bị quên.',
      'DEFENDER: đổi community string SNMP mặc định ngay khi deploy, giới hạn SNMP chỉ cho phép từ IP quản trị (ACL), ưu tiên SNMPv3 (có auth+encryption) thay vì v1/v2c gửi cleartext.',
    ],
    terms: [
      { term: 'UDP scan (-sU)', def: 'Quét cổng UDP, chậm hơn TCP vì không có handshake để xác nhận nhanh trạng thái port.' },
      { term: 'SNMP', def: 'Simple Network Management Protocol — giao thức giám sát/quản lý thiết bị mạng qua port 161/udp.' },
      { term: 'Community string', def: 'Chuỗi xác thực của SNMP v1/v2c, đóng vai trò như mật khẩu; "public"/"private" là default kinh điển.' },
      { term: 'snmpwalk', def: 'Công cụ truy vấn toàn bộ cây MIB của một thiết bị SNMP để đọc thông tin hệ thống.' },
    ],
    initialFilesystem: fsC5M16,
  },
  {
    id: 17,
    chapterId: 5,
    title: 'Site giấu sau header Host',
    story:
      'Gõ thẳng IP chỉ ra một site mặc định. Nhưng web server hiện đại lưu nhiều virtual host trên cùng một IP, phân biệt qua header Host. Mày phải fuzz đúng header đó để lộ ra site khác đang ẩn mình.',
    steps: [
      {
        id: 'curl_host',
        description: 'Gọi thẳng IP nhưng đổi header Host để thử gọi đúng vhost dev',
        match: /^curl\b.*-h\s*['"]?host:\s*dev\.acme-corp\.com['"]?.*10\.10\.14\.55/i,
        output: [
          'HTTP/1.1 200 OK',
          'Server: Apache/2.4.41 (Ubuntu)',
          '',
          '<h1>DEV environment — debug mode ON</h1>',
        ].join('\n'),
      },
      {
        id: 'gobuster_vhost',
        description: 'Fuzz hàng loạt vhost cùng lúc bằng gobuster vhost mode',
        match: /^gobuster\s+vhost\b.*-w\b/i,
        output: [
          '===============================================================',
          'Gobuster v3.6',
          '[+] Url: http://10.10.14.55',
          '[+] Method: vhost',
          '===============================================================',
          'Found: dev.acme-corp.com (Status: 200) [Size: 48]',
          'Found: internal.acme-corp.com (Status: 200) [Size: 312]',
          'Found: test.acme-corp.com (Status: 403) [Size: 0]',
          '===============================================================',
        ].join('\n'),
      },
    ],
    hints: [
      'Một IP có thể "trông" nhiều site khác nhau — chỉ khác nhau ở header Host trong request.',
      'Dùng `curl -H "Host: dev.acme-corp.com" http://10.10.14.55` để giả lập gọi đúng vhost dev mà không cần đổi DNS.',
      'Fuzz hàng loạt: `gobuster vhost -u http://10.10.14.55 -w /home/hacker/vhosts.txt --append-domain` — chú ý "internal" trả 200, "DEV debug mode ON" có thể lộ stack trace.',
    ],
    debrief: [
      'HTTP/1.1 dùng header Host để web server biết client đang muốn site nào trên cùng một IP — đây là cơ chế cho phép hàng trăm domain chia sẻ một địa chỉ (shared hosting, load balancer, CDN).',
      'Khi gõ thẳng IP, server thường trả về site "default" (catch-all); muốn thấy site thật phía sau phải set đúng Host header — bằng tay (curl -H) để xác minh, hoặc fuzz hàng loạt (gobuster vhost) để tìm hết.',
      'Site "DEV — debug mode ON" là phát hiện giá trị cao: môi trường dev/test thường tắt bớt bảo vệ (stack trace đầy đủ, không rate-limit, debug endpoint) để dễ làm việc — và đó chính là khe hở attacker nhắm tới.',
      'DEFENDER: đừng để site nội bộ/dev cùng IP public với production; nếu buộc phải chung, chặn truy cập theo Host header lạ ở tầng reverse proxy; luôn tắt debug mode trước khi expose ra ngoài, dù chỉ tạm thời.',
    ],
    terms: [
      { term: 'Virtual host (vhost)', def: 'Nhiều site/domain cùng chia sẻ một IP, phân biệt nhau qua header Host trong HTTP request.' },
      { term: 'Host header', def: 'Header HTTP cho server biết client muốn truy cập domain nào — bắt buộc từ HTTP/1.1.' },
      { term: 'Vhost fuzzing', def: 'Kỹ thuật dò tìm virtual host ẩn bằng cách thử nhiều giá trị Host header khác nhau.' },
      { term: 'Debug mode lộ thông tin', def: 'Môi trường dev/test bật debug thường in stack trace, đường dẫn nội bộ — nguồn rò thông tin quý cho attacker.' },
    ],
    initialFilesystem: fsC5M17,
  },
  {
    id: 18,
    chapterId: 5,
    title: 'Bài tốt nghiệp: chuỗi recon hoàn chỉnh',
    story:
      'Khách yêu cầu một báo cáo recon đầy đủ trước buổi họp ngày mai. Mày phải tự chạy lại toàn chuỗi đã học — DNS, port, service, web — và gói ghém thành report.txt để nộp, không bỏ bước nào.',
    steps: [
      {
        id: 'dns_chain',
        description: 'Lấy A record domain bằng dig +short để mở đầu báo cáo',
        match: /^dig\s+\+short\s+acme-corp\.com\s*$/i,
        output: '203.0.113.42',
      },
      {
        id: 'port_chain',
        description: 'Quét version dịch vụ trên host chính bằng nmap -sV',
        match: /^nmap\b.*-sv\b.*10\.10\.14\.55/i,
        output: [
          'PORT     STATE SERVICE VERSION',
          '22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu',
          '80/tcp   open  http    Apache httpd 2.4.41',
          '445/tcp  open  netbios-ssn Samba smbd 4.11.6',
          '3306/tcp open  mysql   MySQL 5.7.33',
        ].join('\n'),
      },
      {
        id: 'web_chain',
        description: 'Fingerprint tech stack web bằng whatweb để chốt phần ứng dụng',
        match: /^whatweb\b.*10\.10\.14\.55/i,
        output: 'http://10.10.14.55 [200 OK] Apache[2.4.41], PHP[7.4.3], Title[Acme Corp Portal]',
      },
      {
        id: 'save_report',
        description: 'Ghi tóm tắt 3 dòng trên vào report.txt bằng echo nối redirect (>> nhiều lần hoặc echo nhiều dòng)',
        match: /(>>|>)\s*\S*report\.txt/,
        output: '(đã ghi dòng tóm tắt vào report.txt)',
      },
      {
        id: 'verify',
        description: 'Xác nhận report.txt đã có đủ nội dung trước khi nộp (cat hoặc wc -l)',
        match: /^(cat|wc\s+-l)\s+\S*report\.txt/,
      },
    ],
    hints: [
      'Đây là bài tổng hợp: ghép DNS -> port -> service/web -> lưu báo cáo -> verify, đúng thứ tự một engagement thật.',
      'Chạy lần lượt: `dig +short acme-corp.com`, `nmap -sV 10.10.14.55`, `whatweb http://10.10.14.55`.',
      'Lưu từng dòng bằng `echo "203.0.113.42 - acme-corp.com" >> ~/report.txt` (lặp lại cho port/web), rồi `cat ~/report.txt` để kiểm tra đủ dòng trước khi nộp khách.',
    ],
    debrief: [
      'Một engagement recon thật không phải các lệnh rời rạc — nó là một CHUỖI có thứ tự: phạm vi domain (DNS) -> phạm vi host (port/service) -> phạm vi ứng dụng (web) -> tổng hợp thành tài liệu cho khách đọc được.',
      'Report không phải là “copy paste terminal” — nó là bản dịch từ output kỹ thuật (PORT/STATE/SERVICE) sang câu chuyện mà người không rành terminal (CISO, dev lead) cũng hiểu được rủi ro.',
      'Toàn bộ kỹ năng Chương 5 — whois/dig, nmap đủ kiểu, NSE, gobuster/ffuf/dirb, subfinder/amass/dnsrecon, whatweb/nikto, Shodan, vhost fuzzing — đều phục vụ MỘT mục tiêu: vẽ bản đồ bề mặt tấn công đầy đủ nhất có thể trước khi chuyển sang khai thác (Chương 6-7).',
      'Thực chiến: pentester chuyên nghiệp luôn lưu lại TỪNG bước (lệnh, output, timestamp) — không chỉ để báo cáo, mà để tái tạo lại đường đi khi viết proof-of-concept hoặc khi khách hỏi "mày làm thế nào ra được thông tin này?".',
    ],
    terms: [
      { term: 'Attack surface', def: 'Toàn bộ điểm có thể bị tấn công của một hệ thống — DNS, port, service, web, con người — recon là bước vẽ bản đồ nó.' },
      { term: 'Engagement', def: 'Một dự án pentest có hợp đồng, phạm vi (scope), và thời hạn cụ thể với khách hàng.' },
      { term: 'Report tổng hợp', def: 'Tài liệu dịch kết quả kỹ thuật thành thông tin hành động được cho khách hàng không chuyên kỹ thuật.' },
      { term: 'Proof-of-concept (PoC)', def: 'Minh chứng từng bước cho thấy lỗ hổng khai thác được thật, không chỉ là lý thuyết.' },
    ],
    initialFilesystem: fsC5M18,
  },
];
