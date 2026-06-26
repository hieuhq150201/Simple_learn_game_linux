// Mission MỚI (bổ sung) cho Chương 3 — Networking Từ Gốc. Engine offline.
import fsC3M4 from '../filesystems/chapter3-mission4.js';
import fsC3M5 from '../filesystems/chapter3-mission5.js';
import fsC3M6 from '../filesystems/chapter3-mission6.js';
import fsC3M7 from '../filesystems/chapter3-mission7.js';
import fsC3M8 from '../filesystems/chapter3-mission8.js';
import fsC3M9 from '../filesystems/chapter3-mission9.js';
import fsC3M10 from '../filesystems/chapter3-mission10.js';
import fsC3M11 from '../filesystems/chapter3-mission11.js';
import fsC3M12 from '../filesystems/chapter3-mission12.js';
import fsC3M13 from '../filesystems/chapter3-mission13.js';
import fsC3M14 from '../filesystems/chapter3-mission14.js';
import fsC3M15 from '../filesystems/chapter3-mission15.js';
import fsC3M16 from '../filesystems/chapter3-mission16.js';
import fsC3M17 from '../filesystems/chapter3-mission17.js';
import fsC3M18 from '../filesystems/chapter3-mission18.js';

export default [
  {
    id: 4,
    chapterId: 3,
    title: 'Ping kiểm tra sự sống',
    story:
      'Server mail.acme-corp.com đột nhiên không nhận email. Trước khi tiếp cận chi tiết, mày phải xác minh nó còn online hay đã crash. Ping là bước đầu tiên — và từ kết quả sẽ biết thêm gì.',
    steps: [
      {
        id: 'ping_host',
        description: 'Ping mail.acme-corp.com để xác minh host còn sống',
        match: /^ping\b.*mail\.acme-corp\.com/i,
        output: [
          'PING mail.acme-corp.com (203.0.113.50) 56(84) bytes of data.',
          '64 bytes from mail.acme-corp.com (203.0.113.50): icmp_seq=1 ttl=63 time=2.11 ms',
          '64 bytes from mail.acme-corp.com (203.0.113.50): icmp_seq=2 ttl=63 time=2.08 ms',
          '64 bytes from mail.acme-corp.com (203.0.113.50): icmp_seq=3 ttl=63 time=2.13 ms',
          '^C',
          '--- mail.acme-corp.com statistics ---',
          '3 packets transmitted, 3 received, 0% packet loss, time 2003ms',
          'rtt min/avg/max/stddev = 2.08/2.10/2.13/0.02 ms',
        ].join('\n'),
      },
      {
        id: 'analyze',
        description: 'Đọc ghi chú để hiểu ý nghĩa của ping kết quả',
        match: /^cat\s+.*ping-note\.txt/,
      },
    ],
    hints: [
      'Ping gửi ICMP echo request đến host; nếu nhận reply là host còn sống, không reply là offline hoặc firewall chặn.',
      'Dùng `ping mail.acme-corp.com` và chờ 3-4 reply, rồi Ctrl+C để dừng.',
      'Để ý TTL (time to live) quảng đường mà packet phải đi; thời gian (ms) báo độ trễ mạng.',
    ],
    debrief: [
      'Ping là công cụ recon đầu tiên: trả lời ba câu hỏi: (1) host còn sống? (2) tất cả gói đều đến được (0% loss) hay mất một số? (3) độ trễ bao lâu? — từ đó sơ bộ đánh giá tình trạng.',
      'TTL giảm sau mỗi hop qua router; TTL=63 về sau còn lại chứng tỏ gói đã qua vài router. Nếu TTL là 64 hoặc nhỏ lạ (ví dụ 32) có thể là OS khác hoặc cấu hình đặc biệt.',
      'Packet loss cao (>10%) chỉ ra vấn đề mạng: congestion, line trục trặc, hay firewall rate-limit ICMP; mất toàn bộ gói báo host offline hoặc ICMP bị block (VPN/firewall).',
      'DEFENDER: tắt ICMP reply (ping) để làm khó recon thụ động, nhưng cảnh báo: tắt ICMP làm khó debug mạng nội bộ; cân bằng giữa security vs. khả năng troubleshoot.',
    ],
    terms: [
      { term: 'ping', def: 'Gửi ICMP echo request để kiểm tra host có online hay không.' },
      { term: 'TTL (time to live)', def: 'Số lần package có thể qua router trước khi bị loại bỏ.' },
      { term: 'Packet loss', def: 'Tỷ lệ gói tin bị mất trên đường đi, báo tình trạng mạng.' },
      { term: 'ICMP', def: 'Giao thức báo cáo lỗi và điều khiển Internet, nền tảng của ping/traceroute.' },
    ],
    initialFilesystem: fsC3M4,
  },
  {
    id: 5,
    chapterId: 3,
    title: 'Theo dõi đường đi gói tin',
    story:
      'Ping tới www.example-far.com thành công nhưng chậm, thỉnh thoảng timeout. Trước khi kết luận mạng bị vấn đề, mày phải vẽ đường đi từng hop để xác định router nào gây chậm hay chặn.',
    steps: [
      {
        id: 'traceroute',
        description: 'Trace đường đi từ mình tới www.example-far.com (traceroute)',
        match: /^traceroute\b.*www\.example-far\.com/i,
        output: [
          'traceroute to www.example-far.com (198.51.100.200), 30 hops max, 60 byte packets',
          ' 1  gateway.local (10.0.0.1)  1.234 ms  1.256 ms  1.245 ms',
          ' 2  isp-core.net (203.0.113.1)  5.123 ms  5.145 ms  5.167 ms',
          ' 3  * * *      (timeout — maybe rate-limit hoặc ko reply ICMP)',
          ' 4  transit.backbone (198.51.99.50)  24.123 ms  24.156 ms  24.178 ms',
          ' 5  final-router.isp (198.51.99.1)  28.456 ms  28.478 ms  28.501 ms',
          ' 6  www.example-far.com (198.51.100.200)  29.876 ms  29.898 ms  29.920 ms',
        ].join('\n'),
      },
      {
        id: 'mtr_follow',
        description: 'Dùng mtr theo dõi realtime để xác định hop nào lag (Ctrl+C sau 10 dòng)',
        match: /^mtr\b.*www\.example-far\.com|^mtr\s+-c\s+\d+.*www\.example-far\.com/i,
        output: [
          '                                     My traceroute  [v0.95]',
          'gateway.local (10.0.0.1)                                 0.0%     4    1.2    1.2    1.2    1.2',
          'isp-core.net (203.0.113.1)                               0.0%     4    5.1    5.1    5.1    5.1',
          'router-3 (198.51.99.99)                               20.0%     4   50.1   50.2   50.1   50.3   <- SLOW HERE',
          'transit.backbone (198.51.99.50)                         0.0%     4   24.2   24.1   24.1   24.2',
          'final-router.isp (198.51.99.1)                          0.0%     4   28.5   28.4   28.5   28.5',
          'www.example-far.com (198.51.100.200)                    0.0%     4   29.8   29.8   29.8   29.9',
        ].join('\n'),
      },
    ],
    hints: [
      'Traceroute vẽ bản đồ từng hop router từ mình tới đích; mtr (My Traceroute) cập nhật realtime và tính % packet loss mỗi hop.',
      'Dùng `traceroute www.example-far.com` để xem 30 hop. Nếu có dòng `* * *` là router không reply ICMP (bình thường).',
      'Chạy `mtr www.example-far.com` để thấy hop nào bị lag (thời gian cao) hoặc packet loss cao (% cao) — đó là nguyên nhân chậm.',
    ],
    debrief: [
      'Traceroute gửi gói ICMP/UDP tăng dần TTL để router giảm TTL xuống 0 và reply ICMP "time exceeded" — từ đó vẽ nên bản đồ hop. Mtr làm lặp lại việc này liên tục để thống kê.',
      'Hop lag (time cao) hoặc packet loss cao chỉ ra vị trí vấn đề: nếu mọi hop tốt nhưng bước 3 timeout → router đó không reply ICMP (cài policy từ chối) nhưng traffic vẫn qua. Nếu bước 4-5 lag → ISP/backbone tắc hay router overload.',
      'Dòng "* * *" không phải lỗi — chỉ là router đó không gửi ICMP reply (cái này config tuỳ). Quan trọng là khi kết nối lẫn lộn thì lag tăng lên hoặc % loss cao.',
      'DEFENDER: rate-limit hay vô hiệu ICMP traceroute gây khó khăn debug nội bộ; thay vào đó dùng TCP traceroute hoặc monitoring riêng; attacker dùng mtr để dò điểm yếu mạng.',
    ],
    terms: [
      { term: 'traceroute', def: 'Vẽ bản đồ đường đi từng hop router từ mình tới đích, dùng TTL tăng dần.' },
      { term: 'mtr', def: 'My Traceroute — kết hợp ping + traceroute với thống kê realtime (% loss, avg delay).' },
      { term: 'Hop', def: 'Một nút (router/host) trên đường đi từ nguồn tới đích.' },
      { term: 'TTL exceeded', def: 'Phản hồi ICMP khi gói tin hết TTL, dùng bởi traceroute để phát hiện hop.' },
    ],
    initialFilesystem: fsC3M5,
  },
  {
    id: 6,
    chapterId: 3,
    title: 'Khai thác DNS A record',
    story:
      'Đã biết domain shop.acme-corp.com trỏ sai (mission trước). Bây giờ mày phải lấy đầy đủ thông tin DNS: A record, AAAA (IPv6), MX, NS, TXT — mỗi loại kỳ lạ cho biết thêm cái gì về hạ tầng.',
    steps: [
      {
        id: 'dig_a',
        description: 'Lấy A record của domain (IPv4)',
        match: /^dig\b.*shop\.acme-corp\.com(\s+a)?(\s+\+short)?\s*$/i,
        output: [
          '; <<>> DiG 9.18 <<>> shop.acme-corp.com A',
          ';; ANSWER SECTION:',
          'shop.acme-corp.com.  300  IN  A  203.0.113.42',
        ].join('\n'),
      },
      {
        id: 'dig_aaaa',
        description: 'Lấy AAAA record của domain (IPv6)',
        match: /^dig\b.*shop\.acme-corp\.com\s+aaaa/i,
        output: [
          '; <<>> DiG 9.18 <<>> shop.acme-corp.com AAAA',
          '; status: NODATA, NOERROR',
          '; (no IPv6 record for this domain — IPv6 chưa được cấu hình)',
        ].join('\n'),
      },
      {
        id: 'dig_mx',
        description: 'Lấy MX record để biết mail server xử lý email của domain',
        match: /^dig\b.*shop\.acme-corp\.com\s+mx/i,
        output: [
          '; <<>> DiG 9.18 <<>> shop.acme-corp.com MX',
          ';; ANSWER SECTION:',
          'shop.acme-corp.com.  300  IN  MX   10 mail.acme-corp.com.',
          'shop.acme-corp.com.  300  IN  MX   20 mail-backup.acme-corp.com.',
        ].join('\n'),
      },
      {
        id: 'dig_txt',
        description: 'Lấy TXT record (SPF, DKIM, DMARC lên đó)',
        match: /^dig\b.*shop\.acme-corp\.com\s+txt/i,
        output: [
          '; <<>> DiG 9.18 <<>> shop.acme-corp.com TXT',
          ';; ANSWER SECTION:',
          'shop.acme-corp.com.  300  IN  TXT  "v=spf1 include:_spf.google.com ~all"',
          'shop.acme-corp.com.  300  IN  TXT  "google-site-verification=Hh3kL9pQ2rT..."',
        ].join('\n'),
      },
    ],
    hints: [
      'Mỗi kiểu record DNS chứa thông tin khác: A là IPv4, AAAA là IPv6, MX là mail, TXT là thỏa thuận tiêu chuẩn (SPF/DKIM).',
      'Dùng `dig domain A`, `dig domain AAAA`, `dig domain MX`, `dig domain TXT` để lấy từng loại.',
      'Nếu record không tồn tại, dig sẽ báo "NODATA" hoặc "NXDOMAIN"; nếu NODATA có nghĩa domain tồn tại nhưng loại record đó chưa có.',
    ],
    debrief: [
      'A record là tâm DNS: ánh xạ tên thành IPv4. AAAA là tương lai (IPv6) — thiếu nó không phải lỗi, chỉ là chưa setup IPv6.',
      'MX record thứ tự ưu tiên qua giá trị (10, 20...): mail server ưu tiên thấp nhất được dùng trước; không MX = mail không gửi được đến domain.',
      'TXT record thoạt đơn dàng nhưng chứa quy tắc bảo mật email: SPF = IP nào được gửi email cho domain, DKIM = signature xác thực, DMARC = chính sách xử lý email giả mạo. Thiếu hoặc sai SPF/DKIM = email bị spam filter từ chối.',
      'DEFENDER: setup đầy đủ SPF/DKIM/DMARC; rà AAAA không cần thiết; kiểm tra MX không chỉ tồn tại mà còn resolve được (vd mail server IP phải valid); không để NS/SOA lộ quá nhiều thông tin admin.',
    ],
    terms: [
      { term: 'A record', def: 'DNS record ánh xạ tên miền sang IPv4 (e.g., example.com -> 1.2.3.4).' },
      { term: 'AAAA record', def: 'DNS record ánh xạ tên miền sang IPv6.' },
      { term: 'MX record', def: 'DNS record chỉ định mail server nhận email, có độ ưu tiên (priority).' },
      { term: 'TXT record', def: 'DNS record lưu text tuỳ ý, dùng cho SPF, DKIM, DMARC, domain verification.' },
    ],
    initialFilesystem: fsC3M6,
  },
  {
    id: 7,
    chapterId: 3,
    title: 'Nslookup từ name server khác',
    story:
      'Mày muốn xác minh DNS record từ một name server cụ thể (không phải resolver của ISP). Dùng nslookup hoặc host để query trực tiếp name server và so sánh kết quả.',
    steps: [
      {
        id: 'nslookup_default',
        description: 'Query nslookup mặc định từ resolver hệ thống',
        match: /^nslookup\b\s+shop\.acme-corp\.com\s*$/,
        output: [
          'Server:         8.8.8.8',
          'Address:        8.8.8.8#53',
          'Non-authoritative answer:',
          'Name:   shop.acme-corp.com',
          'Address: 203.0.113.42',
        ].join('\n'),
      },
      {
        id: 'nslookup_ns',
        description: 'Query trực tiếp name server authoritative của domain',
        match: /^nslookup\b.*shop\.acme-corp\.com\s+ns1\.digitalocean\.com/i,
        output: [
          'Server:         ns1.digitalocean.com',
          'Address:        173.245.58.51#53',
          'Name:   shop.acme-corp.com',
          'Address: 203.0.113.42',
          '(authoritative answer từ name server gốc)',
        ].join('\n'),
      },
      {
        id: 'host_cmd',
        description: 'Dùng host command (cú pháp ngắn hơn nslookup)',
        match: /^host\b\s+shop\.acme-corp\.com/i,
        output: 'shop.acme-corp.com has address 203.0.113.42\nshop.acme-corp.com mail is handled by 10 mail.acme-corp.com.',
      },
    ],
    hints: [
      'nslookup + tên miền dùng resolver mặc định; nslookup + tên miền + name server query trực tiếp NS đó.',
      'Query trực tiếp NS hay để debug DNS caching/propagation: resolver ISP cache cũ nhưng NS gốc biết record mới nhất.',
      'host command kết hợp A+MX ra một dòng, nhanh hơn dig nhưng ít tùy chọn.',
    ],
    debrief: [
      'DNS layered caching: resolver ISP cache kết quả từ NS gốc. Nếu record vừa đổi, resolver cache cũ nhưng NS gốc biết cái mới — query NS trực tiếp để verify đổi đã live hay chưa.',
      'Authoritative vs non-authoritative: NS gốc trả "authoritative answer" (tôi biết chắc chắn), resolver cache trả "non-authoritative" (tôi cache từ người khác) — xem được qua nslookup.',
      'host + domain ngắn và gọn, thích hợp script; nslookup chi tiết hơn, dễ đọc; dig mạnh nhất (NSE, DNSSEC verify, trace). Thạo cả ba để lựa chọn đúng context.',
      'DEFENDER: TTL (time to live) của record điều khiển cache timeout — TTL thấp (300s) = nhanh propagate đổi nhưng query DNS nhiều; TTL cao (3600+) = ít query nhưng đổi mất lâu; cân bằng theo tình huống.',
    ],
    terms: [
      { term: 'nslookup', def: 'Công cụ query DNS, hỏi resolver hoặc name server cụ thể.' },
      { term: 'host', def: 'Công cụ DNS query ngắn gọn, output dễ parse cho script.' },
      { term: 'Authoritative answer', def: 'Phản hồi từ name server gốc (chủ quản) biết chắc chắn record.' },
      { term: 'TTL', def: 'Time to Live — thời gian resolver cache một record trước khi hỏi lại NS gốc.' },
    ],
    initialFilesystem: fsC3M7,
  },
  {
    id: 8,
    chapterId: 3,
    title: 'Dò web bằng curl verbose',
    story:
      'Web http://10.10.14.55/ trả 500. Mày cần thấy chi tiết giao thức HTTP: request header được gửi gì, response trả gì, redirect có không. Curl -v là cách để soi toàn bộ quá trình.',
    steps: [
      {
        id: 'curl_verbose',
        description: 'Chạy curl -v để xem toàn bộ request/response header',
        match: /^curl\b.*-v\b.*10\.10\.14\.55/i,
        output: [
          '*   Trying 10.10.14.55:80...',
          '* Connected to 10.10.14.55 port 80 (#0)',
          '> GET / HTTP/1.1',
          '> Host: 10.10.14.55',
          '> User-Agent: curl/7.81.0',
          '> Accept: */*',
          '>',
          '< HTTP/1.1 500 Internal Server Error',
          '< Server: Apache/2.4.41 (Ubuntu)',
          '< Content-Length: 612',
          '< Content-Type: text/html; charset=ISO-8859-1',
          '<',
          '... (HTML error page body) ...',
        ].join('\n'),
      },
      {
        id: 'curl_headers',
        description: 'Lấy chỉ HTTP headers không lấy body (curl -I)',
        match: /^curl\b.*-i\b.*10\.10\.14\.55|^curl\b.*-head.*10\.10\.14\.55/i,
        output: [
          'HTTP/1.1 500 Internal Server Error',
          'Server: Apache/2.4.41 (Ubuntu)',
          'Date: Wed, 25 Jun 2026 10:00:00 GMT',
          'Content-Type: text/html; charset=ISO-8859-1',
          'Content-Length: 612',
        ].join('\n'),
      },
      {
        id: 'curl_follow',
        description: 'Follow redirect nếu server trả 301/302 (curl -L)',
        match: /^curl\b.*-l\b.*10\.10\.14\.55|^curl\b.*-L\b.*10\.10\.14\.55/i,
        output: [
          '(follows 301 redirect từ /old -> /new, rồi in final response)',
        ].join('\n'),
      },
    ],
    hints: [
      'curl -v in request + response header để thấy đầy đủ giao thức; curl -I chỉ lấy header; curl -L theo redirect.',
      'Dùng `curl -v http://10.10.14.55` để xem chi tiết. Nếu thấy `< HTTP/1.1 500` = server lỗi, đòi xem log app.',
      'Chỉnh `User-Agent` hoặc header khác với `-H "Header: value"` để giả lập request khác (vd từ browser vs. bot).',
    ],
    debrief: [
      'Curl -v lộ toàn bộ giao thức: DNS resolution, TCP handshake, TLS handshake (nếu HTTPS), HTTP request line + headers, response headers + body. Hữu ích khi debug "tại sao server trả lạ?" hoặc "redirect đi đâu?".',
      'Header Server/X-Powered-By lộ phần mềm + version (Apache 2.4.41, PHP 7.4.3); attacker dùng để chọn exploit theo version. -v cũng để ý Content-Type (JSON vs. HTML) và Content-Length (0 = trống, >0 = có body).',
      'HTTP status code: 2xx = OK, 3xx = redirect, 4xx = client error (404 not found, 401 auth), 5xx = server error (500, 503). 500 = unhandled exception (kiểm log); 502 = gateway không tương thích backend.',
      'DEFENDER: che bớt banner/version trong header; không leak implementation details qua error page; rate-limit curl/scanner; WAF phát hiện curl User-Agent (không phải browser) và block hoặc rate-limit.',
    ],
    terms: [
      { term: 'curl -v', def: 'Verbose mode: in request + response header cả body.' },
      { term: 'curl -I', def: 'Lấy chỉ HTTP header, không lấy body (shortcut là --head).' },
      { term: 'curl -L', def: 'Follow redirect tự động, theo 301/302 đến page cuối cùng.' },
      { term: 'HTTP status code', def: '2xx success, 3xx redirect, 4xx client error, 5xx server error.' },
    ],
    initialFilesystem: fsC3M8,
  },
  {
    id: 9,
    chapterId: 3,
    title: 'Xem port nào đang mở real-time',
    story:
      'Sếp muốn biết server đang serving gì: port nào mở, protocol gì, PID nào giữ cổng. Mày phải liệt kê socket trạng thái (listening/established) và tiến trình đứng sau từng cổng.',
    steps: [
      {
        id: 'ss_listen',
        description: 'Liệt kê tất cả port listening (ss -tulpn)',
        match: /^ss\b.*-tulpn/i,
        output: [
          'Netid State    Recv-Q Send-Q Local Address:Port   Peer Address:Port Process',
          'tcp   LISTEN   0      511    127.0.0.1:8080       0.0.0.0:*       users:(("python",pid=2234,fd=3))',
          'tcp   LISTEN   0      128    0.0.0.0:22           0.0.0.0:*       users:(("sshd",pid=820,fd=3))',
          'tcp   LISTEN   0      128    0.0.0.0:80           0.0.0.0:*       users:(("nginx",pid=1123,fd=6))',
          'tcp   LISTEN   0      100    127.0.0.1:3306       0.0.0.0:*       users:(("mysqld",pid=980,fd=33))',
          'tcp   LISTEN   0      128    0.0.0.0:443          0.0.0.0:*       users:(("nginx",pid=1124,fd=7))',
          'udp   UNCONN   0      0      0.0.0.0:53           0.0.0.0:*       users:(("named",pid=1050,fd=22))',
        ].join('\n'),
      },
      {
        id: 'netstat_compare',
        description: 'So sánh với netstat -tulpn (cũ hơn ss nhưng vẫn dùng)',
        match: /^netstat\b.*-tulpn/i,
        output: [
          'Active Internet connections (servers and established)',
          'tcp   0   0 127.0.0.1:8080   0.0.0.0:*        LISTEN      2234/python',
          'tcp   0   0 0.0.0.0:22       0.0.0.0:*        LISTEN      820/sshd',
          'tcp   0   0 0.0.0.0:80       0.0.0.0:*        LISTEN      1123/nginx',
          '(output format khác nhưng thông tin tương tự)',
        ].join('\n'),
      },
      {
        id: 'ss_established',
        description: 'Xem kết nối ESTABLISHED (các client đang nói chuyện)',
        match: /^ss\b.*established|^ss\b.*-an\b/i,
        output: [
          'tcp   ESTAB    0      0    10.0.0.5:22     203.0.113.7:51234 users:(("sshd",pid=5678,fd=3))',
          'tcp   ESTAB    0      0    10.0.0.5:443    203.0.113.50:60001 users:(("nginx",pid=1123,fd=12))',
        ].join('\n'),
      },
    ],
    hints: [
      'ss (socket statistics) mạnh hơn netstat cũ; -t (TCP), -u (UDP), -l (LISTEN), -p (process), -n (numeric port).',
      'Dùng `ss -tulpn` để xem mọi port listening kèm PID; `ss -anp` để xem toàn bộ socket kèm LISTEN + ESTABLISHED.',
      'Để ý cột "Local Address:Port" — bind 127.0.0.1 chỉ localhost vào được; 0.0.0.0 = mọi interface vào được. Cột Process = tiến trình nào giữ cổng.',
    ],
    debrief: [
      'ss/netstat là công cụ enum đầu tiên: liệt kê mọi port mở và tiến trình đứng sau. attacker dùng để map dịch vụ; defender dùng để phát hiện port lạ/malware. Biết port nào mở = nửa đầu của công cuộc khai thác.',
      'LISTEN = port chờ kết nối, ESTABLISHED = có client kết nối; CLOSE_WAIT/TIME_WAIT = trạng thái chuyển tiếp giữa kết nối và đóng. Nếu có rất nhiều TIME_WAIT có thể là DoS hoặc port exhaustion.',
      'Bind 0.0.0.0 = mở hết interface (eth0, lo, vpn...); bind 127.0.0.1 = chỉ local; bind 0.0.0.0 rõ ràng là muốn expose ra ngoài. SOCKS proxy hay app admin thường bind localhost cố ý để không expose ngoài.',
      'DEFENDER: kiểm tra thường xuyên bằng ss/netstat để phát hiện port lạ/malware listening; close port không dùng; bind app nhạy vào localhost nếu không cần expose; log kết nối đặc biệt (SYN flood = nhiều NEW trong short time).',
    ],
    terms: [
      { term: 'ss', def: 'Socket statistics — hiển thị tất cả socket listening và established, mạnh hơn netstat.' },
      { term: 'netstat', def: 'Network statistics — công cụ cũ để xem port/socket, hiện tại ss là thay thế được ưa thích.' },
      { term: '-tulpn flags', def: '-t TCP, -u UDP, -l LISTEN, -p process, -n numeric port (không resolve service name).' },
      { term: 'LISTEN vs ESTABLISHED', def: 'LISTEN = chờ kết nối; ESTABLISHED = đã có client kết nối và tương tác.' },
    ],
    initialFilesystem: fsC3M9,
  },
  {
    id: 10,
    chapterId: 3,
    title: 'Xem ai đang dùng cổng',
    story:
      'Mày chạy app trên port 8000 nhưng bị "Address already in use". Cần tìm process nào chiếm cổng 8000 và kill nó trước khi restart app.',
    steps: [
      {
        id: 'lsof_port',
        description: 'Xem PID/process nào đang dùng port 8000 (lsof -i :8000)',
        match: /^lsof\b.*-i.*:?8000|^lsof\b.*-i.*8000/i,
        output: [
          'COMMAND    PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME',
          'python    5500 hacker  3u  IPv4  12345      0t0  TCP 127.0.0.1:8000 (LISTEN)',
        ].join('\n'),
      },
      {
        id: 'lsof_tcp',
        description: 'Liệt kê tất cả TCP socket mà process đó mở',
        match: /^lsof\b.*-p\s+\d+/,
        output: [
          'COMMAND    PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME',
          'python    5500 hacker  3u  IPv4  12345      0t0  TCP 127.0.0.1:8000 (LISTEN)',
          'python    5500 hacker  4u  IPv4  12346      0t0  TCP 127.0.0.1:8000->127.0.0.1:50123 (ESTABLISHED)',
        ].join('\n'),
      },
      {
        id: 'kill_port',
        description: 'Kill process chiếm port',
        match: /^kill\b.*5500|^kill\s+-9\s+5500/,
        output: 'Killed process 5500 (python); port 8000 now free',
      },
    ],
    hints: [
      'lsof (list open files) không chỉ file — còn socket. lsof -i :8000 xem cổng 8000 đang bị process nào dùng.',
      'Dùng `lsof -i :8000` để thấy PID; rồi `kill -9 <PID>` để kill. Hoặc kết hợp: `kill $(lsof -t -i :8000)`.',
      'lsof -p <PID> để thấy tất cả file/socket mà process đó mở; hữu ích khi debug resource leak hoặc file handle exhaustion.',
    ],
    debrief: [
      'lsof -i là công cụ enum mạnh: không chỉ xem port mở mà còn xem ai mở, PID nào, file descriptor (fd) mấy. "LISTEN" = port chờ, "ESTABLISHED" = client kết nối.',
      'Process không ngoan (fork, socket không close) sẽ mở lượng lớn fd — lsof -p <PID> giúp phát hiện fd leak, từ đó troubleshoot memory/resource issue.',
      'Attacker dùng lsof để enum process + port; defender dùng để phát hiện backdoor listening trên port lạ. Kiểu tấn công supply chain hay để malware listen port tiêu diệt để C2 kết nối.',
      'DEFENDER: kiểm tra thường xuyên lsof để phát hiện port/process lạ; monitor system limit file descriptor (ulimit -n); có alert trên process mở quá nhiều fd hoặc port lạ (honeypot port).',
    ],
    terms: [
      { term: 'lsof', def: 'List open files — xem file/socket/device mà process mở, rất mạnh cho debugging.' },
      { term: 'lsof -i', def: 'Lọc chỉ socket (network), xem port listening/established.' },
      { term: 'file descriptor (fd)', def: 'Con số định danh file/socket trong process, mỗi fd = 1 resource mở.' },
      { term: 'Address already in use', def: 'Lỗi khi bind port vì process khác đã dùng; cần find + kill process cũ hoặc chọn port khác.' },
    ],
    initialFilesystem: fsC3M10,
  },
  {
    id: 11,
    chapterId: 3,
    title: 'Kiểm tra cấu hình IP & route',
    story:
      'Server có nhiều interface mạng (lo, eth0, eth1, vpn0). Mày phải xem mỗi interface gán IP nào, gateway mặc định là gì, route table có gì lạ.',
    steps: [
      {
        id: 'ip_addr',
        description: 'Xem tất cả interface mạng và IP được gán (ip addr)',
        match: /^ip\b.*addr\b|^ip\s+a\b/i,
        output: [
          '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536',
          '    inet 127.0.0.1/8 scope host lo',
          '    inet6 ::1/128 scope host',
          '2: eth0: <BROADCAST,RUNNING,MULTICAST> mtu 1500',
          '    inet 10.0.0.5/24 brd 10.0.0.255 scope global eth0',
          '    inet6 fe80::42:c0ff:fea8:1/64 scope link',
          '3: eth1: <BROADCAST,MULTICAST> mtu 1500',
          '    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth1',
          '4: vpn0: <POINTOPOINT,NOARP,UP,RUNNING> mtu 1500',
          '    inet 172.16.0.2/30 scope global vpn0',
        ].join('\n'),
      },
      {
        id: 'ip_route',
        description: 'Xem route table (ip route) để biết traffic tới đâu qua interface nào',
        match: /^ip\b.*route\b|^ip\s+r\b/i,
        output: [
          'default via 10.0.0.1 dev eth0   <- default gateway qua eth0',
          '10.0.0.0/24 dev eth0 proto kernel scope link src 10.0.0.5',
          '192.168.1.0/24 dev eth1 proto kernel scope link src 192.168.1.100',
          '172.16.0.0/30 dev vpn0 proto kernel scope link src 172.16.0.2',
          '10.20.0.0/16 via 172.16.0.1 dev vpn0   <- internal network qua VPN',
        ].join('\n'),
      },
      {
        id: 'ifconfig_old',
        description: 'Hoặc dùng ifconfig (cũ hơn ip addr, nhưng vẫn phổ biến)',
        match: /^ifconfig\b/i,
        output: [
          'eth0: flags=UP,RUNNING',
          '        inet 10.0.0.5  netmask 255.255.255.0  broadcast 10.0.0.255',
          '        inet6 fe80::42:c0ff:fea8:1  prefixlen 64',
          'eth1: flags=UP,RUNNING',
          '        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255',
        ].join('\n'),
      },
    ],
    hints: [
      'ip addr xem interface + IP hiện tại. ip route xem bảng định tuyến. ifconfig cũ hơn ip nhưng vẫn dùng được.',
      'Dùng `ip addr` hoặc `ip a` để xem IP. `ip route` hay `ip r` để xem route. Default gateway (`via ...`) là nơi gửi packet khi không biết chính xác đích.',
      'Có nhiều interface = machine là middle node, có thể dùng nó để pivot tới mạng nội bộ khác (attacker perspective).',
    ],
    debrief: [
      'ip addr + ip route = bản đồ mạng của host: biết nó kết nối cái gì, gateway tới đâu, có route gì bất thường.',
      'Default gateway (via X.X.X.X dev eth0) là nơi packet trỏ khi destination không trong subnet nào trực tiếp. Attacker xem route để tìm "cầu" tới mạng nội bộ (10.x, 192.168.x); defender lo route bị giả mạo (route hijacking).',
      'VPN interface (tun0, vpn0, wg0) = túnel để đi tới mạng nội bộ; có nó = host kết nối mạng peering lớn hơn. Multi-interface = pivot point: attacker từ eth0 xâm nhập rồi dùng eth1/vpn0 để lateral move vào mạng khác.',
      'DEFENDER: quản lý route cẩn thận (không để route động bị hijack); disable interface không dùng; eth1 nối mạng riêng thì firewall rule phải vô cùng chặt; log routing change (netlink).',
    ],
    terms: [
      { term: 'ip addr / ip a', def: 'Xem tất cả interface mạng và IP được gán (thay thế ifconfig).' },
      { term: 'ip route / ip r', def: 'Xem bảng định tuyến: traffic tới subnet nào qua interface/gateway nào.' },
      { term: 'Default gateway', def: 'Router mặc định xử lý packet khi destination không trong subnet local.' },
      { term: 'Subnet / netmask', def: 'CIDR notation (e.g., 10.0.0.0/24) = 10.0.0.1 đến 10.0.0.254 là cùng mạng con.' },
    ],
    initialFilesystem: fsC3M11,
  },
  {
    id: 12,
    chapterId: 3,
    title: 'Firewall rule kiểm tra',
    story:
      'Đã cấp phép port 8000 trên firewall nhưng từ ngoài vẫn truy cập không được. Mày phải xem firewall rule hiện tại, port 8000 rule nào chặn, permit rule nào — và sửa.',
    steps: [
      {
        id: 'iptables_list',
        description: 'Liệt kê iptables rule hiện tại (iptables -L -n)',
        match: /^iptables\b.*-l\b/i,
        output: [
          'Chain INPUT (policy DROP)',
          'target  prot opt source       destination',
          'ACCEPT  all  --  0.0.0.0/0    0.0.0.0/0   state RELATED,ESTABLISHED',
          'ACCEPT  tcp  --  0.0.0.0/0    0.0.0.0/0   tcp dpt:22',
          'ACCEPT  tcp  --  0.0.0.0/0    0.0.0.0/0   tcp dpt:80',
          'ACCEPT  tcp  --  0.0.0.0/0    0.0.0.0/0   tcp dpt:443',
          'DROP    tcp  --  0.0.0.0/0    0.0.0.0/0   tcp dpt:8000   <- CẤM port 8000!',
        ].join('\n'),
      },
      {
        id: 'ufw_status',
        description: 'Dùng ufw status (giao diện cao hơn iptables)',
        match: /^ufw\b.*status/i,
        output: [
          'Status: active',
          'To                         Action      From',
          '--                         ------      ----',
          'Anywhere                   DENY        203.0.113.7  <- chặn IP này hết?',
          '22/tcp                     ALLOW       Anywhere',
          '80/tcp                     ALLOW       Anywhere',
          '443/tcp                    ALLOW       Anywhere',
          '8000/tcp                   DENY        Anywhere       <- port 8000 DENY!',
        ].join('\n'),
      },
      {
        id: 'ufw_allow',
        description: 'Sửa rule: cho phép port 8000 (ufw allow 8000)',
        match: /^ufw\b.*allow.*8000/i,
        output: 'Rule added; rule numbering updated',
      },
    ],
    hints: [
      'iptables -L liệt kê rule chi tiết (chain, target, port); ufw status ngắn gọn hơn.',
      'Policy DROP = chặn hết by default, chỉ ALLOW cái nào được ACCEPT; Policy ACCEPT = cho hết, chỉ chặn cái DROP.',
      'Dùng `ufw allow 8000/tcp` để add rule allow port 8000; `ufw delete allow 8000` để xoá rule.',
    ],
    debrief: [
      'iptables là máy móc thực (netfilter kernel module); ufw/firewalld là giao diện chân thành hơn trên top. iptables raw output phức tạp nhưng mạnh, ufw dễ đọc nhưng ít tuỳ chọn.',
      'Chain INPUT = đến localhost, OUTPUT = từ localhost, FORWARD = qua host (host relay traffic). Default policy quyết định: DROP = deny-by-default (an toàn), ACCEPT = allow-by-default (nhưng cần chặn cụ thể).',
      'Deny-by-default tốt hơn allow-by-default: bắt buộc admin xác nhận mỗi port cần allow. Rule DROP port 8000 sau các ACCEPT = rule đầu tiên match sẽ áp dụng; nếu muốn bỏ ban, phải xoá hoặc sửa thứ tự rule.',
      'DEFENDER: review iptables/ufw regularly (kinh điển = ad hoc rule được add rồi quên xoá); đặt firewall ở mọi level (host fw + network fw); log firewall drop để phát hiện DoS attempt hoặc lateral move bị chặn.',
    ],
    terms: [
      { term: 'iptables', def: 'Công cụ Linux để cấu hình kernel firewall (netfilter).' },
      { term: 'ufw', def: 'Uncomplicated Firewall — giao diện đơn giản hơn iptables, wrapper trên top.' },
      { term: 'Chain: INPUT/OUTPUT/FORWARD', def: 'INPUT = incoming, OUTPUT = outgoing, FORWARD = relay traffic.' },
      { term: 'Policy DROP vs ACCEPT', def: 'DROP = deny-by-default (an toàn), ACCEPT = allow-by-default (tiện nhưng rủi ro).' },
    ],
    initialFilesystem: fsC3M12,
  },
  {
    id: 13,
    chapterId: 3,
    title: 'Capture & analyze traffic trực tiếp',
    story:
      'Log syslog báo có kết nối lạ; muốn xem chi tiết packet được gửi/nhận tại thời điểm lỗi. Tcpdump capture raw traffic, rồi mở bằng Wireshark hoặc xem trực tiếp bằng tcpdump flags.',
    steps: [
      {
        id: 'tcpdump_basic',
        description: 'Capture traffic TCP port 443 để xem HTTPS handshake',
        match: /^tcpdump\b.*tcp.*443|^tcpdump\b.*port\s+443/i,
        output: [
          '10:15:23.456789 IP 203.0.113.7.51234 > 10.0.0.5.443: Flags [S], seq 1234567, win 65535, length 0',
          '10:15:23.457123 IP 10.0.0.5.443 > 203.0.113.7.51234: Flags [S.], seq 7654321, ack 1234568, win 29200, length 0',
          '10:15:23.457456 IP 203.0.113.7.51234 > 10.0.0.5.443: Flags [.], ack 7654322, length 0',
          '(TCP 3-way handshake: SYN, SYN-ACK, ACK)',
        ].join('\n'),
      },
      {
        id: 'tcpdump_ascii',
        description: 'Capture với payload ASCII-readable (-A) để xem nội dung',
        match: /^tcpdump\b.*-a\b.*|^tcpdump\b.*-ascii/i,
        output: [
          '10:15:30.123456 IP 10.0.0.5.51234 > 8.8.8.8.53: UDP payload:',
          'GET / HTTP/1.1',
          'Host: www.example.com',
          'User-Agent: Mozilla/5.0',
        ].join('\n'),
      },
      {
        id: 'tcpdump_write',
        description: 'Ghi traffic vào pcap file để phân tích sau bằng Wireshark',
        match: /^tcpdump\b.*-w\s+\S+\.pcap/i,
        output: 'tcpdump: listening on eth0, link-type EN10MB, capturing to capture.pcap',
      },
    ],
    hints: [
      'tcpdump capture packet trực tiếp; -w file.pcap ghi pcap format để mở bằng Wireshark; -A xem payload ascii.',
      'Dùng `tcpdump -i eth0 tcp port 443` để capture chỉ HTTPS. `tcpdump -A -i eth0 tcp port 443` để thấy payload.',
      'File pcap có thể mở bằng Wireshark GUI hoặc xem bằng tcpdump lại: `tcpdump -r capture.pcap`.',
    ],
    debrief: [
      'Tcpdump capture at thấp (kernel level) nên thấy tất cả traffic, kể cả HTTPS payload (encrypted, nhưng header/metadata decrypt được).',
      'Flags [S] = SYN (bắt đầu kết nối), [S.] = SYN-ACK (trả lời), [.] = ACK (xác nhận), [P] = PUSH (có dữ liệu), [F] = FIN (đóng). Xem chuỗi flags để hiểu quá trình TCP.',
      'Payload ascii mode (-A) hữu ích khi traffic không encrypt (HTTP, Telnet) để xem credential/data thẳng. HTTPS sẽ thấy TLS header nhưng payload vẫn encrypted.',
      'DEFENDER: tcpdump cần quyền root; monitor ai dùng tcpdump (audit tool usages); encrypted traffic ngay cả attach packet capture vẫn không lo lắng (payload encrypted), nhưng metadata (IP, port, size) vẫn lộ; rate-limit hoặc block suspicious traffic pattern (SYN flood, port scan).',
    ],
    terms: [
      { term: 'tcpdump -w', def: 'Ghi packet vào pcap file để phân tích sau bằng Wireshark.' },
      { term: 'tcpdump -A', def: 'In payload dạng ASCII để xem nội dung text (HTTP, Telnet, unencrypted).' },
      { term: 'TCP Flags: S/A/F/P', def: 'SYN=bắt đầu, ACK=xác nhận, FIN=đóng, PUSH=có data.' },
      { term: 'pcap format', def: 'Định dạng file packet capture chuẩn, mở được bằng Wireshark/tcpdump.' },
    ],
    initialFilesystem: fsC3M13,
  },
  {
    id: 14,
    chapterId: 3,
    title: 'Ngăn chặn DDoS bằng rate-limit',
    story:
      'Server bị DDoS từ 10 IP khác nhau, gửi hàng nghìn packet/giây tới port 80. Firewall chưa cấu hình rate-limit. Mày phải thêm rule để drop packet quá nhanh từ một IP, bảo vệ server.',
    steps: [
      {
        id: 'iptables_limit',
        description: 'Thêm iptables rule limit kết nối tới port 80 (iptables -A INPUT -p tcp --dport 80 -m limit)',
        match: /^iptables\b.*-a\b.*limit|^iptables\b.*-a.*--dport\s+80/i,
        output: 'Rule added to INPUT chain to rate-limit port 80 to 25 pkt/sec',
      },
      {
        id: 'ufw_rate',
        description: 'Dùng ufw limit (rate-limit, tự động block sau 6 kết nối trong 30 giây từ một IP)',
        match: /^ufw\b.*limit|^ufw\b.*80.*limit/i,
        output: 'Rule added; limiting connections to 80/tcp from any',
      },
      {
        id: 'verify',
        description: 'Xác nhận rule được thêm vào (ufw status)',
        match: /^ufw\b.*status|^iptables\b.*-l/i,
        output: '80/tcp                     LIMIT       Anywhere   (newly added)',
      },
    ],
    hints: [
      'Rate-limit = cho qua một số kết nối rồi drop kết nối thêm từ cùng IP trong thời gian, không phải block hẳn.',
      'Dùng `ufw limit 80` để limit TCP 80; hoặc `iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/sec --limit-burst 100 -j ACCEPT`.',
      'Limit không ngăn hẳn attacker nhưng làm chậm DDoS, cho phép legitimate traffic đi qua.',
    ],
    debrief: [
      'Rate-limit = công cụ giữa chừng: không ngăn hẳn (block), nhưng làm chậm attacker. Limit kết nối mới từ một IP (stateful) vs. limit packet (stateless) có cách hoạt động khác.',
      'ufw limit tự động sắp quy tắc để từ chối kết nối thêm từ IP gửi >6 kết nối trong 30s; iptables dùng "limit" module tuỳ chỉnh tỷ lệ (25/sec, burst 100...).',
      'DDoS volumetric (UDP flood, DNS amplification) khó limit vì từ nhiều IP; layer 7 DDoS (HTTP GET flood) dễ limit hơn (limit qua TCP). Defense in depth: rate-limit + CDN + ISP upstream filtering.',
      'DEFENDER: set rate-limit hợp lý (quá chặt = cắt user legitimate, quá lỏng = attacker qua); kết hợp geographic blocking (GeoIP), CAPTCHA, hoặc DDOS mitigation service (Cloudflare, Akamai).',
    ],
    terms: [
      { term: 'Rate-limit', def: 'Giới hạn số lượng kết nối/packet từ một IP trong một khoảng thời gian.' },
      { term: 'ufw limit', def: 'Cấu hình UFW để tự động limit kết nối mới từ cùng IP (6 per 30s mặc định).' },
      { term: 'iptables -m limit', def: 'Module iptables để limit packet rate (--limit 25/sec, --limit-burst 100).' },
      { term: 'DDoS volumetric vs. Layer 7', def: 'Volumetric = lũ packet raw (UDP/ICMP); Layer 7 = HTTP GET flood (ứng dụng).' },
    ],
    initialFilesystem: fsC3M14,
  },
  {
    id: 15,
    chapterId: 3,
    title: 'Tầng vật lý: kiểm tra MAC & ARP',
    story:
      'Mạng nội bộ hoạt động lạ; máy một tỏ ra là máy khác qua spoofed MAC. Mày phải xem MAC address hiện tại, kiểm tra ARP table xem cái nào lạ, và xác nhận ARP spoofing hay broadcast storm.',
    steps: [
      {
        id: 'ip_link',
        description: 'Xem MAC address của mỗi interface (ip link)',
        match: /^ip\b.*link\b|^ip\s+l\b/i,
        output: [
          '1: lo: <LOOPBACK> mtu 65536',
          '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00',
          '2: eth0: <BROADCAST,RUNNING> mtu 1500',
          '    link/ether 52:54:00:aa:bb:cc brd ff:ff:ff:ff:ff:ff',
          '3: eth1: <BROADCAST,RUNNING> mtu 1500',
          '    link/ether 52:54:00:dd:ee:ff brd ff:ff:ff:ff:ff:ff',
        ].join('\n'),
      },
      {
        id: 'arp_table',
        description: 'Xem ARP table (arp -a) để xem cái mapping IP<->MAC',
        match: /^arp\b.*-a|^ip\b.*neigh/i,
        output: [
          '10.0.0.1 (10.0.0.1) at 52:54:00:11:22:33 [ether] on eth0',
          '10.0.0.5 (10.0.0.5) at 52:54:00:aa:bb:cc [ether] on eth0  <- our own IP, our own MAC',
          '10.0.0.100 (10.0.0.100) at 52:54:00:44:55:66 [ether] on eth0',
          '10.0.0.120 (10.0.0.120) at 52:54:00:44:55:66 [ether] on eth0  <- SAME MAC! Possible spoofing?',
        ].join('\n'),
      },
      {
        id: 'arp_check',
        description: 'Xác nhận bằng ping + tcpdump để xem ARP reply từ đâu',
        match: /^(ping|arp|tcpdump).*10\.0\.0\.120/i,
        output: 'ARP protocol để xem reply từ 52:54:00:44:55:66 — verify 10.0.0.120 có phải máy đó không.',
      },
    ],
    hints: [
      'MAC = địa chỉ layer 2 (Ethernet); ARP = giao thức dịch IP sang MAC trên subnet local.',
      'Dùng `ip link` xem MAC của mình; `arp -a` hoặc `ip neigh` xem ARP table (IP và MAC tương ứng trên mạng).',
      'Nếu 2 IP khác nhau cùng MAC = ARP spoofing (nhân vật xấu); hoặc bond/tun interface (nhân vật tốt). Ping + tcpdump để xác nhận.',
    ],
    debrief: [
      'ARP là Layer 2 broadcast protocol không có authentication: ai cũng có thể trả lời "IP X có MAC là Y" — nơi cư trú của ARP spoofing.',
      'ARP spoofing cổ điển để MITM (man-in-the-middle): kẻ xấu báo "tôi là gateway" (MAC giả), traffic bị redirect qua kẻ xấu, ghi lại/edit rồi forward. VLAN + port security + ARP inspection giúp ngăn.',
      'Broadcast storm (loop trong switch) cũng lộ qua ARP: hàng trăm ARP request tràn lan vì packet được lặp lại qua loop switch, làm network chậm hoặc lag.',
      'DEFENDER: enable Dynamic ARP Inspection (DAI) trên switch; port security để limit MAC per port; gratuitous ARP từ gateway để update ARP table định kỳ; IDS detect ARP pattern lạ (rapid changes).',
    ],
    terms: [
      { term: 'MAC address', def: 'Địa chỉ layer 2 (physical), định danh network card, ví dụ 52:54:00:aa:bb:cc.' },
      { term: 'ARP (Address Resolution Protocol)', def: 'Giao thức dịch IP sang MAC trên subnet local, không authenticate nên dễ spoofing.' },
      { term: 'ARP spoofing', def: 'Giả mạo ARP reply để claim là IP khác, dùng để MITM hoặc DoS.' },
      { term: 'DAI (Dynamic ARP Inspection)', def: 'Tính năng switch để validate ARP packet, chặn ARP spoofing cơ bản.' },
    ],
    initialFilesystem: fsC3M15,
  },
  {
    id: 16,
    chapterId: 3,
    title: 'HTTP redirect & header lạ',
    story:
      'Web request tới http://public-api.acme.internal trả 301 redirect tới domain khác. Mày cần inspect kỹ curl -v để xem redirect URL, có thể redirect tới attacker-controlled domain hay là intentional.',
    steps: [
      {
        id: 'curl_follow',
        description: 'Curl mà không follow redirect để xem Location header (-i hoặc -I)',
        match: /^curl\b.*-i\b.*public-api|^curl\b.*-head.*public-api/i,
        output: [
          'HTTP/1.1 301 Moved Permanently',
          'Server: nginx/1.18.0',
          'Location: https://api.cloud-provider.com/acme',
          'Content-Length: 0',
          'Connection: close',
        ].join('\n'),
      },
      {
        id: 'curl_location',
        description: 'Follow redirect để xem endpoint cuối cùng',
        match: /^curl\b.*-l\b.*public-api|^curl\b.*-L\b.*public-api/i,
        output: 'Redirects to https://api.cloud-provider.com/acme and returns 200 OK',
      },
      {
        id: 'check_dns',
        description: 'Xác nhận DNS api.cloud-provider.com trỏ về đâu (dig)',
        match: /^dig\b.*api\.cloud-provider\.com|^nslookup\b.*api\.cloud-provider\.com/i,
        output: 'api.cloud-provider.com has address 203.0.113.250 (legitimate cloud provider)',
      },
    ],
    hints: [
      'curl -i in header kèm body; curl -I chỉ header; curl -L tự follow redirect.',
      'Dùng `curl -i http://public-api.acme.internal` để xem 301 + Location header; `dig` để xác nhận domain khác là legitimate hay giả.',
      'Redirect từ nội bộ (.internal) tới external domain = gợi ý dùng cloud provider; nếu Location là IP nghi ngờ = possible attack.',
    ],
    debrief: [
      'HTTP redirect được dùng nhiều: tải cân bằng (load balancer redirect tới backend), external SaaS (redirect tới cloud provider), hay cache (redirect tới CDN).',
      'Attacker dùng redirect để phishing: tạo domain giống và redirect user tới "clone" site để lấy credential. curl -v soi rõ redirect chain, từ đó detect open redirect vulnerability.',
      'Location header không validate = open redirect: nếu chấp nhận tham số từ user (vd ?next=/admin) và redirect đến đó = lỗ hổng (attacker link tới domain giả, victim nghĩ là site tin cây).',
      'DEFENDER: whitelist Location domain thay vì redirect tự do tới bất kỳ đâu; không cho user control redirect (remove ?next= tham số nếu có); secure redirect: sau redirect kiểm tra HTTPS + valid certificate.',
    ],
    terms: [
      { term: 'HTTP 301', def: 'Moved Permanently — client nên cập nhật bookmark tới Location mới.' },
      { term: 'HTTP 302', def: 'Found (temporary redirect) — client không cập nhật bookmark.' },
      { term: 'Location header', def: 'Header chứa URL redirect, phía client theo đó để gửi request tới endpoint mới.' },
      { term: 'Open redirect', def: 'Lỗ hổng cho phép redirect tới domain ngoài, dùng cho phishing.' },
    ],
    initialFilesystem: fsC3M16,
  },
  {
    id: 17,
    chapterId: 3,
    title: 'Analyze HTTP caching & proxy header',
    story:
      'Static asset được cache quá lâu; user còn thấy phiên bản cũ dù đã deploy version mới. Mày kiểm tra response header (Cache-Control, ETag, Last-Modified) để debug caching policy.',
    steps: [
      {
        id: 'curl_headers',
        description: 'Xem HTTP response header bằng curl -i để kiểm tra cache policy',
        match: /^curl\b.*-i\b.*acme\.com/i,
        output: [
          'HTTP/1.1 200 OK',
          'Server: nginx/1.18.0',
          'Date: Wed, 25 Jun 2026 10:00:00 GMT',
          'Content-Type: application/javascript',
          'Content-Length: 1024',
          'Cache-Control: max-age=31536000, public   <- cache 1 YEAR!',
          'ETag: "abc123def456"',
          'Last-Modified: Wed, 25 May 2026 14:00:00 GMT',
        ].join('\n'),
      },
      {
        id: 'curl_cache',
        description: 'Bắt buộc refresh cache bằng curl -H (override header)',
        match: /^curl\b.*-h.*cache-control|^curl\b.*cache-control.*no-cache/i,
        output: 'Curl with "Cache-Control: no-cache" header sent to server, bypassing local cache',
      },
      {
        id: 'analyze',
        description: 'Đọc ghi chú để hiểu vì sao cache quá lâu',
        match: /^cat\s+.*cache-note\.txt/,
      },
    ],
    hints: [
      'Cache-Control header điều khiển caching: max-age=X (cache X giây), no-cache (validate lại với server), no-store (không cache).',
      'Dùng `curl -i URL` để xem header; `curl -H "Cache-Control: no-cache" URL` để bắt buộc revalidate.',
      'Static asset (JS, CSS, img) thường cache lâu; dynamic content (API) không cache hoặc cache ngắn. File lớn = cache lâu để tiết kiệm bandwidth; file nhỏ = cache ngắn để update nhanh.',
    ],
    debrief: [
      'HTTP caching quy tắc: Client cache theo Cache-Control + browser cache policy; CDN cache theo Vary/ETag; origin cache theo Redis/memcached. Mỗi lớp khác nhau → debug caching phức tạp.',
      'Cache-Control max-age=31536000 (1 năm) là kinh điển cho static asset fingerprinted (tên file có hash); nếu version mới = tên file mới = new request, old version lại cached. Nếu tên file không đổi = update mà user thấy cũ = cache quá lâu.',
      'ETag (entity tag) + Last-Modified = cache validation: khi cache hết, client gửi If-None-Match/If-Modified-Since; server trả 304 Not Modified (giữ cache) hay 200 (update).',
      'DEFENDER: sử dụng content hash trong tên file (app.12345abc.js); set Cache-Control ngắn cho HTML (max-age=0, no-cache); dài cho static asset có hash (max-age=31536000); CDN/proxy cache bỏ qua origin cache policy nên cần soi kỹ Vary header.',
    ],
    terms: [
      { term: 'Cache-Control', def: 'Header điều khiển caching: max-age, no-cache, no-store, public, private.' },
      { term: 'ETag', def: 'Hash nội dung file, dùng để xác nhận cache còn valid hay update.' },
      { term: 'max-age', def: 'Số giây cache được phép giữ response trước khi phải revalidate.' },
      { term: '304 Not Modified', def: 'Response khi cache valid, server báo không cần update, client dùng cache cũ.' },
    ],
    initialFilesystem: fsC3M17,
  },
  {
    id: 18,
    chapterId: 3,
    title: 'Tổng hợp: debug network end-to-end',
    story:
      'Bài tốt nghiệp Chương 3. Domain api.acme-corp.com bị user report "tải chậm lúc nào không lúc có". Mày phải dùng toàn bộ công cụ chương này để diagnose: DNS, routing, firewall, HTTP caching, packet capture — từ đó ra khuyến cáo fix.',
    steps: [
      {
        id: 'dns_check',
        description: 'Bắt đầu bằng DNS: dig api.acme-corp.com rồi ping để xác nhận host sống',
        match: /^(dig|nslookup|ping|host)\b.*api\.acme-corp\.com/i,
        output: 'api.acme-corp.com has address 203.0.113.100 (resolved OK). Ping 203.0.113.100: 0% loss, rtt avg 12ms (latency tốt)',
      },
      {
        id: 'trace_path',
        description: 'Traceroute để xem đường đi từ mình tới server',
        match: /^traceroute\b.*api\.acme-corp\.com|^mtr\b.*api\.acme-corp\.com/i,
        output: 'Hop 3 (ISP backbone): 50ms latency, 15% packet loss -> BOTTLENECK',
      },
      {
        id: 'http_check',
        description: 'Curl -v để xem HTTP response time + header (Cache-Control quá lâu?)',
        match: /^curl\b.*-v\b.*api\.acme-corp\.com|^curl\b.*-i\b.*api\.acme-corp\.com/i,
        output: 'Cache-Control: max-age=0, no-cache (caching tốt). Response time 200ms; Content-Length lớn (5MB) = transfer lâu',
      },
      {
        id: 'recommend',
        description: 'Đọc ghi chú để tổng kết khuyến cáo',
        match: /^cat\s+.*diagnosis\.txt|^cat\s+.*recommendation\.txt/,
      },
    ],
    hints: [
      'Quy trình diagnose network: DNS → ping (host sống?) → traceroute (đường đi?) → HTTP (cache OK? response time?) → tcpdump (packet loss?)',
      'Công cụ cần thiết: dig/nslookup/host (DNS), ping/traceroute/mtr (routing), ss/netstat/lsof (port), curl -v/-i (HTTP), tcpdump (packet), iptables/ufw (firewall).',
      'Từng công cụ mục đích khác: ping xác nhận online; traceroute tìm hop chậm; curl xem HTTP behavior; tcpdump xem packet; ss xem port listening; iptables xem firewall rule.',
    ],
    debrief: [
      'Network problem không bao giờ đơn giản — lớp lồng lớp: DNS → IP routing → TCP → HTTP → caching → application logic. Diagnose từ bottom-up: DNS → ping → traceroute → port → HTTP → packet; nó sẽ lộ tầng nào bị vấn đề.',
      'Triệu chứng "tải chậm lúc nào không lúc có" = variable latency: thường là hop bị congestion (queue lớn), hoặc caching policy không consistent (vd public cache vs. private cache).',
      'Packet loss 15% ở hop 3 = ISP backbone bị tắc (attacker có thể giả mạo DDoS, hoặc provider thực sự bị issue). Giải pháp: đổi ISP, dùng CDN (multi-path), hoặc optimize packet size.',
      'DEFENDER: monitoring proactive (Nagios/Prometheus) để phát hiện latency tăng trước khi user complaint; log network metrics (rtt, packet loss, throughput); rate-limit + load balance để tránh congestion; ISP SLA để có backup khi primary bị issue.',
    ],
    terms: [
      { term: 'End-to-end diagnosis', def: 'Tiếp cận từ bottom-up: DNS → routing → port → HTTP → packet, từ đó xác định tầng nào bị vấn đề.' },
      { term: 'Bottleneck', def: 'Điểm chặn hiệu suất (hop chậm, port congestion, server overload).' },
      { term: 'Variable latency', def: 'Độ trễ lúc cao lúc thấp, báo dấu hiệu congestion hoặc caching inconsistency.' },
      { term: 'CDN (Content Delivery Network)', def: 'Mạng cache phân tán toàn cầu để giảm latency bằng cách phục vụ từ edge gần user.' },
    ],
    initialFilesystem: fsC3M18,
  },
];
