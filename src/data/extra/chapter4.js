// Mission MỚI (bổ sung) cho Chương 4 — SSH & Remote Access. Bám LPIC-1 / Linux+ chuẩn.
// Drill: ssh-keygen types (ed25519/rsa), ssh-copy-id, ~/.ssh/config (alias/Host/IdentityFile/Port),
//        ssh -i/-p, -L/-R/-D forwarding, scp -r, rsync -avz/--delete/--exclude/-n dry-run,
//        sshd_config hardening (disable root, port, MaxAuthTries), fail2ban basics.
// Engine offline: lệnh file-based (cat/ls/grep) KHÔNG có output; lệnh network (ssh/scp/rsync) PHẢI có output canned.
import fsC4M4 from '../filesystems/chapter4-mission4.js';
import fsC4M5 from '../filesystems/chapter4-mission5.js';
import fsC4M6 from '../filesystems/chapter4-mission6.js';
import fsC4M7 from '../filesystems/chapter4-mission7.js';
import fsC4M8 from '../filesystems/chapter4-mission8.js';
import fsC4M9 from '../filesystems/chapter4-mission9.js';
import fsC4M10 from '../filesystems/chapter4-mission10.js';
import fsC4M11 from '../filesystems/chapter4-mission11.js';
import fsC4M12 from '../filesystems/chapter4-mission12.js';
import fsC4M13 from '../filesystems/chapter4-mission13.js';
import fsC4M14 from '../filesystems/chapter4-mission14.js';
import fsC4M15 from '../filesystems/chapter4-mission15.js';

