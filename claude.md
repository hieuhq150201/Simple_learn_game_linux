# 🖥️ HACKER PATH — Lộ Trình Học Bảo Mật Thực Chiến

> Interactive terminal learning platform — Học Linux & Hacking bằng cách gõ lệnh thật, có AI hướng dẫn, hoàn toàn bằng tiếng Việt.

---

## 📐 Tổng Quan Dự Án

**Mục tiêu:** Người dùng đi từ zero → thành thạo terminal Linux và các kỹ năng bảo mật cơ bản thông qua hệ thống mission có story, terminal giả phản hồi thực tế, và AI giải thích từng bước.

**Tech Stack:**
- Frontend: React + Tailwind CSS
- AI Engine: Claude API (claude-sonnet-4-6)
- Terminal: Custom fake terminal component
- Storage: LocalStorage (progress, unlock status)

---

## 🗺️ Lộ Trình 8 Chương

### Chương 1 — Terminal Sinh Tồn
**Story:** Mày vừa được tuyển vào một startup bảo mật. Ngày đầu tiên, sếp quăng cho mày một cái SSH session vào server production đang có vấn đề. Không có GUI. Chỉ có terminal.

**Kỹ năng cần học:**
- Điều hướng: `pwd`, `ls`, `ls -la`, `cd`, `cd ..`, `cd ~`
- Xem file: `cat`, `less`, `more`, `head`, `tail`, `tail -f`
- Tìm kiếm: `grep`, `grep -r`, `find`, `locate`
- Thao tác file: `cp`, `mv`, `rm`, `mkdir`, `touch`, `chmod`
- Pipe & redirect: `|`, `>`, `>>`, `<`, `2>&1`
- Wildcard: `*`, `?`, `[abc]`

**Missions:**
1. Server báo lỗi lúc 3 giờ sáng. Tìm file log trong `/var/log/` và đọc 50 dòng cuối.
2. Có ai đó xóa nhầm config. Tìm tất cả file `.conf` trong hệ thống.
3. Filter log để tìm tất cả dòng có chữ "ERROR" và lưu ra file riêng.

---

### Chương 2 — Process & System Control
**Story:** Server bỗng nhiên chậm như rùa. CPU 100%. Mày phải điều tra xem thứ gì đang ăn tài nguyên — và kill nó trước khi sếp phát hiện.

**Kỹ năng cần học:**
- Monitor: `top`, `htop`, `ps aux`, `ps -ef`, `pstree`
- Kill process: `kill`, `kill -9`, `killall`, `pkill`
- Service: `systemctl status`, `systemctl start/stop/restart`, `systemctl enable`
- Disk & memory: `df -h`, `du -sh`, `free -h`, `lsof`
- Background jobs: `&`, `jobs`, `fg`, `bg`, `nohup`, `screen`, `tmux`
- Cron: `crontab -e`, `crontab -l`, syntax `* * * * *`
- Environment: `env`, `export`, `echo $PATH`, `.bashrc`, `.bash_profile`

**Missions:**
1. Tìm process đang ngốn CPU nhiều nhất và kill nó.
2. Một service bị crash, restart nó và set auto-start khi boot.
3. Tạo cron job chạy script backup mỗi ngày lúc 2 giờ sáng.

---

### Chương 3 — Networking Từ Gốc
**Story:** Deploy xong app nhưng không ai vào được. Mày phải debug network từng bước một để tìm ra điểm nghẽn.

**Kỹ năng cần học:**
- Kiểm tra kết nối: `ping`, `traceroute`, `mtr`
- DNS: `dig`, `nslookup`, `host`, hiểu A/CNAME/MX record
- HTTP: `curl`, `curl -v`, `curl -I`, `wget`
- Port & socket: `netstat -tulpn`, `ss -tulpn`, `lsof -i`
- Interface: `ip addr`, `ip route`, `ifconfig` (deprecated nhưng vẫn gặp)
- Firewall: `iptables -L`, `ufw status`, `ufw allow/deny`
- Packet capture: `tcpdump` cơ bản

