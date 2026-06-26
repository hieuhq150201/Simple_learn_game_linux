// Mission MỚI (bổ sung) cho Chương 2 — Process & System Control. Engine offline (lệnh tool -> canned EN).
import fsC2M4 from '../filesystems/chapter2-mission4.js';
import fsC2M5 from '../filesystems/chapter2-mission5.js';
import fsC2M6 from '../filesystems/chapter2-mission6.js';
import fsC2M7 from '../filesystems/chapter2-mission7.js';
import fsC2M8 from '../filesystems/chapter2-mission8.js';
import fsC2M9 from '../filesystems/chapter2-mission9.js';
import fsC2M10 from '../filesystems/chapter2-mission10.js';
import fsC2M11 from '../filesystems/chapter2-mission11.js';
import fsC2M12 from '../filesystems/chapter2-mission12.js';
import fsC2M13 from '../filesystems/chapter2-mission13.js';
import fsC2M14 from '../filesystems/chapter2-mission14.js';
import fsC2M15 from '../filesystems/chapter2-mission15.js';
import fsC2M16 from '../filesystems/chapter2-mission16.js';

export default [
  {
    id: 4,
    chapterId: 2,
    title: 'Mổ xẻ tiến trình',
    story:
      'Trước khi giết nhầm process, mày phải nhìn cho rõ cây tiến trình: cái nào đẻ ra cái nào, thằng nào ngốn RAM. Soi kỹ rồi mới ra tay.',
    steps: [
      {
        id: 'ps_aux',
        description: 'Liệt kê toàn bộ tiến trình (ps aux)',
        match: /^ps\s+aux\b|^ps\s+-ef\b/,
        output: [
          'USER       PID %CPU %MEM    VSZ   RSS STAT START   TIME COMMAND',
          'root         1  0.0  0.1 168120  9000 Ss   02:00   0:01 /sbin/init',
          'root       820  0.0  0.2 110200 12400 Ss   02:00   0:02 /usr/sbin/sshd',
          'mysql      902  3.1 18.4 1820000 740000 Sl 02:01   2:11 /usr/sbin/mysqld',
          'www-data  1455  1.2  2.0 412000 80000 S    02:30   0:18 php-fpm: pool www',
        ].join('\n'),
      },
      {
        id: 'pstree',
        description: 'Xem quan hệ cha-con dạng cây (pstree)',
        match: /^pstree\b/,
        output: [
          'systemd(1)-+-sshd(820)---sshd(1201)---bash(1202)',
          '           |-mysqld(902)',
          '           `-php-fpm(1455)-+-php-fpm(1456)',
          '                           `-php-fpm(1457)',
        ].join('\n'),
      },
      {
        id: 'ps_sort',
        description: 'Sắp xếp tiến trình theo RAM để tìm thằng ngốn nhất (ps --sort)',
        match: /^ps\s+.*--sort.*(-%mem|rss|-rss|%mem)/,
        output: 'PID   %MEM  RSS     COMMAND\n902   18.4  740000  /usr/sbin/mysqld   <-- ngon RAM nhat\n1455   2.0   80000  php-fpm',
      },
    ],
    hints: [
      'Nhìn toàn cảnh tiến trình trước, rồi xem quan hệ cha-con, rồi mới xếp theo tài nguyên.',
      'Dùng `ps aux` để liệt kê tất cả; `pstree` để thấy cây cha-con.',
      'Gõ `ps aux --sort=-%mem | head` để xếp theo RAM giảm dần, thằng đầu là kẻ ngốn nhất.',
    ],
    debrief: [
      'PID là số định danh tiến trình; PPID là PID của cha — mọi tiến trình đều là con cháu của PID 1 (init/systemd).',
      'pstree phơi bày quan hệ cha-con: kill cha thường khiến con mồ côi hoặc chết theo — hiểu cây giúp không giết nhầm cả nhánh dịch vụ.',
      'Điều tra sự cố lẫn forensics đều bắt đầu từ ps: tiến trình lạ làm con của một process hợp lệ (vd bash đẻ ra từ nginx) là dấu hiệu bị xâm nhập.',
      'Phòng thủ: baseline các tiến trình bình thường để phát hiện bất thường; cha-con bất thường (web server spawn shell) là IOC kinh điển.',
    ],
    terms: [
      { term: 'PID / PPID', def: 'Số định danh tiến trình và số định danh tiến trình cha.' },
      { term: 'ps aux', def: 'Liệt kê mọi tiến trình của mọi user kèm CPU/RAM.' },
      { term: 'pstree', def: 'Hiển thị tiến trình dạng cây theo quan hệ cha-con.' },
      { term: 'RSS', def: 'Resident Set Size — lượng RAM vật lý tiến trình đang dùng.' },
    ],
    initialFilesystem: fsC2M4,
  },
  {
    id: 5,
    chapterId: 2,
    title: 'Sát thủ tín hiệu',
    story:
      'Một process treo cứng không chịu chết. Mày phải hiểu sự khác nhau giữa "xin nó tự thoát" và "bắn thẳng vào đầu", rồi chọn đúng tín hiệu để xử lý.',
    steps: [
      { id: 'kill_list', description: 'Xem danh sách các tín hiệu có thể gửi (kill -l)', match: /^kill\s+-l\b/, output: ' 1) SIGHUP   2) SIGINT   3) SIGQUIT   9) SIGKILL  15) SIGTERM\n17) SIGCHLD 18) SIGCONT 19) SIGSTOP' },
      { id: 'kill_term', description: 'Gửi SIGTERM xin tiến trình tự thoát êm (kill -15)', match: /^kill\s+(-15|-TERM)\s+\d+/, output: '(SIGTERM gui toi PID — tien trinh nhan tin hieu, don dep roi tu thoat neu no "ngoan")' },
      { id: 'kill_force', description: 'Tiến trình lì -> ép chết bằng SIGKILL (kill -9)', match: /^(kill\s+-9|kill\s+-KILL|pkill\s+-9)\b/, output: '[1]+  Killed   (SIGKILL khong the bi bat hay bo qua — kernel giet ngay lap tuc)' },
    ],
    hints: [
      'Có nhiều loại tín hiệu; nên thử "lịch sự" trước khi dùng vũ lực.',
      'Dùng `kill -l` để xem danh sách; `kill -15 <PID>` (SIGTERM) xin thoát êm.',
      'Nếu nó lì, `kill -9 <PID>` (SIGKILL) ép chết ngay; hoặc `pkill -9 tên_process`.',
    ],
    debrief: [
      'SIGTERM (15) là "đề nghị thoát" — tiến trình có thể bắt nó để lưu dữ liệu/đóng file rồi mới chết; đây là cách dừng SẠCH, nên thử trước.',
      'SIGKILL (9) không thể bị bắt hay bỏ qua, kernel giết tức thì — nhưng tiến trình không kịp dọn dẹp, dễ để lại file lock/dữ liệu hỏng.',
      'kill thực chất là "gửi tín hiệu", không chỉ để giết: SIGHUP reload config, SIGSTOP/SIGCONT tạm dừng/tiếp tục — hiểu rộng giúp điều khiển dịch vụ tinh tế.',
      'Phòng thủ/vận hành: ưu tiên SIGTERM trong script shutdown; chỉ -9 khi bất đắc dĩ, vì SIGKILL bừa bãi là nguồn của corrupt database.',
    ],
    terms: [
      { term: 'SIGTERM (15)', def: 'Tín hiệu đề nghị tiến trình tự thoát, có thể bị bắt để dọn dẹp.' },
      { term: 'SIGKILL (9)', def: 'Tín hiệu giết ngay, không thể bắt/bỏ qua, không kịp dọn dẹp.' },
      { term: 'pkill', def: 'Giết tiến trình theo tên thay vì PID.' },
      { term: 'kill -l', def: 'Liệt kê toàn bộ tín hiệu và số hiệu tương ứng.' },
    ],
    initialFilesystem: fsC2M5,
  },
  {
    id: 6,
    chapterId: 2,
    title: 'Job nền bất tử',
    story:
      'Mày chạy một tác vụ dài, nhưng đóng SSH là nó chết theo. Phải biết cách đẩy job xuống nền, quản lý chúng, và làm cho nó sống sót kể cả khi mày logout.',
    steps: [
      { id: 'bg_amp', description: 'Chạy một tác vụ ở nền với & rồi liệt kê job', match: /&\s*$|^jobs\b/, output: '[1] 20451\n[1]+  Running   ./long-task.sh &' },
      { id: 'nohup', description: 'Chạy bất tử qua nohup để sống sót khi logout', match: /^nohup\b/, output: 'nohup: ignoring input and appending output to "nohup.out"   # tach khoi terminal, mien nhiem SIGHUP' },
      { id: 'disown', description: 'Gỡ job khỏi shell để không bị giết khi đóng terminal (disown)', match: /^disown\b/, output: '(job da duoc go khoi bang job cua shell — dong terminal khong con gui SIGHUP toi no)' },
    ],
    hints: [
      'Thêm & để đẩy job xuống nền; nhưng đóng terminal vẫn có thể giết nó qua SIGHUP.',
      'Dùng `./script.sh &` rồi `jobs` để xem; `nohup ./script.sh &` để miễn nhiễm logout.',
      'Hoặc chạy bình thường rồi `disown` để gỡ job khỏi shell, không bị giết khi đóng terminal.',
    ],
    debrief: [
      '& đẩy lệnh xuống chạy nền nhưng job vẫn thuộc về shell hiện tại; jobs/fg/bg quản lý chúng.',
      'Khi đóng terminal, shell gửi SIGHUP cho các job con — đó là lý do task nền "tự nhiên chết" sau khi logout.',
      'nohup (bỏ qua SIGHUP) và disown (gỡ khỏi bảng job) là hai cách giữ tiến trình sống; attacker dùng đúng kỹ thuật này để duy trì backdoor sau khi rớt session.',
      'Phòng thủ: với dịch vụ thật nên dùng systemd unit thay vì nohup — có giám sát, auto-restart, log; nohup/disown chỉ hợp cho tác vụ tạm.',
    ],
    terms: [
      { term: '& (ampersand)', def: 'Đẩy lệnh xuống chạy ở nền, trả lại prompt ngay.' },
      { term: 'jobs / fg / bg', def: 'Liệt kê job nền, kéo lên foreground, hoặc cho chạy tiếp ở nền.' },
      { term: 'nohup', def: 'Chạy lệnh miễn nhiễm SIGHUP để sống sót khi đóng terminal.' },
      { term: 'SIGHUP', def: 'Tín hiệu "hang up" gửi tới tiến trình khi terminal đóng.' },
    ],
    initialFilesystem: fsC2M6,
  },
  {
    id: 7,
    chapterId: 2,
    title: 'Ưu tiên CPU',
    story:
      'Một job backup ngốn hết CPU làm web chậm rì. Mày không muốn giết nó, chỉ muốn hạ độ ưu tiên để nó nhường tài nguyên cho việc quan trọng hơn.',
    steps: [
      { id: 'nice_start', description: 'Khởi chạy tác vụ với độ ưu tiên thấp (nice)', match: /^nice\b/, output: '(khoi chay voi niceness +10 — tien trinh "nhuong" CPU, cang nice cao cang it duoc uu tien)' },
      { id: 'renice', description: 'Hạ ưu tiên một tiến trình đang chạy (renice)', match: /^renice\b/, output: '20451 (process ID) old priority 0, new priority 15   # da ha uu tien, scheduler cap it CPU hon' },
      { id: 'ps_ni', description: 'Kiểm tra lại cột niceness của tiến trình (ps -o ni)', match: /^ps\s+.*-o\s+.*ni\b|^ps\s+.*ni,/, output: '  PID  NI COMMAND\n20451  15 backup.sh\n  902   0 mysqld' },
    ],
    hints: [
      'Niceness từ -20 (ưu tiên cao nhất) tới +19 (thấp nhất); số càng cao càng "nhường".',
      'Dùng `nice -n 10 ./backup.sh` để chạy với ưu tiên thấp; `renice 15 -p <PID>` để hạ tiến trình đang chạy.',
      'Kiểm tra bằng `ps -o pid,ni,comm -p <PID>` để thấy cột NI (niceness) đã đổi.',
    ],
    debrief: [
      'Niceness điều khiển độ ưu tiên CPU: -20 là tham lam nhất, +19 là nhường nhất; user thường chỉ tăng được nice (nhường), giảm cần root.',
      'renice chỉnh ưu tiên tiến trình ĐANG chạy mà không cần restart — cứu cánh khi một job lỡ ngốn CPU mà không thể kill.',
      'Đây là cân bằng tài nguyên chứ không phải giới hạn cứng: nice chỉ ảnh hưởng tranh chấp CPU, không giới hạn RAM/IO (đó là việc của cgroups).',
      'Phòng thủ/vận hành: chạy batch/backup với nice cao để không bóp nghẹt dịch vụ tương tác; với cô lập thật sự (multi-tenant) dùng cgroups/systemd slice.',
    ],
    terms: [
      { term: 'niceness', def: 'Giá trị -20..+19 quyết định độ ưu tiên CPU; cao = nhường.' },
      { term: 'nice', def: 'Khởi chạy lệnh mới với một mức niceness định sẵn.' },
      { term: 'renice', def: 'Đổi niceness của một tiến trình đang chạy theo PID.' },
      { term: 'ps -o ni', def: 'Hiển thị cột niceness của tiến trình khi liệt kê.' },
    ],
    initialFilesystem: fsC2M7,
  },
  {
    id: 8,
    chapterId: 2,
    title: 'Ngốn đĩa & RAM',
    story:
      'Server báo "No space left on device" lúc nửa đêm. Mày phải tìm ra phân vùng nào đầy, thư mục nào phình to, RAM còn bao nhiêu, và file nào đang bị giữ mở.',
    steps: [
      { id: 'df', description: 'Xem dung lượng các phân vùng (df -h)', match: /^df\s+.*-h\b|^df\s+-h/, output: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        49G   47G  1.8G  97% /\n/dev/sdb1       100G   12G   83G  13% /data\ntmpfs           3.9G     0  3.9G   0% /dev/shm' },
      { id: 'du_sort', description: 'Tìm thư mục phình to nhất trong / (du -sh | sort)', match: /\bdu\s+-sh?\b|du\s+.*sort/, output: '12G   /var/log\n8.1G  /var/lib/docker\n3.2G  /home\n900M  /usr' },
      { id: 'free', description: 'Kiểm tra RAM và swap còn lại (free -h)', match: /^free\s+.*-h\b|^free\s+-h/, output: '              total        used        free      shared\nMem:           7.7Gi       6.9Gi       210Mi       120Mi\nSwap:          2.0Gi       1.8Gi       190Mi' },
      { id: 'lsof', description: 'Tìm file lớn đang bị giữ mở dù đã xoá (lsof)', match: /^lsof\b/, output: 'COMMAND   PID USER   FD   SIZE/OFF   NAME\nmysqld    902 mysql  4u   9.8G       /var/log/mysql/slow.log (deleted)   <-- file da xoa nhung van chiem dia!' },
    ],
    hints: [
      'df xem phân vùng, du xem thư mục, free xem RAM, lsof xem file đang mở.',
      'Dùng `df -h` tìm phân vùng Use% cao; `du -sh /* | sort -rh` tìm thư mục to nhất.',
      'Gõ `free -h` xem RAM/swap; `lsof | grep deleted` tìm file đã xoá nhưng còn bị process giữ (vẫn chiếm đĩa).',
    ],
    debrief: [
      'df đo theo PHÂN VÙNG (filesystem), du đo theo THƯ MỤC — đầy đĩa mà du không khớp df thường do file bị xoá nhưng còn process giữ mở (chỉ free khi kill/restart).',
      'inode cạn cũng gây "No space" dù df còn dung lượng — nhiều file nhỏ (mail, session) ăn hết inode; kiểm bằng df -i.',
      'Swap đầy + RAM cạn = server bò; free -h cho thấy áp lực bộ nhớ trước khi OOM-killer ra tay giết tiến trình bừa bãi.',
      'Phòng thủ/vận hành: cảnh báo sớm khi Use% > 85%; xoay vòng log (logrotate); nhớ rằng xoá file đang mở không giải phóng đĩa cho tới khi process nhả nó.',
    ],
    terms: [
      { term: 'df vs du', def: 'df đo dung lượng phân vùng; du đo dung lượng thư mục/file.' },
      { term: 'inode', def: 'Cấu trúc lưu metadata file; cạn inode gây hết chỗ dù còn dung lượng.' },
      { term: 'swap', def: 'Vùng đĩa dùng thay RAM khi RAM cạn; đầy swap khiến máy chậm.' },
      { term: 'lsof', def: 'Liệt kê file đang mở; tìm file đã xoá mà process còn giữ.' },
    ],
    initialFilesystem: fsC2M8,
  },
  {
    id: 9,
    chapterId: 2,
    title: 'Thời gian thực quyết định tất cả',
    story:
      'Top chạy liên tục mà mắt không kịp theo, bên cạnh đó lại cần lọc và lưu snapshot của tiến trình. Mày phải chạy top 1 lần duy nhất, lưu output, rồi phân tích kỹ bằng grep.',
    steps: [
      { id: 'top_batch', description: 'Chạy top chỉ 1 iteration rồi thoát để dễ phân tích (-b -n 1)', match: /^top\s+.*-b\b.*-n\s+1|^top\s+.*-n\s+1.*-b/, output: 'top - 12:00:00 up 10 days,  3:42,  1 user,  load average: 0.82, 0.75, 0.71\nTasks: 120 total,   1 running, 119 sleeping,   0 stopped,   0 zombie\n%Cpu(s):  5.8 us,  2.3 sy,  0.0 ni, 90.5 id,  1.4 wa,  0.0 hi,  0.0 si,  0.0 st\nMem :   7872.6 total,  6123.4 used,  1749.2 free,   412.1 buffers\nSwap:   2048.0 total,   984.5 used,  1063.5 free,  2567.8 cached' },
      { id: 'top_filter', description: 'Lưu output top vào file rồi grep để tìm process cao hơn 5% CPU', match: /^top\s+.*-b\b.*-n\s+1.*>.*\S+|>.*\S+.*top\s+-b/, output: '(snapshot top đã lưu vào file)' },
      { id: 'grep_cpu', description: 'Dùng grep lọc những dòng có %CPU cao trên file snapshot', match: /^grep\b.*[5-9][0-9]|^grep\b.*%CPU/, output: 'www-data  1455  15.2  2.0 412000 80000 S    12:00   0:45 /usr/bin/php-fpm\nmysql     902   8.1 18.4 1820000 740000 S 12:00   1:22 /usr/sbin/mysqld' },
    ],
    hints: [
      'Top chạy liên tục, nhưng cần -b (batch) và -n 1 để chạy 1 lần rồi thoát để lưu.',
      'Gõ `top -b -n 1 > top_snapshot.txt`, rồi `grep -E "[0-9]{2}\\.[0-9]" top_snapshot.txt` để lọc dòng có tài nguyên cao.',
      'Hoặc `top -b -n 1 | grep -E "^(root|www-data|mysql)" > high_cpu.txt` để lưu ngay các process cao.',
    ],
    debrief: [
      'top -b (batch) + -n 1 (1 iteration) = snapshot trực tuyến thay vì chế độ tương tác — dễ dàng combine với pipe/redirect.',
      'Pipe |  top với grep để lọc ngay là mẹo hay — lưu kết quả debug trực tiếp vào file thay vì soi tay từng dòng.',
      'Bộ kỹ năng "chạy tool một lần + save + phân tích" là nền tảng của automation logging và monitoring — không thể ngồi soi top 24/7.',
      'Phòng thủ/vận hành: các hệ thống monitoring (prometheus, datadog) làm chính xác việc này tự động — capture snapshot định kỳ để lưu lịch sử tài nguyên.',
    ],
    terms: [
      { term: 'top -b', def: 'Chạy top ở batch mode (không tương tác), hợp lệ với pipe.' },
      { term: 'top -n 1', def: 'Chạy top chỉ 1 lần rồi thoát thay vì liên tục.' },
      { term: 'snapshot', def: 'Ảnh chụp tức thời của trạng thái; thường dùng cho monitoring.' },
      { term: 'batch mode', def: 'Chế độ chạy không cần tương tác với người dùng, hợp output tới pipe/file.' },
    ],
    initialFilesystem: fsC2M9,
  },
  {
    id: 10,
    chapterId: 2,
    title: 'Quản lý service lồng nhau',
    story:
      'Deploy app phụ thuộc vào database. Cần restart database trước, chờ nó sẵn sàng, rồi restart app — nếu thứ tự sai là lỗi. Mày phải biết cách check chi tiết và restart theo đúng trình tự.',
    steps: [
      { id: 'systemctl_all', description: 'Liệt kê tất cả unit được bật/tắt (systemctl list-units)', match: /^systemctl\s+list-units\b|^systemctl\b.*--all/, output: 'UNIT                        LOAD   ACTIVE SUB       DESCRIPTION\napache2.service            loaded active running   Apache HTTP Server\nmysql.service              loaded active running   MySQL\n...\nLOAD   = Reflects whether the unit definition was properly loaded.\nACTIVE = The high-level unit activation state, i.e. generalization of SUB.' },
      { id: 'check_deps', description: 'Kiểm tra service app phụ thuộc mysql (systemctl status kèm -l để thấy chi tiết)', match: /^systemctl\s+status\s+\S+\s+-l|^systemctl\s+show.*mysql|^systemctl\s+cat\s+\S+\.service/, output: '[Unit]\nDescription=App Service\nAfter=mysql.service     <-- app chỉ khởi động AFTER mysql sẵn sàng\nRequires=mysql.service <-- app phụ thuộc mysql' },
      { id: 'restart_order', description: 'Restart mysql trước, chờ nó active, rồi restart app', match: /^systemctl\s+restart\s+mysql.*&&.*systemctl\s+restart\s+app|^systemctl\s+restart\s+mysql/, output: 'mysql: restarted and active (running)' },
    ],
    hints: [
      'Service có thể phụ thuộc lẫn nhau; cần xem kỹ thứ tự Before/After trong unit file.',
      'Dùng `systemctl list-units --all` để thấy tất cả service; `systemctl cat mysql.service` để đọc unit file chi tiết.',
      'Restart theo đúng thứ tự: `systemctl restart mysql && systemctl restart app` để app chỉ khởi động khi mysql đã sẵn sàng.',
    ],
    debrief: [
      'Unit file systemd chứa [Unit] section với Before/After, Requires/Wants — quy định thứ tự khởi động và phụ thuộc.',
      'Khởi động sai thứ tự dễ gây race condition: app start trước database → lỗi kết nối → crash — restart lại cũng vô ích.',
      'Điều tra service lỗi bắt đầu: status → cat unit file → xem dependency → fix dependency hoặc restart theo thứ tự.',
      'Phòng thủ/vận hành: orchestration tool (docker-compose, kubernetes) xử lý việc này tự động — startup probe + readiness probe + dependency order.',
    ],
    terms: [
      { term: 'systemctl list-units', def: 'Liệt kê toàn bộ unit systemd hiện tại.' },
      { term: 'Before / After', def: 'Quy định thứ tự khởi động giữa các unit trong systemd.' },
      { term: 'Requires', def: 'Nếu dependency fail thì unit này cũng fail.' },
      { term: 'Wants', def: 'Unit khởi động sau dependency, nhưng không fail nếu dependency fail.' },
    ],
    initialFilesystem: fsC2M10,
  },
  {
    id: 11,
    chapterId: 2,
    title: 'Cấu hình môi trường toàn cầu',
    story:
      'Script app cần biết con đường tới binary, cần biết port mở, cần biết API key. Mày phải set biến môi trường toàn cầu qua .bashrc và export, để mỗi lần login là biến đó có sẵn.',
    steps: [
      { id: 'check_env', description: 'Xem các biến môi trường hiện tại (env hoặc printenv)', match: /^(env|printenv)\b/, output: 'USER=hacker\nHOME=/home/hacker\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin\nLANG=en_US.UTF-8\nSHELL=/bin/bash' },
      { id: 'export_new', description: 'Export một biến mới vào shell hiện tại (export VAR=value)', match: /^export\s+\w+\s*=\s*\S+/, output: '(biến được export, chỉ tồn tại trong shell hiện tại, con mất khi thoát)' },
      { id: 'bashrc_edit', description: 'Thêm export vào .bashrc để biến tồn tại luôn lúc login', match: /^(cat|echo|nano|vim|vi)\s+.*\.bashrc|>>.*\.bashrc/, output: 'export APP_PORT=3000\nexport API_KEY=abc123xyz\n(thêm vào ~/.bashrc để luôn có khi shell mới khởi động)' },
      { id: 'reload', description: 'Reload .bashrc để áp dụng thay đổi (source ~/.bashrc)', match: /^source\s+.*\.bashrc|^\.\s+\S*\.bashrc/, output: '(biến từ .bashrc giờ được load vào shell hiện tại)' },
    ],
    hints: [
      'env/printenv xem biến hiện tại; export giữ biến ở shell hiện tại; ~/.bashrc giữ nó lâu dài.',
      'Gõ `export MY_VAR=hello` rồi `echo $MY_VAR` để test; rồi `echo \'export MY_VAR=hello\' >> ~/.bashrc` để lưu vĩnh viễn.',
      'Sau khi sửa .bashrc, gõ `source ~/.bashrc` hoặc mở shell mới để load; test bằng `echo $MY_VAR`.',
    ],
    debrief: [
      'export làm biến có sẵn cho các process con; biến trong shell shell cha không thấy biến con tạo ra — cây tiến trình di truyền môi trường từ trên xuống.',
      '.bashrc chạy mỗi khi interactive shell mở — nơi chuẩn để set up PATH, alias, function cho user.',
      '/etc/environment là global (mọi shell, mọi user), .bashrc là per-user per-shell — hiểu sự khác biệt tránh ngộ nhận khi debug "biến sao không tìm thấy".',
      'Phòng thủ: biến bí mật (API key, password) trong .bashrc là lỗ hổng nếu user khác read được file; dùng secret manager thực tế.',
    ],
    terms: [
      { term: 'export', def: 'Công bố biến môi trường để các process con có thể truy cập.' },
      { term: 'env / printenv', def: 'Liệt kê toàn bộ biến môi trường hiện tại.' },
      { term: '.bashrc', def: 'File cấu hình bash chạy mỗi khi interactive shell khởi động.' },
      { term: 'source / .', def: 'Chạy file shell để load cấu hình/biến vào shell hiện tại.' },
    ],
    initialFilesystem: fsC2M11,
  },
  {
    id: 12,
    chapterId: 2,
    title: 'Cron: lịch sinh tử',
    story:
      'Backup phải chạy mỗi giờ, nhưng admin quên setup. Khôi phục dữ liệu bằng tay quá chậm. Mày phải viết cron job chạy script backup.sh mỗi giờ, kiểm tra log để đảm bảo nó chạy.',
    steps: [
      { id: 'crontab_list', description: 'Liệt kê các cron job hiện tại (crontab -l)', match: /^crontab\s+-l\b/, output: '# m h  dom mon dow   command\n0 2 * * * /opt/backup.sh   # chạy lúc 2h sáng mỗi ngày\n*/15 * * * * /usr/bin/check-health.sh  # chạy mỗi 15 phút' },
      { id: 'crontab_add', description: 'Thêm cron job mỗi giờ (*/60 hoặc 0 * * * *)', match: /^(crontab\s+-e|echo.*\|.*crontab|crontab\s+.*-i)/, output: 'crontab: installing new crontab' },
      { id: 'verify_cron', description: 'Kiểm tra /var/log/syslog hoặc /var/log/cron để thấy cron đã chạy (grep CRON)', match: /^grep\b.*CRON.*\/var\/log\/(syslog|cron)/, output: 'Jun 25 13:00:01 server CRON[1234]: (root) CMD (/opt/backup.sh)\nJun 25 14:00:01 server CRON[1245]: (root) CMD (/opt/backup.sh)' },
    ],
    hints: [
      'Cron syntax: m h dom mon dow command — phút giờ ngày tháng thứ mệnh lệnh.',
      'Dùng `crontab -l` để liệt kê; `crontab -e` để chỉnh sửa; `0 * * * *` = mỗi giờ lúc :00 phút.',
      'Kiểm tra bằng `grep CRON /var/log/syslog` hoặc `tail -f /var/log/cron` để thấy cron chạy hay không.',
    ],
    debrief: [
      'Cron quy định bằng 5 trường: minute (0-59), hour (0-23), day (1-31), month (1-12), dow (0-6 = Sun-Sat); */N = mỗi N lần.',
      'Cron không cho biết kết quả — output mặc định email cho user, nhưng thường không ai soi — luôn ghi output ra file để debug.',
      'Cron bị mnemonic (quên cron chạy) vì nó chạy im lặng ở background — kiểm tra log hoặc output file sau cron để đảm bảo nó chạy đúng.',
      'Phòng thủ/vận hành: systemd.timer là thay thế hiện đại cho cron, log tốt hơn — nhưng cron vẫn phổ biến trên legacy system.',
    ],
    terms: [
      { term: 'crontab -l', def: 'Liệt kê các cron job của user hiện tại.' },
      { term: 'crontab -e', def: 'Mở editor để thêm/sửa/xoá cron job.' },
      { term: '*/N', def: 'Chạy cứ mỗi N khoảng thời gian, ví dụ */15 = mỗi 15 phút.' },
      { term: 'CRON log', def: 'Hệ thống ghi lại khi cron chạy vào /var/log/syslog hoặc /var/log/cron.' },
    ],
    initialFilesystem: fsC2M12,
  },
  {
    id: 13,
    chapterId: 2,
    title: 'Trace file mở: điều tra lỗ hổng quản lý',
    story:
      'App lỗi "Too many open files", nhưng dev nói code không mở file đâu. Maye phải dùng lsof để xem process nào mở file/socket quá nhiều, có file nào ghost (đã xoá nhưng còn bị giữ).',
    steps: [
      { id: 'lsof_count', description: 'Đếm bao nhiêu file process nào đang mở (lsof -p <PID> | wc -l)', match: /^lsof\s+-p\s+\d+|lsof.*wc\s+-l/, output: '243   # process 1234 mở 243 file descriptors — quá nhiều, có leak!' },
      { id: 'lsof_deleted', description: 'Tìm file đã xoá nhưng process vẫn giữ mở (lsof | grep deleted)', match: /^lsof\b.*grep.*deleted|lsof\b.*(deleted|REG)/, output: 'java      1234 root  123u   REG  8,1  5242880 4567890 /var/log/old.log (deleted)  <- still takes 5MB on disk!' },
      { id: 'lsof_socket', description: 'Xem toàn bộ socket/connection mạng của process (lsof -i)', match: /^lsof\s+-i\b|^lsof\s+-p\s+\d+\s+-a\s+-i/, output: 'nginx     1455 root  51u  IPv4 123456      0t0  TCP *:80 (LISTEN)\nphp-fpm   1500 www-data  42u IPv4 234567 0t0  TCP 127.0.0.1:9000 (ESTABLISHED)' },
    ],
    hints: [
      'Mỗi file, socket, pipe... đều là FD (file descriptor); limit mặc định thường là 1024, vượt là lỗi "Too many open files".',
      'Dùng `lsof -p <PID>` để xem FD của process; `lsof | grep deleted` để tìm file ghost chiếm disk.',
      'Gõ `lsof -i` để thấy tất cả socket/connection, `lsof -i :80` để thấy ai nghe port 80.',
    ],
    debrief: [
      'FD (file descriptor) bao gồm file thật, socket, pipe, directory file — mỗi thứ đều có số định danh và tài nguyên kernel.',
      'File đã xoá nhưng process giữ mở: filesystem xoá entry directory nhưng inode vẫn tồn tại nếu process giữ open → chỉ free khi close.',
      'Leak FD: app mở file/socket nhưng quên close, theo đó FD dần tăng tới limit → crash "Too many open files" — lsof là nhân chứng.',
      'Phòng thủ: kiểm tra ulimit -n (FD limit) và monitor FD count dùng lsof định kỳ; fix leak bằng code review và proper close().',
    ],
    terms: [
      { term: 'lsof', def: 'Liệt kê file/socket/pipe đang mở bởi mỗi process.' },
      { term: 'FD (file descriptor)', def: 'Số định danh 0-1023 (mặc định) cho mỗi file/socket/pipe mở.' },
      { term: 'deleted file', def: 'File đã xoá khỏi filesystem nhưng process vẫn giữ open — chiếm disk tới khi close.' },
      { term: 'ulimit -n', def: 'Giới hạn số FD tối đa per process; limit này gây lỗi "Too many open files".' },
    ],
    initialFilesystem: fsC2M13,
  },
  {
    id: 14,
    chapterId: 2,
    title: 'Kill với sự tế nhị',
    story:
      'Process dùng database, kill ngay là dữ liệu hỏng. Mày phải biết tín hiệu SIGTERM để cho nó dọn dẹp, chờ một chút, rồi mới SIGKILL nếu nó lì. Viết một script auto-graceful-kill.',
    steps: [
      { id: 'find_proc', description: 'Tìm process theo tên (pgrep hoặc ps grep)', match: /^(pgrep|ps\b.*grep)\s+\S+/, output: '1234   # PID của app.jar' },
      { id: 'sigterm', description: 'Gửi SIGTERM (tín hiệu nhân đạo) và chờ nó tự thoát (kill -TERM)', match: /^kill\s+(-TERM|-15)\s+\d+/, output: '(app.jar nhận SIGTERM, dọn dẹp kết nối database rồi thoát)' },
      { id: 'wait_check', description: 'Chờ 5 giây rồi kiểm tra process còn sống hay không (ps -p)', match: /^sleep\s+[0-9]+\s*&&.*ps\s+-p|^ps\s+-p\s+\d+/, output: '(nếu process biến mất, kill thành công; nếu vẫn còn -> chuyển sang SIGKILL)' },
      { id: 'sigkill', description: 'Nếu SIGTERM không phát huy, ép chết bằng SIGKILL (kill -9)', match: /^kill\s+(-9|-KILL)\s+\d+/, output: '[1]-  Killed    (SIGKILL gửi tới, process chết ngay, không kịp dọn dẹp)' },
    ],
    hints: [
      'Cách lịch sự: SIGTERM (15) trước, chờ vài giây, rồi SIGKILL (9) nếu vẫn còn.',
      'Dùng `pgrep app` để lấy PID; `kill -TERM $(pgrep app)` gửi SIGTERM; chờ; `kill -9 $(pgrep app)` nếu còn.',
      'Script: `kill -TERM $PID && sleep 5 && kill -9 $PID 2>/dev/null` (nếu -9 thất bại, process đã chết là bình thường).',
    ],
    debrief: [
      'SIGTERM cho phép process bắt tín hiệu để dọn dẹp (flush buffer, close connection); SIGKILL kernel giết liền, không kịp dọn — dễ để lại lock.',
      'Graceful shutdown: SIGTERM + timeout là chuẩn trong systemd unit, docker, kubernetes — ưu tiên tính toàn vẹn dữ liệu.',
      'Kill ngay SIGKILL thường từ admin vội hay bad script — đó là nguồn của "zombie process", file lock không giải phóng, deadlock.',
      'Phòng thủ: viết signal handler trong app để respond SIGTERM thích hợp (không response = 300s timeout rồi SIGKILL).',
    ],
    terms: [
      { term: 'SIGTERM', def: 'Tín hiệu đề nghị thoát, có thể bắt để dọn dẹp trước khi chết.' },
      { term: 'SIGKILL', def: 'Tín hiệu giết ngay, không thể bắt, không kịp dọn dẹp.' },
      { term: 'graceful shutdown', def: 'Quá trình thoát sạch sẽ với dọn dẹp tài nguyên trước.' },
      { term: 'zombie process', def: 'Process con đã chết nhưng process cha chưa harvest (reap) nó khỏi bảng tiến trình.' },
    ],
    initialFilesystem: fsC2M14,
  },
  {
    id: 15,
    chapterId: 2,
    title: 'Ghi nhật ký đắm đuối',
    story:
      'Cron backup chạy bao giờ cũng im lặng, không biết thành công hay thất bại. Mày phải chỉnh sửa systemd service để ghi output vào journal, và dùng journalctl để xem lịch sử chạy.',
    steps: [
      { id: 'systemd_exec', description: 'Xem ExecStart trong systemd unit (systemctl cat service_name)', match: /^systemctl\s+cat\s+\S+|^cat\s+\/etc\/systemd.*\.service/, output: '[Unit]\nDescription=Backup Service\n[Service]\nExecStart=/opt/backup.sh\nType=oneshot\nStandardOutput=journal   <-- log vao journal thay vi dev/null' },
      { id: 'journalctl_unit', description: 'Xem log service trong journal (journalctl -u unit_name)', match: /^journalctl\s+-u\s+\S+|^journalctl\s+-n\s+\d+\s+-u/, output: 'Jun 25 02:00:01 server systemd[1]: Starting Backup Service...\nJun 25 02:00:25 server backup.sh[1234]: Backup started\nJun 25 02:00:50 server backup.sh[1234]: Backup completed successfully' },
      { id: 'journalctl_follow', description: 'Xem log real-time service (journalctl -u -f)', match: /^journalctl\s+.*-f\b.*-u|^journalctl\s+-u.*-f/, output: '(theo dõi log unit real-time, tính năng tương tự tail -f)' },
    ],
    hints: [
      'StandardOutput=journal trong systemd unit là cách lưu log — tốt hơn output file riêng.',
      'Dùng `systemctl cat backup.service` để xem unit; `journalctl -u backup` để xem log; `journalctl -u backup -n 20` để xem 20 dòng mới nhất.',
      'Gõ `journalctl -u backup.service -f` để theo dõi log real-time khi service chạy.',
    ],
    debrief: [
      'journald là service logging tập trung của systemd — binary format, structured data, timestamp chính xác, retention policy tự động.',
      'So với cron email hay output file, journalctl + systemd logging là hiện đại hơn — search, filter, follow đều nhanh trong trăm ngàn dòng log.',
      'StandardOutput=journal là "best practice" cho script chạy qua cron/systemd — không cần redirect > file, tự động lưu vào journal.',
      'Phòng thủ: nếu service mất kết nối database, journalctl sẽ ghi lại chi tiết → bước đầu debug — so với cron im lặng.',
    ],
    terms: [
      { term: 'journalctl', def: 'Công cụ xem log từ systemd journal.' },
      { term: 'StandardOutput=journal', def: 'Chỉ thị systemd ghi stdout của service vào journal thay vì devnull.' },
      { term: 'journalctl -u', def: 'Lọc log của một unit/service cụ thể.' },
      { term: 'journalctl -f', def: 'Theo dõi log real-time, cơ chế tương tự tail -f.' },
    ],
    initialFilesystem: fsC2M15,
  },
  {
    id: 16,
    chapterId: 2,
    title: 'Bài tốt nghiệp: điều tra sự cố multi-process',
    story:
      'Server lạ mắt. Một service ngốn RAM tới 90%, swap đầy, database chậm, FD leak. Mày phải dùng hết kỹ năng Chương 2: xác định process nào gây rối, sao và kiểm tra. Chạy lệnh, lưu report, rồi kill nó đúng cách.',
    steps: [
      { id: 'ps_sorted', description: 'Liệt kê process xếp theo RAM (ps -o pid,user,%mem,vsz,rss,comm --sort=-%mem | head -10)', match: /^ps\s+.*--sort.*-?%mem|^ps\s+.*--sort.*-?rss/, output: 'PID USER     %MEM   VSZ    RSS COMMAND\n1200 www-data 45.2 2048000 1843200 node\n1234 mysql    32.1 1600000 1310720 mysqld\n5000 root      8.5  512000 350000 backup.sh' },
      { id: 'lsof_pid', description: 'Kiểm tra FD của process nào chiếm RAM nhiều nhất (lsof -p <PID> | wc -l)', match: /^lsof\s+-p\s+\d+.*wc\s+-l|^lsof\s+-p\s+\d+/, output: '1245    # node (PID 1200) đang mở 1245 FD — gấp đôi limit thông thường!' },
      { id: 'free_check', description: 'Kiểm tra RAM, swap, disk còn lại (free -h && df -h)', match: /^free\s+-h.*&&.*df\s+-h|^(free|df)\s+.*-h/, output: 'Mem:  7.7Gi  7.2Gi  512Mi  (RAM cạn)\nSwap: 2.0Gi  1.9Gi  100Mi  (swap cạn)\n/dev/sda1: 49G 48G 1G (disk cạn)' },
      { id: 'graceful_kill', description: 'Gửi SIGTERM rồi chờ, nếu không chịu thì SIGKILL', match: /^kill\s+.*1200|pkill\s+node|kill\s+(-TERM|-15).*\d+/, output: '(node process nhận SIGTERM, nhưng không thoát — chuyển SIGKILL)' },
      { id: 'report', description: 'Lưu report điều tra vào file', match: /^(echo|cat|tee).*>.*report|>.*incident\.log/, output: '(đã lưu báo cáo sự cố vào incident.log để gửi sếp)' },
    ],
    hints: [
      'Bước 1 xác định RAM — ps xếp theo %mem. Bước 2 kiểm tra FD leak — lsof -p. Bước 3 xem độ khẩn cấp — free/df. Bước 4 kill đúng cách. Bước 5 lưu report.',
      'Chuỗi lệnh: `ps -o pid,user,%mem,vsz,rss,comm --sort=-%mem | head -5`, rồi `lsof -p <PID> | wc -l`, rồi `free -h; df -h`, rồi `kill -TERM $PID && sleep 5 && kill -9 $PID 2>/dev/null`.',
      'Lưu report: `echo "Incident: process $PID overuse RAM. Sent SIGTERM." > /tmp/incident.log` rồi `cat /tmp/incident.log`.',
    ],
    debrief: [
      'Điều tra sự cố server là một CHỈ HUY hợp lý các công cụ Chương 2 — không có một lệnh "thần kỳ" nào, mà là process có tư duy.',
      'Luôn ưu tiên SIGTERM (graceful) trước SIGKILL — đặc biệt với database/service có trạng thái — vội kill dễ dẫn tới corruption.',
      'FD leak là root cause kinh điển của "Chậm dần rồi crash" — lsof + code review là cách debug từ sớm.',
      'Phòng thủ thực tế: limit resource (ulimit, cgroups, systemd slice), alert sớm (monitoring), graceful shutdown (signal handler), log tốt (journald) — kết hợp làm nền tảng vận hành ổn định.',
    ],
    terms: [
      { term: 'RAM bloat', def: 'Tiến trình dần dần chiếm thêm RAM theo thời gian (memory leak).' },
      { term: 'FD leak', def: 'Tiến trình mở file/socket nhưng quên close, dần tới limit "Too many open files".' },
      { term: 'graceful shutdown', def: 'Quá trình thoát sạch sẽ: SIGTERM → cleanup → exit, thay vì bị SIGKILL bừa bãi.' },
      { term: 'post-mortem', def: 'Phân tích sau sự cố để tìm nguyên nhân root cause.' },
    ],
    initialFilesystem: fsC2M16,
  },
];