export default [
  {
    id: 4,
    chapterId: 4,
    title: 'SSH key RSA hay ED25519?',
    story:
      'Mày cần tạo key mới cho một số server. Trước khi xộc vào, mày muốn biết loại key nào (RSA, ED25519) phù hợp nhất cho bảo mật và tốc độ — rồi tạo một cặp ED25519 với passphrase.',
    steps: [
      { id: 'keygen_ed25519', description: 'Tạo SSH key ED25519 với passphrase', match: /^ssh-keygen\s+.*-t\s+ed25519(?:.*-N.*|.*-C\s+\S+)?/, output: 'Generating public/private ed25519 key pair.\nYour identification has been saved in /home/hacker/.ssh/id_ed25519\nYour public key has been saved in /home/hacker/.ssh/id_ed25519.pub\nThe key fingerprint is: SHA256:8w9xK...pL9Q hacker@lab\nYour public key has been saved in /home/hacker/.ssh/id_ed25519.pub' },
      { id: 'list_keys', description: 'Liệt kê SSH key vừa tạo trong ~/.ssh', match: /^ls\s+(-la|.*-l)?\s*~?\.?\/\.ssh\/?$/ },
      { id: 'read_pub', description: 'Xem nội dung public key (id_ed25519.pub) để kiểm tra format', match: /^cat\s+~?\/\.ssh\/id_ed25519\.pub/ },
    ],
    hints: [
      'ED25519 nhanh, bảo mật, và tân tiến hơn RSA — thuộc chuẩn IETF. Tạo bằng `ssh-keygen -t ed25519`.',
      'Dùng `ssh-keygen -t ed25519 -C "email@example.com"` để thêm comment, hoặc `-N ""` để skip passphrase (không an toàn).',
      'Liệt kê key: `ls -la ~/.ssh/`, xem public key: `cat ~/.ssh/id_ed25519.pub` (dạng "ssh-ed25519 AAAA...").',
    ],
    debrief: [
      'ED25519 là tiêu chuẩn modern: 256-bit, nhanh hơn RSA-2048, ít dễ mắc lỗi triển khai; RSA vẫn dùng khi khách cũ yêu cầu nhưng không còn được khuyến nghị cho key mới.',
      'Passphrase bảo vệ private key trên đĩa: nếu key bị lộ, passphrase vẫn cần để dùng. Mỗi khi SSH yêu cầu passphrase lần đầu, ssh-agent cache nó trong session.',
      'Public key dạng `ssh-ed25519 AAAA...` dài ~70 ký tự; không bao giờ chia sẻ private key (không `.pub`) vì đó chính là chìa khóa toàn quyền.',
      'Phòng thủ: yêu cầu ED25519 or RSA-2048+; cấm RSA-1024 trong policy; audit ~/.ssh/ định kỳ tìm key bất thường; sử dụng hardware security key thay thế passphrase nếu có điều kiện.',
    ],
    terms: [
      { term: 'ED25519', def: 'Thuật toán đường cong elliptic modern, 256-bit, nhanh, tiêu chuẩn IETF RFC 8032.' },
      { term: 'ssh-keygen -t ed25519', def: 'Tạo cặp key ED25519; -C thêm comment, -N ""/-N pass đặt passphrase.' },
      { term: 'passphrase', def: 'Mật khẩu bảo vệ private key khi lưu trên đĩa (khác password SSH).' },
      { term: 'ssh-agent', def: 'Daemon lưu giữ private key trong bộ nhớ, tránh gõ passphrase lặp lại.' },
    ],
    initialFilesystem: fsC4M4,
  },
  {
    id: 5,
    chapterId: 4,
    title: 'Cấu hình SSH không mệt mỏi',
    story:
      'Lệnh SSH dài lắm: `ssh -i /path/to/key -p 2222 user@host.example.com`. Mày tạo file ~/.ssh/config để đặt alias — gõ `ssh myserver` là xong, toàn bộ cấu hình đã sẵn.',
    steps: [
      { id: 'create_config', description: 'Tạo hoặc sửa ~/.ssh/config để thêm host alias', match: /^(cat|vim|nano|echo|tee)\s+.*\.ssh\/config|^vi\s+~?\/\.ssh\/config/ },
      { id: 'read_config', description: 'Xem nội dung ~/.ssh/config sau khi sửa', match: /^cat\s+~?\/\.ssh\/config/ },
      { id: 'test_alias', description: 'Test SSH alias vừa cấu hình (ssh myserver -v để xem chi tiết)', match: /^ssh\s+(myserver|prod).*(-v)?$|^ssh\s+-v.*myserver/ },
    ],
    hints: [
      '~/.ssh/config có format: `Host myserver` rồi các dòng `HostName`, `User`, `IdentityFile`, `Port`, indented bằng space.',
      'Dùng `cat > ~/.ssh/config` hoặc `vim ~/.ssh/config` để tạo/sửa. Format cơ bản:\nHost myserver\n  HostName example.com\n  User deploy\n  IdentityFile ~/.ssh/id_ed25519\n  Port 2222',
      'Xem lại config đã lưu: `cat ~/.ssh/config`. Test bằng `ssh myserver` hoặc `ssh -v myserver` (verbose) để xem cách nó parse config.',
    ],
    debrief: [
      '~/.ssh/config là nơi cấu hình SSH hành động như "profile": mỗi Host block ghi IdentityFile, Port, User, Proxy, KeepAlive — biến SSH từ tool khó chịu thành dễ dùng.',
      'Thứ tự ưu tiên: `-v` (flag CLI) > ~/.ssh/config > mặc định ssh — nên config phù hợp case phổ biến, flag CLI override khi cần trường hợp ngoại lệ.',
      'IdentityFile có thể liệt kê nhiều (SSH thử lần lượt) — tránh phải chỉ định `-i` từng lần. Nếu lỡ cấp SSH key sai rồi, thay đổi ~/.ssh/config là cách nhanh nhất.',
      'Phòng thủ: ~/.ssh/config phải là `600` (chỉ owner đọc/ghi) vì nó có thể chứa hostname/user/port nhạy cảm; audit config định kỳ phát hiện config không an toàn (ví dụ StrictHostKeyChecking=no).',
    ],
    terms: [
      { term: 'Host block', def: 'Một phần trong ~/.ssh/config từ `Host <pattern>` tới `Host` tiếp theo hoặc EOF, gom cấu hình cho một hay nhiều host.' },
      { term: 'HostName', def: 'Tên DNS hoặc IP thật của host; `Host alias` là tên bạn gõ, `HostName` là nơi SSH thực sự kết nối.' },
      { term: 'IdentityFile', def: 'Đường dẫn tới private key dùng cho host này; SSH thử các key liệt kê lần lượt.' },
      { term: 'StrictHostKeyChecking', def: 'Cấp độ kiểm tra host key (yes/no/accept-new); "no" không an toàn vì dễ MITM.' },
    ],
    initialFilesystem: fsC4M5,
  },
  {
    id: 6,
    chapterId: 4,
    title: 'Remote port forward — quay ngược lại',
    story:
      'Mày chạy một app trên máy local:3000 và muốn remote team truy cập qua server tunnel. Ngược lại với local forward, mày dùng `ssh -R` để forward cổng REMOTE tới KHÔNG NHƯ ĐỌC ở mây vào cái CÁCH TẠI MÁY MÌ.',
    steps: [
      { id: 'remote_forward', description: 'Tạo SSH remote port forward từ remote server về local app', match: /^ssh\s+.*-R\s+\S+:127\.0\.0\.1:(3000|8000)/, output: 'Tunnel established: remote 8888 -> (via ssh) 127.0.0.1:3000. SSH session holding tunnel.' },
      { id: 'verify_remote', description: 'Trên remote, curl localhost:8888 để xác nhận tunnel hoạt động', match: /^curl\s+(localhost|127\.0\.0\.1):8888|^nc\s+.*localhost\s+8888/ },
    ],
    hints: [
      'Remote forward: `-R <remote_port>:<local_target>:<local_port>`. Ví dụ: `ssh -R 8888:127.0.0.1:3000 deploy@server` — port 8888 trên server tunnel tới local 3000.',
      'Dùng `ssh -R 8888:localhost:3000 deploy@server`, rồi `curl localhost:8888` ở shell khác trên server để test.',
      'Remote forward thường dùng cho dev share live app hay debug; local forward thường dùng để access dịch vụ nội bộ từ local.',
    ],
    debrief: [
      'Local forward (-L) từ local đi đến remote; remote forward (-R) từ remote về local — đó là vấn đề tương tác: từ đâu tới đâu tuân theo hướng thông lưu dữ liệu thực tế.',
      'Remote forward yêu cầu server SSH phải có `GatewayPorts yes` trong sshd_config để cho client khác (ngoài localhost) truy cập, mặc định chỉ localhost được phép vì bảo mật.',
      'Lợi dụng -R để share dev server hay backup từ máy không có IP public — remote server trở thành "cổng" tạm để những máy khác kết nối vào.',
      'Phòng thủ: `GatewayPorts no` (mặc định) để chỉ localhost (trên server) dùng được tunnel; log tất cả SSH tunneling attempts; nghi ngờ nếu user bình thường request GatewayPorts yes.',
    ],
    terms: [
      { term: 'ssh -R', def: 'Remote port forward: forward cổng trên REMOTE server tới dịch vụ ở LOCAL (ngược lại -L).' },
      { term: 'GatewayPorts', def: 'Cấu hình sshd cho phép (-R) tunnel accessible từ ngoài localhost (mặc định no vì bảo mật).' },
      { term: 'Tunnel management', def: 'SSH tunnel là long-lived connection; Ctrl+C tắt tunnel; `~C` (escape sequence) trong SSH session để quản lý tunnel.' },
    ],
    initialFilesystem: fsC4M6,
  },
  {
    id: 7,
    chapterId: 4,
    title: 'SOCKS proxy qua SSH',
    story:
      'Mày ở mạng khách hàng hạn chế, muốn redirect toàn bộ traffic qua SSH tunnel ra ngoài. SSH có chế độ SOCKS dynamic proxy `-D` — một port trên local hoạt động như SOCKS5 proxy chuyển mọi request qua tunnel.',
    steps: [
      { id: 'socks_proxy', description: 'Tạo SSH SOCKS proxy động', match: /^ssh\s+.*-D\s+\d{4,5}/, output: 'Dynamic proxy listening on 127.0.0.1:1080 -> all traffic will tunnel through server' },
      { id: 'test_proxy', description: 'Cấu hình curl hoặc browser để dùng SOCKS proxy vừa tạo', match: /^curl\s+.*-x\s+(socks5:\/\/)?127\.0\.0\.1:1080|^firefox.*socks/ },
    ],
    hints: [
      'Dynamic proxy SOCKS: `ssh -D 1080 deploy@server` — mở port 1080 localhost như SOCKS5 proxy.',
      'Dùng với curl: `curl -x socks5://127.0.0.1:1080 http://internal.example.com`, hoặc cấu hình Firefox/Chrome proxy settings.',
      'Lợi ích: tất cả ứng dụng tuân theo SOCKS sẽ tunnel qua SSH mà không cần custom port forward cho từng service.',
    ],
    debrief: [
      '(-D) SOCKS proxy hay gặp khi cần "thoát khỏi" network bị giới hạn: nó mở một port local giả dạng SOCKS5 server, ứng dụng nói chuyện qua đó như normal proxy, nhưng traffic thực đi qua SSH tunnel.',
      'Khác với -L (static single port forward), SOCKS proxy (-D) support nhiều destination động — client nói "gửi request này tới host X port Y", proxy forward hết qua tunnel.',
      'Thường dùng cho pentester hoặc remote worker ở mạng hạn chế: một khi có SSH foothold, SOCKS proxy là cách nhanh để "thâm nhập sâu" từ một host có IP public.',
      'Phòng thủ: giám sát tunnel dài hạn (`netstat | grep ssh` thường, log kết nối SSH lạ); cần outbound SSH traffic thì cân nhắc có phải một dấu hiệu pivot/exfil; rate-limit SOCKS tunneling.',
    ],
    terms: [
      { term: 'SOCKS5 proxy', def: 'Giao thức proxy cho phép client yêu cầu proxy chuyển kết nối tới bất kỳ host/port.' },
      { term: 'ssh -D', def: 'Tạo SOCKS5 dynamic proxy: local port hoạt động như proxy chuyển mọi connection qua tunnel SSH.' },
      { term: 'curl -x socks5://', def: 'Dùng SOCKS proxy với curl (hoặc -x http://proxy hoặc -x socks5h:// cho DNS resolution qua proxy).' },
    ],
    initialFilesystem: fsC4M7,
  },
  {
    id: 8,
    chapterId: 4,
    title: 'SCP copy file từ xa',
    story:
      'Cần lấy một file từ server production về máy local để phân tích. Không thể mở SFTP interactive được vì script chạy tự động. Dùng scp để copy file trong một lệnh — dạng remote shell variant của cp.',
    steps: [
      { id: 'scp_from_remote', description: 'Copy file từ remote server về local', match: /^scp\b.*deploy@\S*:\S*\.(conf|bak)\S*\s+\.?/ },
      { id: 'scp_recursive', description: 'Copy thư mục đệ quy từ remote (-r)', match: /^scp\s+-r\b.*(deploy|prod).*:.*logs\b.*/ },
      { id: 'verify_local', description: 'Xác nhận file/thư mục đã copy về local', match: /^ls\b(\s+-\w*)*\s*(\.|~)?\/?(config|logs|backup)?\S*\s*$/ },
    ],
    hints: [
      'SCP syntax: `scp <source> <dest>`. Remote: `scp deploy@prod:/etc/app.conf .` (về local), hoặc `scp file deploy@prod:/path/` (đẩy lên).',
      'Dùng `-r` để copy thư mục đệ quy: `scp -r deploy@prod:/var/log/app logs-backup/`.',
      'Xác nhận đã copy về: `ls` (hoặc `ls -la`) ở thư mục hiện tại để thấy file/thư mục vừa nhận.',
    ],
    debrief: [
      'SCP lợi dụng SSH auth nên không cần riêng password/key; nó là wrapper xung quanh SSH — giống như `rcp` xưa nhưng an toàn hơn nhờ mã hoá.',
      'Cách nhanh copy file từ remote trong script CI/CD hoặc backup automation — `scp -r` tương đương `cp -r` nhưng qua SSH.',
      'Khuyết điểm: SCP không resume được nếu kết nối bị ngắt (rsync có `-P`), và không chỉ truyền delta như rsync — thích hợp file nhỏ, một lần; rsync tốt hơn cho sync định kỳ.',
      'Phòng thủ: audit SCP/rsync logs định kỳ để phát hiện data exfiltration (đôi khi attacker dùng SCP để lấy toàn bộ database); giới hạn quyền truy cập path theo least-privilege; disable scp trong restricted shell nếu cần.',
    ],
    terms: [
      { term: 'scp', def: 'Secure copy — copy file/thư mục qua SSH, syntax giống cp nhưng hỗ trợ remote path (user@host:/path).' },
      { term: 'scp -r', def: 'Copy đệ quy cả thư mục và nội dung bên trong.' },
      { term: 'remote path syntax', def: 'user@host:/absolute/path hoặc host:/path (nếu ~/.ssh/config có Host); local path không cần prefix.' },
    ],
    initialFilesystem: fsC4M8,
  },
  {
    id: 9,
    chapterId: 4,
    title: 'Rsync với exclude và dry-run',
    story:
      'Deploy thường gặp rắc rối: .env có dữ liệu bí mật không được sync lên, hoặc node_modules nặng 500MB cũng tình cờ được sync làm lãng phí. Mày dùng rsync kèm `--exclude` để loại file/thư mục, và `-n` dry-run để preview trước khi sync thật.',
    steps: [
      { id: 'rsync_exclude', description: 'Rsync với --exclude để loại file nhạy cảm', match: /^rsync\b.*--exclude\b.*(\.env|node_modules).*~?\/project/ },
      { id: 'rsync_dryrun', description: 'Chạy rsync với -n (dry-run) để preview sẽ sync gì', match: /^rsync\b.*-n\b/ },
      { id: 'rsync_real', description: 'Chạy rsync thật (không -n) sau khi preview đồng ý', match: /^rsync\b(?!.*-n).*-avz\b/ },
    ],
    hints: [
      '`rsync -avz --exclude ".env" --exclude "node_modules" ~/project/ deploy@prod:/var/www/app/`.',
      'Dry-run là an toàn: thêm `-n` để xem sẽ xảy gì mà chưa commit: `rsync -avz -n --exclude ".env" ~/project/ deploy@prod:/var/www/app/`.',
      'Nhiều --exclude: `--exclude ".env" --exclude ".git" --exclude "*.log"`. Hoặc dùng file danh sách: `--exclude-from=.rsyncignore`.',
    ],
    debrief: [
      'Dry-run (-n) là "giữ tiền" đầu tiên trong deployment: preview chính xác cái gì sẽ sync, soi lại tất cả --exclude rules có đúng không, trước khi thực thi.',
      'Người mới dùng rsync thường quên --exclude .env -> lỡ sync secrets lên prod remote; hoặc đổi nhầm source/dest slash (`.../` vs `...`) nên rsync một thứ gì đó bất ngờ — dry-run cứu rỗi.',
      '--delete flag (khi dùng) XOÁ file trên đích nếu không có ở nguồn — rất mạnh, phải dùng dry-run trước. Nếu rsync đi theo cấu trúc đẹp, --delete rất sạch; nếu lộn xộn, --delete có thể xoá nhầm.',
      'Phòng thủ: dùng rsync wrapper script để enforce --exclude rules; backup trước khi rsync --delete; giám sát rsync log để phát hiện data leakage hoặc xoá bất thường; readonly mount points khi có thể.',
    ],
    terms: [
      { term: 'rsync --exclude', def: 'Loại trừ file/thư mục khỏi sync (dùng glob patterns); thể dùng nhiều lần hoặc --exclude-from file.' },
      { term: 'rsync -n (dry-run)', def: 'Preview những gì sẽ sync mà không thực sự chuyển file; để xác nhận trước khi commit.' },
      { term: 'rsync --delete', def: 'Xóa file trên đích nếu không có ở nguồn; dùng cẩn thận vì rất mạnh, dùng -n preview trước.' },
      { term: '.rsyncignore', def: 'File danh sách pattern được exclude (tương tự .gitignore), dùng --exclude-from để load.' },
    ],
    initialFilesystem: fsC4M9,
  },
  {
    id: 10,
    chapterId: 4,
    title: 'Nâng SSH key từ RSA cũ lên ED25519',
    story:
      'Server cũ chỉ hỗ trợ RSA-2048 hoặc thậm chí RSA-1024 (không an toàn). Mày cần audit public key hiện tại, tạo ED25519 mới, đẩy lên, xoá key cũ, rồi verify toàn bộ. Đây là quy trình upgrade key trong production — cần cẩn thận không khóa mình ra ngoài.',
    steps: [
      { id: 'list_current', description: 'Xem public key hiện tại (và type) trong authorized_keys', match: /^(cat|grep)\b.*authorized_keys|^ssh-keygen\b.*-l/ },
      { id: 'keygen_new', description: 'Tạo ED25519 key mới', match: /^ssh-keygen\s+.*-t\s+ed25519/ },
      { id: 'copy_new', description: 'Đẩy ED25519 public key lên authorized_keys của server', match: /^ssh-copy-id\b.*-i\s+\S*id_ed25519/ },
      { id: 'verify', description: 'SSH vào server bằng key mới để xác nhận nó hoạt động', match: /^ssh\b.*-i\s+\S*id_ed25519|^ssh\s+\S*prod/ },
      { id: 'backup_old', description: 'Backup SSH config và authorized_keys trước khi xoá key cũ', match: /^cp\b.*authorized_keys.*authorized_keys\.bak|^tar\b.*(ssh|keys)/ },
    ],
    hints: [
      'Audit trước: `cat ~/.ssh/authorized_keys` để thấy loại key (ssh-rsa, ssh-ed25519), hoặc `ssh-keygen -l -f authorized_keys`.',
      'Tạo + copy mới: `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_new` (tên khác để tránh ghi đè), rồi `ssh-copy-id -i ~/.ssh/id_ed25519_new user@server`.',
      'Test ngay: `ssh -i ~/.ssh/id_ed25519_new user@server` để confirm nó hoạt động. Chỉ xoá key cũ sau khi confirm key mới 100% việc, và backup trước: `cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.bak`.',
    ],
    debrief: [
      'Upgrade key trong production là thao tác nguy hiểm: nếu xoá key cũ trước khi test key mới, bạn khóa chính mình ra ngoài máy chủ. Luôn có 2 key hoạt động trong 1-2 ngày trước khi xoá key cũ.',
      'RSA-1024 không nên dùng nữa (dễ bị crack), RSA-2048 chấp nhận được nhưng ED25519 tốt hơn: bảo mật tương đương nhưng nhanh hơn, code đơn giản hơn (ít lỗi triển khai).',
      'TOML/INI config hay lưu key path — khi upgrade key, cần update config các tool dùng SSH (Ansible, deployment tools...) chỉ tới key mới, hoặc dùng ssh-agent/ssh-config để trừu tượng hoá.',
      'Phòng thủ: lưu backup authorized_keys trước khi modify; giữ out-of-band access (bastion host, KVM, console) khi thay đổi auth; audit authorized_keys định kỳ tìm key bất thường (một dấu hiệu của persistence attacker).',
    ],
    terms: [
      { term: 'authorized_keys', def: 'File (~/.ssh/authorized_keys) chứa public key được phép đăng nhập — nằm trên server, client gửi private key để chứng thực.' },
      { term: 'ssh-keygen -l', def: 'Liệt kê (list) fingerprint của public key, cho thấy loại (rsa/ed25519) và độ dài bit.' },
      { term: 'Key rotation', def: 'Quy trình thay thế key cũ bằng key mới định kỳ để giảm risk nếu key cũ bị thoả hiệp.' },
      { term: 'Out-of-band access', def: 'Kênh truy cập không thông qua SSH (KVM, bastion, console) — sống còn khi bị lock out khỏi SSH.' },
    ],
    initialFilesystem: fsC4M10,
  },
  {
    id: 11,
    chapterId: 4,
    title: 'Hardening SSH server — disable root',
    story:
      'Sếp yêu cầu tất cả SSH phải không cho phép đăng nhập trực tiếp bằng root — kẻ tấn công sẽ phải brute-force username trước, mới login được, thêm một hàng rào. Mày sửa /etc/ssh/sshd_config để disable root login và giới hạn MaxAuthTries.',
    steps: [
      { id: 'view_sshd_config', description: 'Xem nội dung /etc/ssh/sshd_config hiện tại', match: /^cat\s+\/etc\/ssh\/sshd_config|^grep\b.*(PermitRootLogin|MaxAuthTries|Port)\s+\/etc\/ssh\/sshd_config/ },
      { id: 'edit_sshd', description: 'Sửa sshd_config để disable root login và/hoặc giảm MaxAuthTries', match: /^(sudo\s+)?(sed|vim|nano|echo|tee)\b.*sshd_config/ },
      { id: 'verify_syntax', description: 'Kiểm tra syntax của sshd_config sửa xong', match: /^(sudo\s+)?sshd\s+(-t|-T)\b/ },
      { id: 'restart_sshd', description: 'Restart sshd để apply config mới', match: /^(sudo\s+)?(systemctl|service)\s+(restart|reload)\s+sshd/ },
    ],
    hints: [
      'Xem config: `cat /etc/ssh/sshd_config | grep -E "(PermitRootLogin|MaxAuthTries|Port)"` (hoặc dùng `sshd -T` để xem values kế thừa/mặc định).',
      'Sửa: `sudo vim /etc/ssh/sshd_config`, tìm `PermitRootLogin` đặt `no`, và `MaxAuthTries` đặt `3` (mặc định 6).',
      'Syntax check: `sudo sshd -t` (return 0 = OK); restart: `sudo systemctl restart sshd`. Cẩn thận khi restart sshd — nếu config sai, bạn bị ngắt SSH, cần KVM để vào lại!',
    ],
    debrief: [
      'PermitRootLogin no là hardening chuẩn: kẻ tấn công biết root là tài khoản đặc biệt nên sẽ brute-force nó đầu tiên, nếu disable được thì attacker phải đoán username trước (khó hơn gấp nhiều lần).',
      'MaxAuthTries <5 (mặc định 6) kết hợp fail2ban chặn IP sau vài lần sai: hệ thống rất kỵ brute-force SSH. Nhưng cũng cần balance — user legit có thể gõ sai mật khẩu vài lần.',
      'Port thay đổi từ 22 sang cái khác (vd 2222) là security-by-obscurity — không bảo vệ hoàn toàn nhưng giảm scan tự động của bot; nmap -p- vẫn tìm được, nhưng giảm noise 99%.',
      'Phòng thủ: hardening SSH (disable root, key-only, limit auth, change port) là combo rất hiệu quả khi kết hợp fail2ban + IDS; mỗi cái riêng lẻ chỉ delay attacker, gộp lại thành tường lửa SSH.',
    ],
    terms: [
      { term: 'PermitRootLogin', def: 'Directive sshd_config kiểm soát có cho phép root login trực tiếp; "no" = disable, "prohibit-password" = key only.' },
      { term: 'MaxAuthTries', def: 'Số lần thử authentication tối đa trước khi disconnect; mặc định 6, giảm xuống 3-4 để chống brute-force.' },
      { term: 'sshd -t', def: 'Syntax check sshd_config mà không restart; hữu ích trước khi systemctl restart sshd để tránh lock out.' },
      { term: 'fail2ban', def: 'Daemon giám sát log SSH, block IP sau N lần auth failed trong thời gian nào đó.' },
    ],
    initialFilesystem: fsC4M11,
  },
  {
    id: 12,
    chapterId: 4,
    title: 'Fail2ban: tự động chặn brute-force',
    story:
      'Dù cấu hình SSH chặt chẽ, kẻ tấn công vẫn có thể brute-force password từ từ mà không trigger MaxAuthTries. Fail2ban giám sát log auth, phát hiện pattern "nhiều failed login từ cùng IP" trong một thời gian, rồi tự động chặn IP đó bằng firewall.',
    steps: [
      { id: 'check_fail2ban', description: 'Kiểm tra fail2ban status', match: /^(systemctl|service)\s+status\s+fail2ban|^sudo\s+systemctl\s+status\s+fail2ban/ },
      { id: 'list_jails', description: 'Liệt kê các jail (rule set) trong fail2ban', match: /^(fail2ban-client|sudo\s+fail2ban-client)\s+(status|list-jails)/ },
      { id: 'check_sshd_jail', description: 'Xem chi tiết jail "sshd" (số IP blocked, thời gian ban, log)', match: /^(fail2ban-client|sudo\s+fail2ban-client)\s+status\s+sshd|^sudo\s+tail\s+\/var\/log\/fail2ban\.log/ },
      { id: 'test_ban', description: 'Xem cấu hình sshd jail hoặc test bằng false login attempts', match: /^cat\s+\/etc\/fail2ban\/jail\.(local|conf)|^grep\b.*(sshd|enabled)\s+\/etc\/fail2ban/ },
    ],
    hints: [
      'Status: `sudo systemctl status fail2ban`. List jails: `sudo fail2ban-client status`; xem chi tiết sshd: `sudo fail2ban-client status sshd`.',
      'Xem config: `cat /etc/fail2ban/jail.conf` (mặc định) hoặc `/etc/fail2ban/jail.local` (custom). Sshd jail thường enable mặc định khi fail2ban cài.',
      'Khi fail2ban phát hiện >5 failed login SSH từ cùng IP trong 10 phút, nó chặn IP đó vĩnh viễn (hoặc tạm 1 giờ tùy config). Xem log: `sudo tail -f /var/log/fail2ban.log`.',
    ],
    debrief: [
      'Fail2ban là layer 2 của SSH hardening: kể cả khi attacker có wordlist tốt, fail2ban sẽ phát hiện pattern "hàng loạt failed login" và chặn trước khi brute-force thành công.',
      'Khác với rate-limiting layer firewall (tất cả kết nối), fail2ban giám sát log — nó biết "gõ sai mật khẩu" là khác "kết nối TCP bình thường"; nên có nhận thức hơn.',
      'Rủi ro: IP spoofing (nếu attacker gửi gói từ IP giả) hay abuse (attacker brute-force target khác để block IP của họ) — nhưng trong practice, fail2ban kết hợp SSH hardening là rất hiệu quả chống attack phổ biến.',
      'Phòng thủ: monitor fail2ban logs định kỳ tìm pattern lạ (một IP gửi hàng triệu failed attempt = sophisticated attack); whitelist IP trusted (VPN, office) để tránh block nhầm; customize jail rules theo risk profile.',
    ],
    terms: [
      { term: 'Fail2ban', def: 'Daemon giám sát log, phát hiện pattern tấn công (vd nhiều failed login), tự động block IP bằng iptables/firewall.' },
      { term: 'Jail', def: 'Rule set trong fail2ban, mỗi jail giám sát một service (sshd, apache, nginx...) với logfile, filter, action riêng.' },
      { term: 'Ban time', def: 'Thời gian IP bị block sau khi phát hiện (mặc định 600s = 10 phút, có thể đặt vĩnh viễn hoặc dynamic).' },
      { term: 'Recidive jail', def: 'Jail bắt "repeat offender" — IP bị ban nhiều lần sẽ bị block lâu hơn hoặc chặn vĩnh viễn.' },
    ],
    initialFilesystem: fsC4M12,
  },
  {
    id: 13,
    chapterId: 4,
    title: 'Ansible: SSH dùng cho automation',
    story:
      'Mày có 50 server cần cấu hình giống nhau. Gõ SSH từng cái là lãng phí. Ansible dùng SSH để kết nối và chạy lệnh hàng loạt — chỉ cần ~/.ssh/config và public key đã cấu hình đúng là Ansible có thể manage cả farm server qua SSH.',
    steps: [
      { id: 'install_ansible', description: 'Cài Ansible (nếu chưa có) trên máy control', match: /^(pip|apt|brew)\s+(install|add)\s+ansible|^ansible\s+--version/ },
      { id: 'create_inventory', description: 'Tạo inventory file liệt kê server (hoặc dùng file sẵn có)', match: /^cat\s+.*inventory|^echo\s+.*server.*>\s+inventory/ },
      { id: 'test_ping', description: 'Chạy ansible all -m ping để test kết nối SSH tới tất cả host', match: /^ansible\s+(all|prod)\s+-m\s+ping/ },
      { id: 'run_playbook', description: 'Chạy playbook (YAML file) để thực thi task trên nhiều server cùng lúc', match: /^ansible-playbook\s+\S*\.ya?ml|^ansible\s+all\s+-m\s+shell\s+-a\s+/ },
    ],
    hints: [
      'Cài: `pip install ansible` hoặc `apt install ansible`. Version: `ansible --version`.',
      'Đã có sẵn file inventory ở home — xem bằng `cat inventory`:\n[prod]\nweb1.example.com\nweb2.example.com\n[db]\ndb.example.com\n(hoặc tự tạo bằng `echo "web1.example.com" > inventory`).',
      'Ping test: `ansible all -m ping` (check toàn bộ host), hoặc `ansible prod -m ping` (chỉ group prod). Shell command: `ansible all -m shell -a "whoami"`.',
    ],
    debrief: [
      'Ansible lợi dụng SSH có sẵn — không cần agent trên target, không cần mở port riêng; chỉ cần SSH key hoạt động là Ansible có thể manage hàng trăm node từ một control machine.',
      'Agentless design của Ansible khác Chef/Puppet (cần agent): deploy nhanh, audit đơn giản, attack surface nhỏ. Nhưng cũng nghĩa là cứ mỗi lần chạy playbook đều SSH tới từng host (chậm hơn nếu network lag).',
      'Từ hardening SSH lên tới automation — nền tảng chắc chắn (key management, authorized_keys, sshd_config) là điều kiện để Ansible hoạt động smooth và an toàn.',
      'Phòng thủ: giới hạn quyền của Ansible account (ansible user + sudo NOPASSWD chỉ những lệnh cần); audit playbook changes (Ansible code review); log tất cả Ansible runs; privilege escalation trong Ansible phải audit kỹ.',
    ],
    terms: [
      { term: 'Ansible', def: 'Công cụ automation agentless dùng SSH để thực thi lệnh/config trên nhiều host cùng lúc (orchestration).' },
      { term: 'Inventory', def: 'File (hoặc plugin) liệt kê host và nhóm (group) — Ansible target host từ inventory, dùng SSH connect.' },
      { term: 'Playbook', def: 'YAML file định nghĩa tasks (actions) chạy trên host nào — declarative automation scripting.' },
      { term: 'Agentless', def: 'Không cần agent chạy trên target — chỉ cần SSH + shell. Khác với agent-based (Chef, Puppet).' },
    ],
    initialFilesystem: fsC4M13,
  },
  {
    id: 14,
    chapterId: 4,
    title: 'SSH certificate (short-lived key)',
    story:
      'Dùng key dài hạn mà key bị lộ là khẩu, phải rotate toàn hệ thống. Một giải pháp hay hơn: SSH CA (Certificate Authority) ký một certificate ngắn hạn (vd 1 giờ) — attacker lấy được cert nhưng nó hết hạn rồi, không dùng được nữa.',
    steps: [
      { id: 'ca_setup', description: 'Tạo SSH CA private key để ký certificate', match: /^ssh-keygen\b.*-t\s+(ed25519|rsa).*-f\s+.*ca/ },
      { id: 'user_key', description: 'Tạo user key bình thường (hay dùng key cũ)', match: /^ssh-keygen\b.*-t\s+ed25519.*-f\s+.*user/ },
      { id: 'sign_cert', description: 'CA ký certificate từ user public key', match: /^ssh-keygen\b.*-s\s+.*ca.*-I\s+.*-V\s+.*-n\s+/ },
      { id: 'verify_cert', description: 'Kiểm tra certificate đã ký (validity, principal...)', match: /^ssh-keygen\b.*-L\b.*cert|^cat\s+.*cert\.pub/ },
    ],
    hints: [
      'CA key: `ssh-keygen -t ed25519 -f ssh-ca` (private, giữ an toàn). User key: `ssh-keygen -t ed25519 -f user-key`.',
      'Ký certificate: `ssh-keygen -s ssh-ca -I "user@example" -V "+1h" -n user user-key.pub` (valid 1 giờ, principal "user").',
      'Verify: `ssh-keygen -L -f user-key-cert.pub` để xem certificate details (expiry date, principals, constraints).',
    ],
    debrief: [
      'SSH certificate nhìn giống public key nhưng là một cấu trúc khác: ngoài public key còn chứa metadata (principals, validity, critical/extension options) được ký bởi CA key.',
      'Thay vì mỗi host lưu cả `authorized_keys` dài, hệ thống chỉ cần lưu 1 CA public key trong `sshd_config` — mọi cert ký bằng CA đó đều được chấp nhận tới lúc hết hạn.',
      'Lợi ích: short-lived cert (1 giờ, 1 ngày) giảm window nếu key bị thoả hiệp; CA ký dynamic (vd dùng OAuth token) — không cần pre-generate cert; audit trail (ai ký cert khi nào).',
      'Nhược điểm: cần infra CA (bảo vệ CA key rất tốt), policy signing (validate user trước ký), CRL/revocation nếu cần. Khác RSA key vĩnh viễn — certificate có thời hạn nên cần renewal workflow.',
      'Phòng thủ: lưu CA private key an toàn (HSM, vault); audit certificate issuance; set validity ngắn (1-8h); implement revocation nếu có breach.',
    ],
    terms: [
      { term: 'SSH CA (Certificate Authority)', def: 'Private key dùng để ký SSH certificates; CA public key được lưu trên target host để verify cert.' },
      { term: '-s (sign)', def: 'Flag ssh-keygen để ký certificate từ public key dùng CA private key.' },
      { term: '-V (validity)', def: 'Thời gian hiệu lực của certificate (vd "+1h" = valid 1 giờ tính từ giờ hiện tại).' },
      { term: '-I (identity)', def: 'Tên định danh (ID string) ghi trong certificate, không ảnh hưởng đến auth nhưng dùng cho audit.' },
      { term: 'Principal', def: 'Tên user (hoặc role) mà certificate cho phép kết nối; host check principals từ certificate so với sshd_config.' },
    ],
    initialFilesystem: fsC4M14,
  },
  {
    id: 15,
    chapterId: 4,
    title: 'Kết hợp tổng hợp: SSH security audit',
    story:
      'Bài tốt nghiệp Chương 4. Mày phải audit một hệ thống SSH từ điểm A tới Z: kiểm tra SSH key có theo chuẩn (ED25519/RSA-2048), authorized_keys không có key lạ, sshd_config hardened, fail2ban bật, và SSH tunneling cho phép gì. Biên soạn một báo cáo an ninh có khuyến nghị.',
    steps: [
      { id: 'key_audit', description: 'Kiểm tra loại/độ dài SSH key hiện tại (authorized_keys, user key)', match: /^ssh-keygen\b.*-l\b|^cat\s+~?\.ssh\/authorized_keys/ },
      { id: 'sshd_config_check', description: 'Audit sshd_config: PermitRootLogin, MaxAuthTries, Port, Protocol, other hardening', match: /^cat\s+\/etc\/ssh\/sshd_config|^sshd\s+-T\b/ },
      { id: 'fail2ban_status', description: 'Kiểm tra fail2ban status, list jail, xem có block IP nào không', match: /^(sudo\s+)?fail2ban-client\s+(status|list-jails)/ },
      { id: 'tunnel_check', description: 'Xem có SSH tunnel nào đang chạy (netstat/ss để list)', match: /^(netstat|ss)\b.*-\w*[atn]|^ps\s+aux.*ssh.*(-L|-R|-D)/ },
      { id: 'report', description: 'Tạo hoặc xem báo cáo audit (summary findings + recommendations)', match: /^cat\s+.*audit|^echo\s+.*ssh.*audit/ },
    ],
    hints: [
      'Key audit: `ssh-keygen -l -f ~/.ssh/authorized_keys`, `ssh-keygen -l -f ~/.ssh/id_*` (check loại key, bit length).',
      'sshd_config: `sshd -T` (xem all settings kế thừa), hoặc `grep -E "(PermitRootLogin|Port|MaxAuthTries|Protocol)" /etc/ssh/sshd_config`. Fail2ban: `fail2ban-client status sshd`. Tunnel đang mở: `netstat -tulpna | grep ssh` hoặc `ss -tulpna`.',
      'Báo cáo: ghi findings ra file rồi xem lại, vd `echo "ssh audit: key ed25519 OK, root login disabled, fail2ban active" > audit-report.txt` rồi `cat audit-report.txt`. Tổng hợp risks (RSA-1024, PermitRootLogin yes), recommendations (upgrade key, disable root, set MaxAuthTries 3).',
    ],
    debrief: [
      'Audit SSH là checklist cơ bản trong bất kỳ security assessment nào: phương tiện access từ xa, thường bị attacker target trước. Checkpoints: key type/length → sshd hardening → monitoring (fail2ban) → tunneling (allowlist, logging).',
      'Mỗi bước audit sử dụng 3-4 kỹ thuật đã học trong chương: ssh-keygen (key), ssh-copy-id (deploy), sshd_config (hardening), fail2ban (monitoring), ssh -L/-R/-D (tunnel).',
      'Recommendation đúng chuẩn không phải liệt kê tất cả vấn đề mà prioritize: Ed25519 key (bắt buộc) > disable root (bắt buộc) > fail2ban (nên) > change port (nice-to-have). Risk rating giúp client focus.',
      'Phòng thủ: SSH audit định kỳ (hàng quý) để catch key/config drift; tự động kiểm tra authorized_keys (công cụ như lynis, CIS benchmark); enforce policy (key type, sshd settings) qua configuration management (Ansible, Puppet).',
    ],
    terms: [
      { term: 'SSH security audit', def: 'Kiểm tra toàn diện hệ thống SSH: key type/length, sshd_config hardening, fail2ban monitoring, tunnel control, reporting.' },
      { term: 'CIS benchmark', def: 'Tiêu chuẩn hardening do Center for Internet Security xuất bản, gồm checklist SSH (vd CIS Benchmarks cho Linux).' },
      { term: 'Risk rating', def: 'Phân loại vấn đề theo mức độ: Critical (cần fix ngay), High, Medium, Low, Info — dùng trong báo cáo audit.' },
      { term: 'Configuration drift', def: 'Hệ thống thay đổi so với baseline/golden image — SSH config dễ bị modify xoay, cần audit định kỳ.' },
      { term: 'Key fingerprint', def: 'Hash ngắn (256 bit) của public key để xác minh key không bị MITM; so sánh out-of-band (SMS, trao đổi trực tiếp) để verify.' },
    ],
    initialFilesystem: fsC4M15,
  },
];