**Missions:**
1. App deploy trên port 8080 nhưng không access được từ ngoài — tìm nguyên nhân.
2. DNS của domain bị trỏ sai — dùng `dig` để debug và xác định record nào sai.
3. Có traffic lạ đến server — dùng `tcpdump` capture và phân tích.

---

### Chương 4 — SSH & Remote Access Thực Chiến
**Story:** Công ty mở rộng, có 20 server mới. Mày phải setup SSH key-based auth cho tất cả, không được dùng password — policy bảo mật mới.

**Kỹ năng cần học:**
- Key pair: `ssh-keygen`, `ssh-copy-id`, `~/.ssh/authorized_keys`
- SSH config: `~/.ssh/config` (alias, port, user, identity file)
- SSH options: `-i`, `-p`, `-L` (local tunnel), `-R` (remote tunnel), `-D` (SOCKS proxy)
- Port forwarding: local forward, remote forward, dynamic forward
- SCP & rsync: `scp -r`, `rsync -avz`, `rsync --delete`
- SSH hardening: `sshd_config`, disable root login, change port, fail2ban

**Missions:**
1. Setup SSH key cho server mới, disable password auth hoàn toàn.
2. Database chỉ mở localhost — tạo SSH tunnel để access từ máy local.
3. Sync thư mục code lên server production dùng rsync.

---

### Chương 5 — Recon & Enumeration (Hacker Mindset)
**Story:** Khách hàng thuê công ty mày pentest hệ thống của họ. Mày có địa chỉ IP và domain. Nhiệm vụ: thu thập tối đa thông tin trước khi tấn công.

**Kỹ năng cần học:**
- Passive recon: `whois`, `dig`, `theHarvester`, Google dorks
- Port scan: `nmap -sS`, `nmap -sV`, `nmap -O`, `nmap -A`, `-p-`
- Service enum: `nmap --script`, banner grabbing
- Web enum: `gobuster dir`, `ffuf`, `dirb`, `nikto`
- Subdomain: `subfinder`, `amass`, `dnsrecon`
- Hiểu OSINT: Shodan, Censys, crt.sh

**Missions:**
1. Từ 1 IP, xác định OS, services đang chạy, phiên bản cụ thể.
2. Tìm tất cả subdomain của một domain target.
3. Dùng gobuster tìm hidden directory trên web server.

---

### Chương 6 — Web Vulnerabilities Thực Tế
**Story:** Trong quá trình recon, mày phát hiện web app của target có dấu hiệu vulnerable. Giờ là lúc kiểm chứng.

**Kỹ năng cần học:**
- SQL Injection: manual SQLi, `sqlmap` cơ bản, hiểu bypass WAF
- XSS: reflected, stored, DOM-based; khi nào dùng, impact thực tế
- IDOR: Insecure Direct Object Reference — tìm và khai thác
- LFI/RFI: Local/Remote File Inclusion — đọc `/etc/passwd`
- Directory Traversal: `../` bypass
- Broken Auth: session fixation, weak tokens, brute force login
- Burp Suite: intercept, repeater, intruder workflow

**Missions:**
1. Login form có SQLi — bypass không cần biết password.
2. Comment section có stored XSS — inject payload để steal cookie.
3. API endpoint có IDOR — access data của user khác.

---

### Chương 7 — Privilege Escalation (Leo Thang Đặc Quyền)
**Story:** Mày đã vào được server với user thường. Nhưng file quan trọng nhất nằm trong `/root`. Mày phải leo lên root mà không có password.

**Kỹ năng cần học:**
- Enum: `whoami`, `id`, `sudo -l`, `uname -a`, `cat /etc/passwd`
- SUID/SGID: `find / -perm -4000`, khai thác binary có SUID
- Sudo misconfiguration: `(ALL) NOPASSWD`, wildcard trong sudo
- Cron exploit: world-writable script được cron chạy bởi root
- PATH hijack: tạo binary giả trong PATH
- Kernel exploit: `uname -r`, tìm CVE tương ứng
- Weak passwords: crack `/etc/shadow` với hashcat/john
- GTFOBins: database các binary có thể dùng để privesc

