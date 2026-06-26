// Mission MỚI (bổ sung) cho Chương 1 — bám syllabus chứng chỉ. Engine offline.
import fsC1M4 from '../filesystems/chapter1-mission4.js';
import fsC1M5 from '../filesystems/chapter1-mission5.js';
import fsC1M6 from '../filesystems/chapter1-mission6.js';
import fsC1M7 from '../filesystems/chapter1-mission7.js';
import fsC1M8 from '../filesystems/chapter1-mission8.js';
import fsC1M9 from '../filesystems/chapter1-mission9.js';
import fsC1M10 from '../filesystems/chapter1-mission10.js';
import fsC1M11 from '../filesystems/chapter1-mission11.js';
import fsC1M12 from '../filesystems/chapter1-mission12.js';
import fsC1M13 from '../filesystems/chapter1-mission13.js';
import fsC1M14 from '../filesystems/chapter1-mission14.js';
import fsC1M15 from '../filesystems/chapter1-mission15.js';
import fsC1M16 from '../filesystems/chapter1-mission16.js';

export default [
  {
    id: 4,
    chapterId: 1,
    title: 'Lạc trong cây thư mục',
    story:
      'Sếp quăng mày vào server lạ hoắc, không biết mình đang đứng ở đâu. Trước khi làm gì, mày phải biết mình ở đâu, nhìn được cả file ẩn lẫn quyền hạn, rồi lần xuống tận cấu hình nginx để đọc.',
    steps: [
      { id: 'pwd', description: 'Xác định mày đang đứng ở thư mục nào', match: /^pwd\b/ },
      { id: 'ls_la', description: 'Liệt kê /etc dạng dài (-la) để thấy cả file ẩn, quyền, owner', match: /^ls\s+.*-.*l.*\/etc|^ls\s+-l.*\s+\/etc/ },
      { id: 'cd_deep', description: 'Đi sâu vào /etc/nginx/conf.d', match: /^cd\s+\/etc\/nginx\/conf\.d\/?$/ },
      { id: 'cat_conf', description: 'Đọc file cấu hình app.conf trong đó', match: /^cat\s+.*app\.conf/ },
    ],
    hints: [
      'Đầu tiên phải biết mình đang ở đâu cái đã, rồi mới nhìn xung quanh.',
      'Dùng `pwd` để xem vị trí, rồi `ls -la /etc` để thấy file ẩn (bắt đầu bằng dấu chấm) và cột quyền.',
      'Gõ `cd /etc/nginx/conf.d` rồi `cat app.conf` để đọc cấu hình.',
    ],
    debrief: [
      'Path tuyệt đối (bắt đầu bằng /) luôn chỉ đúng một chỗ; path tương đối phụ thuộc cwd hiện tại — nhầm hai loại này là nguồn lỗi kinh điển khi viết script.',
      'ls -la phơi bày file ẩn (dotfiles như .bashrc, .ssh) và cột quyền/owner — pentester luôn liếc dotfiles vì credentials hay nằm đó.',
      'Khi nhảy vào một máy lạ, phản xạ đầu tiên của cả admin lẫn attacker là định vị: pwd, whoami, ls -la — biết mình đang ở đâu trước khi gõ lệnh phá.',
      'Phòng thủ: đừng để config nhạy cảm world-readable; soi kỹ dotfiles trong home của service account vì chúng thường bị bỏ quên.',
    ],
    terms: [
      { term: 'pwd', def: 'In ra đường dẫn thư mục hiện tại (print working directory).' },
      { term: 'ls -la', def: 'Liệt kê dạng dài, kèm file ẩn: hiện quyền, owner, kích thước.' },
      { term: 'path tuyệt đối', def: 'Đường dẫn bắt đầu từ gốc /, luôn chỉ đúng một vị trí.' },
      { term: 'path tương đối', def: 'Đường dẫn tính từ thư mục hiện tại, phụ thuộc vào cwd.' },
    ],
    initialFilesystem: fsC1M4,
  },
  {
    id: 5,
    chapterId: 1,
    title: 'Quyền hạn quyết định',
    story:
      'Script deploy.sh không chịu chạy, báo Permission denied. Trong khi đó secrets.env thì cả thế giới đọc được. Mày phải xem quyền hiện tại, cấp quyền chạy cho script, và khoá chặt file bí mật lại.',
    steps: [
      { id: 'ls_l', description: 'Xem quyền hiện tại của deploy.sh', match: /^ls\s+-l.*deploy\.sh|^ls\s+-l\b/ },
      { id: 'chmod_x', description: 'Cấp quyền thực thi cho deploy.sh', match: /^chmod\s+(\+x|[0-7]*[157][0-7]*)\s+.*deploy\.sh/, output: '-rwxr-xr-x 1 hacker hacker 142 deploy.sh   # execute bit set, giờ ./deploy.sh chạy được' },
      { id: 'chmod_600', description: 'Khoá secrets.env chỉ owner đọc/ghi (600)', match: /^chmod\s+0?600\s+.*secrets\.env/, output: '-rw------- 1 hacker hacker 48 secrets.env   # chỉ owner đọc/ghi, group & other mất sạch quyền' },
    ],
    hints: [
      'Trước khi đổi quyền, xem quyền đang là gì bằng long listing.',
      'Dùng `ls -l deploy.sh` để xem 10 ký tự quyền; rwx cho owner/group/other.',
      'Gõ `chmod +x deploy.sh` để cho chạy, và `chmod 600 secrets.env` để khoá chỉ owner đọc/ghi.',
    ],
    debrief: [
      'Quyền Unix gồm 3 nhóm — owner/group/other — mỗi nhóm có r(4) w(2) x(1); octal 600 = rw cho owner, không gì cho ai khác.',
      'Execute bit là thứ phân biệt file dữ liệu với chương trình chạy được; thiếu nó thì dù là script hợp lệ shell vẫn từ chối.',
      'File bí mật world-readable (644) là lỗ hổng leo thang đặc quyền cực phổ biến — attacker đọc secrets.env/.env để lấy DB password, API key.',
      'Phòng thủ: nguyên tắc least-privilege cho quyền file; secrets nên 600 và thuộc về đúng service account, không bao giờ 644/777.',
    ],
    terms: [
      { term: 'chmod', def: 'Đổi quyền truy cập của file/thư mục (change mode).' },
      { term: 'rwx / octal', def: 'read=4, write=2, execute=1; cộng lại thành số như 7=rwx, 6=rw.' },
      { term: 'owner/group/other', def: 'Ba nhóm quyền: chủ sở hữu, nhóm, và phần còn lại của thế giới.' },
      { term: 'execute bit', def: 'Cờ x cho phép file được chạy như một chương trình.' },
    ],
    initialFilesystem: fsC1M5,
  },
  {
    id: 6,
    chapterId: 1,
    title: 'Săn chuỗi trong đống rơm',
    story:
      'Log dài cả ngàn dòng, sếp cần biết ai đang brute-force SSH và app lỗi bao nhiêu lần. Mày phải dùng grep với đủ loại cờ để lọc đúng thứ cần, không đọc thủ công từng dòng.',
    steps: [
      { id: 'grep_fail', description: 'Tìm các dòng "Failed password" trong auth.log', match: /^grep\s+.*Failed.*auth\.log/ },
      { id: 'grep_count', description: 'Đếm số dòng ERROR trong app.log (grep -c)', match: /^grep\s+-c\b.*(ERROR).*app\.log/, output: '3' },
      { id: 'grep_recursive', description: 'Tìm đệ quy có số dòng (grep -rn) chuỗi "root" trong /var/log', match: /^grep\s+-[a-z]*r[a-z]*n?[a-z]*\b.*root.*\/var\/log|^grep\s+-rn?\b.*root/, output: '/var/log/auth.log:2:Jun 25 02:14:33 web sshd[1233]: Failed password for root from 203.0.113.7 port 40222\n/var/log/auth.log:3:Jun 25 02:14:35 web sshd[1233]: Failed password for root from 203.0.113.7 port 40224\n/var/log/auth.log:6:Jun 25 03:02:11 web sshd[1450]: Failed password for root from 198.51.100.9 port 33890' },
    ],
    hints: [
      'grep lọc dòng theo từ khoá; thêm cờ để đếm, để phân biệt hoa thường, để đệ quy.',
      'Dùng `grep "Failed password" /var/log/auth.log`; thêm `-c` để đếm số dòng thay vì in ra.',
      'Gõ `grep -c ERROR /var/log/app.log` để đếm, và `grep -rn root /var/log` để tìm đệ quy kèm số dòng.',
    ],
    debrief: [
      'grep là dao mổ của điều tra log: -i bỏ qua hoa/thường, -c đếm số dòng khớp, -E bật regex mở rộng, -rn quét đệ quy kèm số dòng.',
      'Một cụm Failed password dồn dập từ cùng một IP = dấu hiệu brute-force; đếm nhanh bằng -c cho biết mức độ nghiêm trọng.',
      'Blue team sống bằng grep trên log tập trung; red team cũng grep để moi password/đường dẫn nhạy cảm trong file chiếm được.',
      'Phòng thủ: chuyển log ra hệ thống tập trung (SIEM) để grep/alert tự động trên nhiều máy thay vì soi tay từng server.',
    ],
    terms: [
      { term: 'grep -i', def: 'Tìm không phân biệt hoa thường (case-insensitive).' },
      { term: 'grep -c', def: 'In ra số dòng khớp thay vì nội dung dòng.' },
      { term: 'grep -E', def: 'Bật regex mở rộng (extended), dùng | + ? mà không cần escape.' },
      { term: 'grep -rn', def: 'Quét đệ quy thư mục (-r) và in kèm số dòng (-n).' },
    ],
    initialFilesystem: fsC1M6,
  },
  {
    id: 7,
    chapterId: 1,
    title: 'Đường ống thần thánh',
    story:
      'Sức mạnh thật của shell là nối lệnh lại với nhau. Mày phải đếm số request, thống kê IP nào gọi nhiều nhất, rồi xuất một báo cáo ra file — tất cả bằng pipe và redirect.',
    steps: [
      { id: 'pipe_wc', description: 'Đếm tổng số dòng request bằng cat | wc -l', match: /\bwc\s+-l\b/, output: '7' },
      { id: 'pipe_uniq', description: 'Thống kê IP gọi nhiều nhất (cut | sort | uniq -c | sort -rn)', match: /uniq\s+-c|sort\s+-rn/, output: '      3 203.0.113.7\n      2 10.0.0.5\n      1 198.51.100.9\n      1 10.0.0.6' },
      { id: 'redirect_report', description: 'Lọc các dòng 403 và lưu ra report.txt (redirect >)', match: /^grep\s+.*403.*access\.log\s*>\s*\S+/ },
    ],
    hints: [
      'Pipe | lấy output lệnh trước làm input lệnh sau; redirect > ghi output ra file.',
      'Dùng `cat access.log | wc -l` để đếm dòng; ghép `cut`, `sort`, `uniq -c`, `sort -rn` để xếp hạng IP.',
      'Gõ `grep "403" /var/log/nginx/access.log > report.txt` để lưu các dòng bị chặn ra file riêng.',
    ],
    debrief: [
      'Triết lý Unix: mỗi công cụ làm một việc thật tốt, nối chúng bằng pipe để ghép thành sức mạnh lớn — wc đếm, sort xếp, uniq -c gộp đếm.',
      'Mẫu sort | uniq -c | sort -rn là "top N" kinh điển: tìm IP tấn công nhiều nhất, URL bị quét nhiều nhất, lỗi lặp nhiều nhất.',
      'Redirect > tạo/ghi đè file, >> nối thêm; đây là cách dựng báo cáo, lưu bằng chứng điều tra mà không cần mở editor.',
      'Phòng thủ/điều tra: kỹ năng pipe biến một đống log thô thành thông tin hành động được trong vài giây — nền tảng của threat hunting thủ công.',
    ],
    terms: [
      { term: 'pipe |', def: 'Đưa output của lệnh trái làm input cho lệnh phải.' },
      { term: 'wc -l', def: 'Đếm số dòng của input (word count, -l = lines).' },
      { term: 'sort | uniq -c', def: 'Sắp xếp rồi gộp dòng trùng và đếm số lần xuất hiện.' },
      { term: 'cut', def: 'Cắt lấy cột/trường theo ký tự phân tách (vd cut -d" " -f1).' },
    ],
    initialFilesystem: fsC1M7,
  },
  {
    id: 8,
    chapterId: 1,
    title: 'Phù thủy ký tự đại diện',
    story:
      'Thư mục logs lộn xộn đủ loại file. Thay vì gõ tên từng cái, mày phải dùng ký tự đại diện để chọn hàng loạt: tất cả .log, các report đánh số, rồi dọn rác.',
    steps: [
      { id: 'glob_star', description: 'Liệt kê tất cả file .log trong logs (ls *.log)', match: /^ls\s+.*\*\.log/, output: 'access.log  app.log  error.log  old.log.bak' },
      { id: 'glob_question', description: 'Liệt kê report đánh 2 số bằng ? (report-??.csv)', match: /^ls\s+.*report-\?\?\.csv/, output: 'report-01.csv  report-02.csv' },
      { id: 'glob_rm', description: 'Xoá file backup .bak bằng wildcard (rm *.bak)', match: /^rm\s+.*\*\.bak/, output: "removed 'old.log.bak'" },
    ],
    hints: [
      'Wildcard để khớp nhiều file: * khớp bất kỳ, ? khớp đúng 1 ký tự.',
      'Vào `cd logs` rồi `ls *.log` để thấy mọi file log; `ls report-??.csv` chỉ khớp report-01/02 (đúng 2 ký tự).',
      'Gõ `rm *.bak` để xoá hết file backup; nhớ `*` khớp nhiều file một lúc nên cẩn thận.',
    ],
    debrief: [
      'Glob được SHELL mở rộng trước khi lệnh chạy: `*` khớp bất kỳ chuỗi nào, `?` đúng một ký tự, `[abc]`/`{a,b}` khớp tập ký tự.',
      'report-??.csv chỉ khớp tên có đúng 2 ký tự ở chỗ ?? — nên report-final.csv bị loại, đây là cách lọc chính xác theo định dạng tên.',
      'rm với wildcard là con dao hai lưỡi: `rm *.bak` tiện, nhưng gõ nhầm `rm * .bak` (có dấu cách) xoá sạch thư mục — luôn `ls` trước khi `rm`.',
      'Phòng thủ: trong script production dùng đường dẫn tường minh thay vì glob mơ hồ; cân nhắc `rm -i` để xác nhận, tránh thảm hoạ xoá nhầm.',
    ],
    terms: [
      { term: '* (asterisk)', def: 'Khớp bất kỳ chuỗi ký tự nào, kể cả rỗng.' },
      { term: '? (question)', def: 'Khớp đúng một ký tự bất kỳ.' },
      { term: '[abc] / {a,b}', def: 'Khớp một ký tự trong tập, hoặc khai triển danh sách lựa chọn.' },
      { term: 'glob', def: 'Cơ chế shell mở rộng wildcard thành danh sách tên file thật.' },
    ],
    initialFilesystem: fsC1M8,
  },
  {
    id: 9,
    chapterId: 1,
    title: 'Redirect & exit code',
    story:
      'Lệnh không chỉ in ra màn hình — chúng có luồng lỗi riêng và một mã thoát cho biết thành bại. Mày phải tách lỗi khỏi kết quả, nuốt cảnh báo rác, và đọc exit code để biết lệnh trước có chạy ngon không.',
    steps: [
      { id: 'find_devnull', description: 'Tìm file .conf toàn hệ thống, nuốt lỗi permission (2>/dev/null)', match: /^find\s+\/.*-name\s+.*\.conf.*2>\s*\/dev\/null/, output: '/etc/app.conf\n/home/hacker/find-me.conf' },
      { id: 'redirect_stderr', description: 'Liệt kê thư mục không tồn tại, đẩy lỗi ra err.log (2>)', match: /^ls\s+\S+\s+2>\s*\S+/, output: '(stdout trống — thông báo lỗi đã được ghi vào err.log thay vì in ra màn hình)' },
      { id: 'exit_code', description: 'Đọc mã thoát của lệnh vừa rồi (echo $?)', match: /^echo\s+\$\?/, output: '2' },
    ],
    hints: [
      'Mỗi lệnh có 2 luồng: stdout (kết quả) và stderr (lỗi); và để lại một exit code 0=ok, khác 0=lỗi.',
      'Dùng `find / -name "*.conf" 2>/dev/null` để bỏ qua lỗi Permission denied; `ls /nope 2>err.log` đẩy lỗi vào file.',
      'Sau một lệnh, gõ `echo $?` để xem mã thoát; `ls /nope` thất bại trả về 2.',
    ],
    debrief: [
      'Linux tách stdout (fd 1) và stderr (fd 2): nhờ vậy mới redirect riêng từng luồng — `2>/dev/null` vứt lỗi, `2>&1` gộp lỗi vào output.',
      '`find / 2>/dev/null` là phản xạ kinh điển khi enumerate: bỏ rác Permission denied để chỉ còn kết quả hữu ích — kỹ thuật privesc hay dùng.',
      'Exit code $? là xương sống của scripting: `cmd && next` chạy tiếp khi thành công, `||` chạy khi thất bại; 0 = thành công theo quy ước Unix.',
      'Phòng thủ/automation: kiểm tra exit code thay vì giả định lệnh luôn chạy được — bỏ qua nó là nguồn của script "im lặng hỏng" trong production.',
    ],
    terms: [
      { term: 'stdout / stderr', def: 'Luồng kết quả (fd 1) và luồng lỗi (fd 2) tách biệt.' },
      { term: '2>/dev/null', def: 'Đẩy stderr vào hố đen, để màn hình chỉ còn kết quả.' },
      { term: '2>&1', def: 'Gộp stderr vào chung nơi stdout đang trỏ tới.' },
      { term: '$?', def: 'Biến chứa exit code của lệnh chạy ngay trước đó.' },
    ],
    initialFilesystem: fsC1M9,
  },
  {
    id: 10,
    chapterId: 1,
    title: 'Theo dõi log sống',
    story:
      'Mày đang đợi một request lỗi tái hiện. Không thể cứ cat đi cat lại — mày phải xem khúc đầu file cấu hình, rồi bám đuôi log production theo thời gian thực để bắt lỗi ngay khi nó xuất hiện.',
    steps: [
      { id: 'head', description: 'Xem 5 dòng đầu của app.conf (head -n 5)', match: /^head\s+.*app\.conf/, output: 'server { listen 80;\n  root /var/www;\n  index index.html;\n  access_log /var/log/app/access.log;\n  error_log /var/log/app/error.log;' },
      { id: 'tail_follow', description: 'Bám đuôi production.log theo thời gian thực (tail -f)', match: /^tail\s+-f\b.*production\.log/, output: '==> production.log <==\n12:00:01 GET /health 200\n12:00:04 GET /api/users 200\n12:00:07 POST /login 500   <- lỗi vừa xuất hiện (Ctrl+C để thoát)' },
      { id: 'less', description: 'Mở production.log bằng less để cuộn/tìm kiếm', match: /^less\b.*production\.log/, output: '(mở less: phím cách để cuộn, /500 để tìm, q để thoát)' },
    ],
    hints: [
      'cat nuốt cả file một lúc; có lệnh xem từng phần và lệnh bám đuôi realtime.',
      'Dùng `head -n 5 /etc/app.conf` xem đầu file; `tail -f production.log` để theo dõi dòng mới chảy vào.',
      'Gõ `tail -f /var/log/app/production.log` chờ dòng mới; mở `less production.log` rồi gõ `/500` để nhảy tới lỗi.',
    ],
    debrief: [
      'head/tail lấy mẫu nhanh hai đầu file mà không tải cả file vào RAM — sống còn với log nhiều GB.',
      'tail -f (follow) giữ file mở và in mỗi dòng mới ngay khi nó được ghi vào — cách chuẩn để soi sự cố đang diễn ra.',
      'less là pager không tải hết file: cuộn, tìm (/pattern), nhảy — hơn hẳn cat với file lớn.',
      'Thực chiến: kết hợp `tail -f ... | grep ERROR` để chỉ thấy dòng lỗi đang trôi qua giữa biển log.',
    ],
    terms: [
      { term: 'head -n', def: 'In N dòng đầu của file (mặc định 10).' },
      { term: 'tail -f', def: 'Bám đuôi file, in dòng mới theo thời gian thực (follow).' },
      { term: 'less', def: 'Pager cuộn/tìm kiếm file lớn mà không tải hết vào bộ nhớ.' },
      { term: 'pager', def: 'Chương trình hiển thị nội dung theo từng trang.' },
    ],
    initialFilesystem: fsC1M10,
  },
  {
    id: 11,
    chapterId: 1,
    title: 'Dựng khung dự án',
    story:
      'Mày phải dựng nhanh bộ khung cho một service mới: tạo cây thư mục lồng nhau, đẻ file rỗng giữ chỗ, và copy file config mẫu vào đúng vị trí — tất cả bằng tay trong terminal, không IDE.',
    steps: [
      { id: 'mkdir_p', description: 'Tạo cây thư mục project/src lồng nhau một phát (mkdir -p)', match: /^mkdir\s+-p\s+\S*project\/src/, output: '(đã tạo ~/project và ~/project/src cùng lúc nhờ -p)' },
      { id: 'touch', description: 'Tạo file rỗng giữ chỗ trong project (touch)', match: /^touch\s+\S*project\/\S+/, output: '(file rỗng được tạo; ls -l cho thấy kích thước 0)' },
      { id: 'cp', description: 'Copy config.example vào project thành file config', match: /^cp\s+\S*config\.example\s+\S*project\/\S+/, output: '(đã copy; bản gốc config.example vẫn còn nguyên)' },
    ],
    hints: [
      'mkdir thường lỗi nếu thư mục cha chưa có; có cờ tạo luôn cả cây.',
      'Dùng `mkdir -p ~/project/src`, `touch ~/project/src/main.js`, rồi `cp config.example ~/project/config`.',
      'Gõ `mkdir -p ~/project/src && touch ~/project/README.md && cp ~/config.example ~/project/config`.',
    ],
    debrief: [
      'mkdir -p tạo toàn bộ thư mục cha còn thiếu và không báo lỗi nếu đã tồn tại — an toàn để dùng trong script.',
      'touch tạo file rỗng (hoặc cập nhật mtime nếu file đã có) — hay dùng để giữ chỗ hoặc trigger rebuild.',
      'cp giữ nguyên bản gốc và tạo bản sao; khác mv là dời hẳn — nhầm hai cái này dễ mất dữ liệu.',
      'Thực chiến: dựng skeleton bằng vài lệnh nối bằng && nhanh hơn click chuột và lặp lại được trong script.',
    ],
    terms: [
      { term: 'mkdir -p', def: 'Tạo cả cây thư mục cha-con một lần, không lỗi nếu đã có.' },
      { term: 'touch', def: 'Tạo file rỗng hoặc cập nhật thời gian sửa của file.' },
      { term: 'cp', def: 'Copy file/thư mục, giữ nguyên bản gốc.' },
      { term: '&&', def: 'Chạy lệnh sau chỉ khi lệnh trước thành công.' },
    ],
    initialFilesystem: fsC1M11,
  },
  {
    id: 12,
    chapterId: 1,
    title: 'Dọn bãi chiến trường',
    story:
      'Thư mục work bừa bộn: file nháp cần đổi tên, đống log năm cũ cần gom vào một chỗ, file rác cần xoá. Mày phải dùng mv, mkdir và rm với wildcard để dọn gọn trong vài lệnh.',
    steps: [
      { id: 'rename', description: 'Đổi tên draft.txt thành report.txt (mv)', match: /^mv\s+\S*draft\.txt\s+\S*report\.txt/, output: '(đã đổi tên; draft.txt giờ là report.txt)' },
      { id: 'mkdir_move', description: 'Tạo thư mục archive rồi gom tất cả *.log vào đó', match: /^mv\s+\S*\*\.log\s+\S*archive/, output: 'access-2024.log  access-2025.log  error.log  -> đã chuyển vào archive/' },
      { id: 'remove', description: 'Xoá file report.txt nháp không cần nữa (rm)', match: /^rm\s+\S*report\.txt/, output: "removed 'report.txt'" },
    ],
    hints: [
      'mv vừa để đổi tên vừa để dời file; wildcard *.log gom mọi file đuôi .log.',
      'Dùng `mv draft.txt report.txt`, `mkdir archive && mv *.log archive/`, rồi `rm report.txt`.',
      'Trong ~/work: `mv draft.txt report.txt`, `mkdir -p archive`, `mv *.log archive/`, `rm report.txt`.',
    ],
    debrief: [
      'mv không có lệnh "rename" riêng trong Unix — đổi tên chính là dời file sang tên mới cùng thư mục.',
      'Wildcard mở rộng TRƯỚC khi lệnh chạy: `mv *.log archive/` được shell biến thành liệt kê từng file — hiểu điều này tránh bất ngờ.',
      'rm không có thùng rác: xoá là mất; `rm -i` hỏi xác nhận, `rm -r` xoá đệ quy cả thư mục — cẩn thận với wildcard.',
      'Thực chiến: gom/đổi tên hàng loạt bằng glob nhanh gấp bội thao tác tay, nhưng `rm -rf *` nhầm chỗ là thảm hoạ.',
    ],
    terms: [
      { term: 'mv', def: 'Dời hoặc đổi tên file/thư mục.' },
      { term: 'rm', def: 'Xoá file; rm -r xoá cả thư mục, không có thùng rác.' },
      { term: 'glob *.log', def: 'Shell mở rộng thành mọi file khớp trước khi lệnh chạy.' },
      { term: 'rm -i', def: 'Xoá có hỏi xác nhận từng file cho an toàn.' },
    ],
    initialFilesystem: fsC1M12,
  },
  {
    id: 13,
    chapterId: 1,
    title: 'Truy lùng theo dấu vết',
    story:
      'Server nghi bị cài webshell. Mày phải lùng file dựa trên đặc điểm: vừa bị sửa trong 24h, dung lượng bất thường, và chạy luôn một lệnh trên từng file tìm được để soi nhanh.',
    steps: [
      { id: 'find_name', description: 'Tìm mọi file .php trong /var/www', match: /^find\s+\/var\/www\b.*-name\s+.*\.php/, output: '/var/www/index.php\n/var/www/upload.php' },
      { id: 'find_mtime', description: 'Lọc file bị sửa trong 24 giờ qua (-mtime -1)', match: /^find\s+\S+.*-mtime\s+-1/, output: '/var/www/upload.php   (vừa sửa 2 giờ trước — đáng ngờ)' },
      { id: 'find_exec', description: 'Chạy ls -l trên từng file tìm được (-exec)', match: /^find\s+\S+.*-exec\b.*ls\b.*\{\}/, output: '-rw-r--r-- 1 www-data www-data 142 upload.php' },
    ],
    hints: [
      'find lọc được theo tên, theo thời gian sửa, theo kích thước — không chỉ theo tên.',
      'Dùng `find /var/www -name "*.php"`, thêm `-mtime -1` để lọc file mới sửa, `-size +1M` cho file to.',
      'Gõ `find /var/www -name "*.php" -mtime -1 -exec ls -l {} \\;` để vừa lọc vừa soi chi tiết.',
    ],
    debrief: [
      'find là dao đa năng để enumerate: -name, -mtime (ngày sửa), -size, -perm (quyền), -user — ghép lại lọc cực hẹp.',
      '-mtime -1 = sửa trong 1 ngày qua; số âm là "ít hơn", dương là "nhiều hơn" — bẫy cú pháp kinh điển của find.',
      '-exec ... {} \\; chạy một lệnh trên TỪNG kết quả ({} là placeholder) — biến find thành vòng lặp mini.',
      'Thực chiến: săn webshell/backdoor thường bắt đầu bằng find theo mtime gần đây và quyền bất thường.',
    ],
    terms: [
      { term: 'find -mtime -1', def: 'Lọc file được sửa trong vòng 1 ngày qua.' },
      { term: 'find -size +1M', def: 'Lọc file lớn hơn 1 MB.' },
      { term: 'find -exec {} \\;', def: 'Chạy một lệnh trên từng file tìm được; {} là tên file.' },
      { term: 'placeholder {}', def: 'Vị trí find thay bằng đường dẫn mỗi kết quả khi -exec.' },
    ],
    initialFilesystem: fsC1M13,
  },
  {
    id: 14,
    chapterId: 1,
    title: 'Ai gõ cửa nhiều nhất',
    story:
      'access.log đầy request. Mày phải bóc cột IP ra, đếm mỗi IP xuất hiện bao nhiêu lần, xếp từ cao xuống thấp, và chỉ lấy kẻ ồn ào nhất — tất cả bằng một đường ống.',
    steps: [
      { id: 'cut', description: 'Bóc cột IP (cột 1) khỏi access.log bằng cut', match: /^cut\s+-d.*-f\s*1?\b.*access\.log/, output: '203.0.113.7\n203.0.113.7\n10.0.0.5\n203.0.113.7\n198.51.100.9\n10.0.0.5\n203.0.113.7' },
      { id: 'count_sort', description: 'Đếm mỗi IP và xếp giảm dần (sort | uniq -c | sort -rn)', match: /uniq\s+-c\b.*sort\s+-rn|sort\b.*uniq\s+-c/, output: '      4 203.0.113.7\n      2 10.0.0.5\n      1 198.51.100.9' },
      { id: 'head', description: 'Chỉ lấy IP ồn nhất (head -n 1)', match: /head\s+-n?\s*1\b/, output: '      4 203.0.113.7   <- IP brute-force login nhiều nhất' },
    ],
    hints: [
      'Một đường ống nối nhiều lệnh: bóc cột -> đếm trùng -> xếp hạng -> cắt top.',
      'Dùng `cut -d" " -f1 access.log | sort | uniq -c | sort -rn | head -n 1`.',
      'uniq -c chỉ đếm dòng trùng LIỀN nhau nên phải sort trước; sort -rn xếp theo số giảm dần.',
    ],
    debrief: [
      'cut -d -f bóc cột theo dấu phân tách — công cụ nhanh nhất để tách trường trong log/CSV.',
      'uniq -c đếm dòng trùng nhưng chỉ khi chúng LIỀN kề, nên cặp `sort | uniq -c` luôn đi cùng nhau.',
      'sort -rn = reverse + numeric: xếp theo giá trị SỐ giảm dần (không phải so chuỗi "10" < "9").',
      'Thực chiến: pipeline `cut|sort|uniq -c|sort -rn|head` là phản xạ để tìm top IP/URL/lỗi khi điều tra.',
    ],
    terms: [
      { term: 'cut -d -f', def: 'Bóc cột theo dấu phân tách (-d) và số thứ tự trường (-f).' },
      { term: 'uniq -c', def: 'Đếm số lần lặp của các dòng giống nhau liền kề.' },
      { term: 'sort -rn', def: 'Sắp xếp theo giá trị số, giảm dần.' },
      { term: 'pipeline |', def: 'Nối stdout lệnh này vào stdin lệnh kế tiếp.' },
    ],
    initialFilesystem: fsC1M14,
  },
  {
    id: 15,
    chapterId: 1,
    title: 'Vừa xem vừa lưu',
    story:
      'Mày chạy một lệnh chẩn đoán và cần vừa thấy kết quả trên màn hình, vừa lưu vào file để gửi sếp — đồng thời gộp cả thông báo lỗi vào chung. Đây là lúc tee và gộp luồng lên ngôi.',
    steps: [
      { id: 'tee', description: 'In ra màn hình ĐỒNG THỜI lưu vào file bằng tee', match: /\|\s*tee\s+\S+/, output: '(kết quả hiện trên màn hình VÀ được ghi vào file cùng lúc)' },
      { id: 'append', description: 'Nối thêm một dòng vào cuối notes.txt (>>)', match: />>\s*\S*notes\.txt/, output: '(đã nối thêm vào cuối notes.txt, nội dung cũ còn nguyên)' },
      { id: 'combine', description: 'Chạy lệnh và gộp cả stderr vào file kết quả (2>&1)', match: />\s*\S+\s+2>&1|2>&1\s*\|/, output: '(cả stdout lẫn stderr giờ nằm chung một nơi)' },
    ],
    hints: [
      '> ghi đè và nuốt màn hình; có lệnh cho phép vừa hiện vừa ghi, và cách gộp luồng lỗi.',
      'Dùng `dmesg | tee boot.txt` để vừa xem vừa lưu; `echo "ghi chú" >> notes.txt` để nối thêm.',
      'Gộp lỗi vào output: `./check.sh > out.log 2>&1` — thứ tự 2>&1 phải đứng SAU > out.log.',
    ],
    debrief: [
      'tee tách dòng chảy: gửi đồng thời ra stdout (màn hình) VÀ vào file — khác với > chỉ ghi vào file.',
      '> ghi đè sạch file, >> nối thêm vào cuối — nhầm hai cái này là cách kinh điển xoá nhầm log.',
      '2>&1 nghĩa là "gửi stderr tới nơi stdout đang trỏ"; vị trí của nó quan trọng vì redirect áp dụng tuần tự trái sang phải.',
      'Thực chiến: `cmd 2>&1 | tee debug.log` là combo vàng để vừa theo dõi vừa lưu trọn cả lỗi lẫn kết quả.',
    ],
    terms: [
      { term: 'tee', def: 'Vừa in ra màn hình vừa ghi vào file cùng lúc.' },
      { term: '>>', def: 'Nối thêm vào cuối file, giữ nội dung cũ.' },
      { term: '2>&1', def: 'Gộp stderr vào chung nơi stdout đang trỏ tới.' },
      { term: 'file descriptor', def: 'Số định danh luồng: 0 stdin, 1 stdout, 2 stderr.' },
    ],
    initialFilesystem: fsC1M15,
  },
  {
    id: 16,
    chapterId: 1,
    title: 'Tổng hợp báo cáo sự cố',
    story:
      'Bài tốt nghiệp Chương 1. Đêm qua server bị dò mật khẩu. Mày phải lùng toàn bộ /var/log tìm các lần đăng nhập thất bại, bóc IP tấn công, xếp hạng kẻ tấn công nhiều nhất, lưu thành report.txt, rồi xác nhận báo cáo có dữ liệu.',
    steps: [
      { id: 'grep_r', description: 'Tìm đệ quy mọi dòng "Failed password" trong /var/log (grep -rn)', match: /^grep\s+-[a-z]*r[a-z]*\b.*Failed.*\/var\/log/, output: '/var/log/auth.log:1:Jun 25 02:14:33 web sshd[1233]: Failed password for root from 203.0.113.7\n/var/log/auth.log:2:Jun 25 02:14:35 web sshd[1233]: Failed password for root from 203.0.113.7\n/var/log/auth.log:4:Jun 25 03:02:11 web sshd[1450]: Failed password for root from 198.51.100.9' },
      { id: 'pipeline', description: 'Bóc IP, đếm và xếp hạng kẻ tấn công nhiều nhất', match: /grep\b.*Failed.*\|.*(uniq\s+-c|sort\s+-rn)/, output: '      2 203.0.113.7\n      1 198.51.100.9' },
      { id: 'save_report', description: 'Lưu kết quả xếp hạng vào report.txt (redirect >)', match: />\s*\S*report\.txt/, output: '(đã ghi bảng xếp hạng IP tấn công vào report.txt)' },
      { id: 'verify', description: 'Xác nhận report.txt có dữ liệu (cat hoặc wc -l)', match: /^(cat|wc\s+-l)\s+\S*report\.txt/, output: '2 report.txt   (báo cáo có 2 dòng — OK)' },
    ],
    hints: [
      'Ghép mọi thứ Chương 1: tìm đệ quy -> đường ống bóc/đếm/xếp -> lưu file -> kiểm tra.',
      'Dùng `grep -rn "Failed password" /var/log` rồi nối ống `| grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn`.',
      'Gõ `grep -rh "Failed password" /var/log | grep -oE "from [0-9.]+" | sort | uniq -c | sort -rn > ~/report.txt` rồi `cat ~/report.txt`.',
    ],
    debrief: [
      'Điều tra thật là một CHUỖI: thu thập (grep -r) -> biến đổi (pipeline) -> lưu (redirect) -> xác minh — đúng nhịp làm việc thực tế trên terminal.',
      'grep -r quét đệ quy cả cây thư mục, -n kèm số dòng, -h bỏ tên file khi chỉ cần nội dung để pipe tiếp.',
      'Redirect > tạo file kết quả cuối; luôn verify (cat/wc -l) thay vì tin lệnh đã chạy — kỷ luật chống "im lặng hỏng".',
      'Đây chính là bộ kỹ năng nền của blue team (phân tích log) lẫn red team (lọc chiến lợi phẩm) — thuần thục nó là qua được Chương 1.',
    ],
    terms: [
      { term: 'grep -rn', def: 'Tìm đệ quy trong thư mục, kèm số dòng.' },
      { term: 'grep -oE', def: 'Chỉ in phần khớp, dùng regex mở rộng — hữu ích để bóc IP.' },
      { term: 'redirect >', def: 'Ghi kết quả cuối ra file, ghi đè.' },
      { term: 'wc -l', def: 'Đếm số dòng — cách nhanh để xác nhận file có dữ liệu.' },
    ],
    initialFilesystem: fsC1M16,
  },
];