**Missions:**
1. Tìm binary có SUID bit và leo root thông qua nó.
2. Phát hiện cron job của root chạy script mà mày có thể write — inject shell.
3. Sudo cho phép chạy `vim` — escape ra shell với quyền root.

---

### Chương 8 — CTF Thực Chiến
**Story:** Mày đã học đủ. Giờ là bài test cuối. Một hệ thống giả lập hoàn chỉnh — mày phải hack từ đầu đến cuối, tự mình không có hint.

**Format:**
- Black-box: chỉ biết IP, không biết gì thêm
- Flow chuẩn: Recon → Foothold → Privesc → Capture the Flag
- Flag format: `HTB{...}` hoặc `FLAG{...}`

**Challenges:**
1. Easy: Web app đơn giản có SQLi + sudo misconfiguration
2. Medium: FTP anonymous + file upload RCE + SUID binary
3. Hard: Full chain — OSINT → subdomain → LFI → log poisoning → cron privesc

---

## 🤖 System Prompt cho AI Terminal Engine

```
Mày là AI engine của một terminal học bảo mật tên "Hacker Path". Mày đóng vai một terminal Linux/Kali ảo thông minh, đồng thời là người hướng dẫn học bảo mật bằng tiếng Việt.

### NHIỆM VỤ CHÍNH:
Nhận lệnh từ người dùng gõ vào terminal, phản hồi như terminal Linux thật, đồng thời dạy họ hiểu lệnh đó.

### CONTEXT MÀY NHẬN ĐƯỢC (JSON):
{
  "chapter": <số chương hiện tại 1-8>,
  "mission": <số mission trong chương>,
  "mission_description": <mô tả nhiệm vụ>,
  "filesystem_state": <trạng thái filesystem giả hiện tại>,
  "command_history": [<các lệnh đã gõ>],
  "mission_completed": <true/false>,
  "command": "<lệnh người dùng vừa gõ>"
}

### CÁCH PHẢN HỒI:

1. **Output terminal** (LUÔN có, như terminal thật):
   - Simulate output thực tế của lệnh đó trên Linux
   - Nếu lệnh sai syntax → báo lỗi như bash thật: "bash: xyz: command not found"
   - Nếu permission denied → "Permission denied"
   - Nếu file không tồn tại → "No such file or directory"
   - Output phải consistent với filesystem_state đã cho

2. **Giải thích** (ngắn gọn, tiếng Việt, CHỈ khi người dùng chưa hiểu hoặc lần đầu dùng lệnh):
   - Lệnh này làm gì
   - Flag/option quan trọng trong lệnh họ vừa gõ
   - Khi nào dùng trong thực tế

3. **Mission progress** (nếu lệnh liên quan đến mission):
   - Thông báo đã hoàn thành bước nào
   - Gợi ý bước tiếp theo nếu họ bí (KHÔNG spoil đáp án thẳng)

4. **Hint system** (3 cấp, chỉ khi người dùng gõ `hint`):
   - Level 1: Gợi ý chung chung ("Mày cần xem process nào đang chạy...")
   - Level 2: Gợi ý cụ thể hơn ("Dùng lệnh ps với flag -aux...")
   - Level 3: Gần như đáp án ("Gõ `ps aux | grep suspicious`...")

### QUY TẮC QUAN TRỌNG:
- KHÔNG bao giờ nói "Tôi là AI" hay phá vỡ character
- KHÔNG giải thích nếu lệnh đơn giản và người dùng đã dùng rồi
- Filesystem phải CONSISTENT — nếu họ tạo file thì file đó phải tồn tại ở lệnh sau
- Lỗi phải REALISTIC — copy chính xác format lỗi của bash/Linux thật
- Tiếng Việt tự nhiên, không cứng nhắc
- Khuyến khích thử nghiệm, KHÔNG phán xét lệnh sai

### FORMAT PHẢN HỒI (JSON):
{
  "terminal_output": "<output hiển thị trong terminal, dùng \n cho newline>",
  "explanation": "<giải thích ngắn bằng tiếng Việt, null nếu không cần>",
  "mission_progress": {
    "step_completed": "<tên bước vừa hoàn thành, null nếu không>",
    "next_hint": "<gợi ý nhẹ bước tiếp theo, null nếu mission xong>",
    "mission_completed": <true/false>
  },
  "filesystem_update": {
    "<path>": "<nội dung mới nếu có thay đổi, null nếu xóa>"
  }
}
```

---

## 🏗️ Kiến Trúc Component React

```
src/
├── App.jsx                    # Main app, routing
├── components/
│   ├── Terminal/
│   │   ├── Terminal.jsx       # Fake terminal UI
│   │   ├── TerminalInput.jsx  # Input với history (↑↓)
│   │   ├── TerminalOutput.jsx # Render output có color
│   │   └── useTerminal.js     # Hook xử lý command
│   ├── Mission/
│   │   ├── MissionPanel.jsx   # Sidebar hiện mission
│   │   ├── MissionProgress.jsx# Checklist các bước
│   │   └── HintSystem.jsx     # Hint 3 cấp độ
│   ├── Chapter/
│   │   ├── ChapterMap.jsx     # Map 8 chương
│   │   └── ChapterCard.jsx    # Card từng chương
│   └── Layout/
│       ├── Header.jsx
│       └── Sidebar.jsx
├── hooks/
│   ├── useAITerminal.js       # Gọi Claude API
│   ├── useProgress.js         # LocalStorage progress
│   └── useFilesystem.js       # Manage fake filesystem state
├── data/
│   ├── chapters.js            # Data 8 chương
│   ├── missions.js            # Chi tiết từng mission
│   └── filesystems/           # Initial filesystem cho mỗi mission
│       ├── chapter1-mission1.js
│       └── ...
└── utils/
    ├── terminalColors.js      # ANSI color codes
    └── commandParser.js       # Pre-parse trước khi gửi AI
```

---

## 🎨 UI/UX Design

**Theme:** Terminal dark — đen tuyền, text xanh lá cây như hacker phim, nhưng clean và readable.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  [HACKER PATH]  Chương 3: Networking  ████░░░ 60%   │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│  MISSION         │  ┌─ terminal ──────────────────┐ │
│  ─────────       │  │ root@hacklab:~$ _           │ │
│  [✓] Bước 1      │  │                             │ │
│  [✓] Bước 2      │  │                             │ │
│  [ ] Bước 3      │  │                             │ │
│                  │  │                             │ │
│  Story context   │  └─────────────────────────────┘ │
│  ─────────       │                                  │
│  "Server không   │  ┌─ explanation ───────────────┐ │
│  ra internet..."  │  │ 💡 `curl -v` hiển thị...   │ │
│                  │  └─────────────────────────────┘ │
│  [💡 Hint]       │                                  │
└──────────────────┴──────────────────────────────────┘
```

**Terminal features:**
- Command history với ↑↓
- Tab completion (basic)
- Syntax highlighting cho output
- ANSI color support (đỏ cho error, xanh lá cho success)
- Blink cursor

---

## 📊 Progress & Gamification

**Unlock system:**
- Chương sau unlock khi hoàn thành tất cả mission chương trước
- Mỗi mission có 3 sao: hoàn thành / hoàn thành không dùng hint / hoàn thành nhanh

**Stats tracking:**
- Tổng lệnh đã gõ
- Lệnh mới học được
- Thời gian mỗi mission
- Số lần dùng hint

**Badges:**
- 🔰 "Script Kiddie" — hoàn thành chương 1
- 🐧 "Linux Native" — hoàn thành chương 1-3
- 🌐 "Network Ninja" — hoàn thành chương 3-4
- 🔍 "Recon Master" — hoàn thành chương 5
- 💀 "Full Hacker" — hoàn thành tất cả 8 chương

---

## 🚀 MVP Build Order

**Phase 1 (tuần 1):** Core terminal + Chương 1
- [ ] Terminal UI component
- [ ] Claude API integration
- [ ] Filesystem state management
- [ ] Chapter 1 missions (3 missions)
- [ ] Progress save/load

**Phase 2 (tuần 2):** Chương 2-4 + Polish
- [ ] Hint system
- [ ] Command history
- [ ] Chapter map
- [ ] Chapters 2, 3, 4

**Phase 3 (tuần 3):** Chương 5-8 + Gamification
- [ ] Badge system
- [ ] Stats tracking
- [ ] Chapters 5, 6, 7, 8
- [ ] CTF final challenge

---

## ⚠️ Lưu Ý Kỹ Thuật

**Fake filesystem:**
Mỗi mission có một initial filesystem state (JS object). Khi người dùng chạy lệnh thay đổi filesystem (mkdir, touch, rm...), AI trả về `filesystem_update` và frontend update state. State này được pass vào mỗi API call để AI luôn biết filesystem hiện tại.

**Rate limiting:**
Mỗi lệnh = 1 API call. Cần debounce, và có thể cache response cho các lệnh phổ biến (`ls /`, `pwd`...).

**Security:**
Đây là terminal GIẢ — không có gì chạy thật trên server. Tất cả output đều do AI sinh ra. Không cần sandbox thật.

**Lệnh đặc biệt (xử lý ở frontend, không gọi API):**
- `clear` / `cls` → clear terminal output
- `hint` → trigger hint system
- `exit` → về chapter map
- `help` → show available commands cho mission hiện tại

---

## ⚠️⚠️ QUY TẮC KIỂM THỬ — BẮT BUỘC TRƯỚC KHI NÓI "XONG"

> Sai lầm đã xảy ra: thêm hàng loạt mission, pass test cấu trúc (schema) + build, rồi tuyên bố "xong" — NHƯNG chưa hề chơi thử. Kết quả: ~205/574 step có regex `match` lệch lệnh mà hint dạy → player gõ đúng theo hint vẫn KẸT. Cấu trúc đúng ≠ chơi được.

**1. Mission phải CHƠI ĐƯỢC, không chỉ đúng cấu trúc.**
   - Test schema (`missions.validate.test.js`, `check-chapter.mjs`) CHỈ chứng minh đủ field — KHÔNG chứng minh mission hoàn thành được.
   - Mỗi step có `match` (RegExp) + `hints`. Bắt buộc: lệnh mà hint dạy (trong dấu backtick) PHẢI khớp `match` của step. Player đi theo hint là phải qua được mission.
   - Gate: `node scripts/playtest-chapter.mjs <N>` — mô phỏng chơi bằng cách đẩy lệnh trong hint qua chính `evaluateCommand` (engine thật). Phải in "✅ ... chơi được bằng hint." cho mọi mission extra.
   - Regex viết KHOAN DUNG: chấp nhận PID số `\d+`, `$(pgrep x)`, `$VAR`, đảo thứ tự flag. Đừng đòi đúng một dạng cứng.
   - Bài `noHints: true` (Ch10): gate bỏ qua → phải đọc & kiểm regex thủ công cho khớp lệnh đúng kỹ thuật.

**2. UI/UX phải CHẠY THỬ, không chỉ build.**
   - `vite build` xanh chỉ chứng minh compile. Phải chạy `npm run dev` và thật sự thao tác (gõ lệnh → output hiện, step tick, TermsPanel render, hint hiện) hoặc có test render (jsdom + Testing Library).

**3. KHÔNG tin báo cáo suông.**
   - Sub-agent báo "idle/done" KHÔNG có nghĩa đã làm/đúng. LUÔN verify độc lập bằng `check-chapter.mjs` (cấu trúc) + `playtest-chapter.mjs` (chơi được) trước khi commit/tuyên bố.
   - Trước khi nói "hoàn thành": chạy `npx vitest run` + cả 10 chương qua `playtest-chapter` + chạy thử UI. Có bằng chứng rồi mới khẳng định.

**Hai gate bắt buộc cho mọi thay đổi mission:** `scripts/check-chapter.mjs <N>` (cấu trúc) **VÀ** `scripts/playtest-chapter.mjs <N>` (chơi được).
