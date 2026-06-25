# Spec: Mở rộng Hacker Path lên ~150-180 mission (bám syllabus chứng chỉ)

- **Ngày:** 2026-06-25
- **Nhánh:** `feature/expand-missions-syllabus`
- **Trạng thái:** Đã duyệt thiết kế, chờ viết plan thực thi

## 1. Mục tiêu

Mỗi chương hiện chỉ có 3 bài gốc + vài bài bổ sung → quá ít để học tới mức thuần thục. Mở rộng mỗi chương lên **~15-20 mission** (CTF ít hơn vì mỗi bài là chuỗi dài), bám **syllabus chứng chỉ chuẩn**, độ khó tăng dần, kèm **thuật ngữ tiếng Việt** (panel TermsPanel) cho mọi bài — kể cả 30 bài gốc (backfill).

Tài liệu này vừa là spec thiết kế, vừa là **brief cho sub-agent**: mọi agent soạn bài PHẢI đọc và tuân thủ.

## 2. Hợp đồng schema mỗi mission

File `src/data/missions.js` định nghĩa `missions[chapterId] = [ ...mission ]`. Mission bổ sung nằm ở `src/data/extra/chapterN.js` (default export là mảng), được gộp vào cuối mảng gốc. Mỗi mission:

```js
{
  id,                 // số, NỐI TIẾP id đang có trong chương (Ch1 đang tới 9 → bài mới bắt đầu 10)
  chapterId,          // = số chương, phải khớp
  title,              // tiếng Việt, ngắn gọn, gợi tình huống
  story,              // 2-4 câu, giọng "mày/tao", văn hacker gai góc nhưng rõ nhiệm vụ
  steps: [
    { id, description, match: /regex/, output? }
    // output CHỈ cho lệnh ẢO (nmap, ssh, ping, systemctl, dig, ps...) — fake shell không tự sinh được.
    // Lệnh thao tác file (ls, cat, grep, find, cd, mkdir...) BỎ output → localShell tự sinh từ filesystem.
  ],
  hints: [h1, h2, h3],   // ĐÚNG 3 cấp, leo thang: chung chung → cụ thể → gần đáp án (test ràng buộc length===3)
  debrief: [b1, b2, b3, b4?],  // 3-4 gạch: khái niệm cốt lõi → dùng thực tế → góc attacker/defender
  terms: [ { term, def }, ... ],  // 3-5 thuật ngữ, def 1 câu tiếng Việt
  initialFilesystem,    // import từ ../filesystems/chapterN-missionX.js; BẮT BUỘC có '/' và '/home/hacker'
}
```

### Quy ước bắt buộc
- **hints LUÔN đúng 3 phần tử.** Cấp 1 gợi ý hướng, cấp 2 nêu lệnh + flag, cấp 3 gần như đáp án. **Ngoại lệ Ch10 (elite "không hint"): giữ 1 hint/bài placeholder.**
- **filesystem LUÔN có `/` và `/home/hacker`** (test ràng buộc). Object dạng `{ '<path>': { type: 'dir' } }` hoặc `{ type: 'file', content: '...' }`.
- **id duy nhất & nối tiếp** trong chương, không nhảy số, không trùng.
- **match là RegExp**, neo `^`, khoan dung thứ tự flag, chuẩn hoá khoảng trắng. Ví dụ:
  `match: /^ls\s+.*-.*l.*\/etc|^ls\s+-l.*\s+\/etc/`
- **Giọng văn:** xưng "mày/tao", tiếng Việt tự nhiên, không cứng. Bám tông các bài đã có ở `extra/chapter1.js` (CHƯƠNG MẪU).

### Đường cong độ khó (trong từng chương)
- id thấp = 1 lệnh đơn, dạy 1 khái niệm.
- id giữa = 2-3 lệnh phối hợp.
- id cao = chuỗi nhiều bước (pipe, redirect, lồng lệnh), mô phỏng tình huống thật.

## 3. Map syllabus & chỉ tiêu

| Ch | Tên | Cert neo | Hiện | **Đích** | Model agent |
|----|-----|----------|------|----------|-------|
| 1 | Terminal Sinh Tồn | LPIC-1 101 / Linux+ | 9 | **16** | haiku |
| 2 | Process & System | LPIC-1 103 | 8 | **16** | haiku |
| 3 | Networking | Linux+ / Network+ | 3 | **18** | haiku |
| 4 | SSH & Remote | LPIC-1 / Linux+ | 3 | **15** | haiku |
| 5 | Recon & Enum | eJPT / PNPT | 9 | **18** | sonnet |
| 6 | Web Vulns | PortSwigger / OWASP | 10 | **20** | sonnet |
| 7 | Privilege Escalation | OSCP / PNPT | 3 | **18** | sonnet |
| 8 | CTF Thực Chiến | eJPT / OSCP chain | 6 | **12** | sonnet |
| 9 | Lateral & AD | CRTP | 6 | **14** | sonnet |
| 10 | Elite Black-Box | nâng cao | 6 | **10** | sonnet |

**Tổng ≈ 157 bài.** CTF (8, 10) thấp hơn vì mỗi bài là chuỗi recon→foothold→privesc→flag dài.

### Chủ đề cần drill mỗi chương (chống thiếu/trùng)
- **Ch1:** pwd/ls/cd biến thể, cat/less/head/tail/tail -f, grep/grep -rn, find theo tên/quyền/thời gian, cp/mv/rm/mkdir/touch, chmod số & symbolic, pipe, redirect `> >> 2>`, wildcard `* ? [abc]`.
- **Ch2:** ps aux/ps -ef, top, kill/-9/pkill/killall, systemctl status/start/stop/enable, df/du/free, lsof, jobs/&/fg/bg/nohup, cron syntax, env/export/$PATH/.bashrc.
- **Ch3:** ping, traceroute/mtr, dig (A/CNAME/MX/+short/@server), nslookup/host, curl -v/-I/-L/wget, netstat/ss -tulpn, lsof -i, ip addr/route, iptables -L/ufw, tcpdump cơ bản.
- **Ch4:** ssh-keygen (-t ed25519/rsa), ssh-copy-id, authorized_keys, ~/.ssh/config alias, -i/-p, -L/-R/-D forwarding, scp -r, rsync -avz/--delete, sshd_config hardening, fail2ban.
- **Ch5:** whois, dig recon, nmap -sS/-sV/-O/-A/-p-/--script, banner grabbing, gobuster dir/ffuf/dirb/nikto, subfinder/amass/dnsrecon, crt.sh/Shodan.
- **Ch6:** SQLi (manual + sqlmap, bypass auth, UNION), XSS (reflected/stored/DOM), IDOR, LFI/RFI (đọc /etc/passwd), directory traversal, broken auth/session, Burp repeater/intruder.
- **Ch7:** whoami/id/sudo -l/uname -a/cat /etc/passwd, find -perm -4000 (SUID), sudo misconfig/NOPASSWD, cron world-writable, PATH hijack, kernel CVE, crack /etc/shadow, GTFOBins escape.
- **Ch8:** chuỗi đầy đủ độ khó tăng dần: web SQLi+sudo, FTP anon+upload RCE+SUID, OSINT→subdomain→LFI→log poisoning→cron. Flag `HTB{...}`/`FLAG{...}`. **Bước cuối phải nói tới "flag"/"cờ".**
- **Ch9:** enum AD, Kerberoasting, AS-REP roast, Pass-the-Hash, PtT, DCSync, Golden/Silver Ticket, BloodHound path, impacket/mimikatz.
- **Ch10:** container escape, binary exploitation (ret2win), full red-team OSINT→DA. Không hint dễ dãi. **Bước cuối CTF nói tới "flag"/"cờ".**

## 4. Backfill terms cho 30 bài gốc

30 bài gốc trong `missions.js` (Ch1-10, mission 1-3) hiện **không có `terms`**. Thêm `terms: [3-5 × {term, def}]` cho từng bài, khớp lệnh/khái niệm chính của bài đó. Sửa trực tiếp trong `missions.js` (đây là file dùng chung → chỉ opus đụng, không giao sub-agent để tránh xung đột).

## 5. Test & validate

### 5.1 Thêm `src/data/missions.validate.test.js`
Chạy trên CẢ 10 chương, với mỗi mission assert:
- `chapterId` khớp key; `title`, `story` là string không rỗng.
- `steps.length > 0`; mỗi step có `description` string và `match instanceof RegExp`.
- `hints.length === 3`.
- `terms` là mảng `length >= 3`, mỗi phần tử có `term` + `def`.
- `initialFilesystem['/']` và `initialFilesystem['/home/hacker']` tồn tại.
- `id` duy nhất trong chương (hard). Nối tiếp 1..N là mục tiêu — opus xác minh/sửa ở Pha 0, không để test giòn nếu data cũ lệch.
- `missions[ch].length === chapters[ch].missionCount`.

### 5.2 Sửa 2 test cũ trong `missions.test.js`
- `"every chapter 1-8 has exactly 3 missions"` → đổi thành kiểm `missions[ch].length === chapters[ch].missionCount` cho ch 1-10.
- `"CTF chapter 8 ... contains 'flag'"` → nới: `description` chứa `'flag'` HOẶC `'cờ'`; áp cho cả Ch8 và Ch10.

### 5.3 Cập nhật `chapters.js`
`missionCount` mỗi chương = số bài thực sau mở rộng (đã được test 5.1 ép đồng bộ).

## 6. Điều phối agent (3 pha)

### Pha 0 — opus (session chính)
1. Viết spec này (xong) + commit.
2. Viết `missions.validate.test.js` (mục 5.1).
3. Sửa khung 2 test cũ (5.2) + `chapters.js` (5.3) — để baseline xanh.
4. **Kéo dài Ch1 tới 16 bài làm CHƯƠNG MẪU** chuẩn mực để sub-agent soi theo.
5. Backfill terms cho 30 bài gốc (mục 4).

### Pha 1 — fan-out song song (sub-agent, mỗi chương 1 agent)
- Bậc model theo bảng §3 (haiku Ch1-4, sonnet Ch5-10).
- Thả theo **đợt 4-5 agent**, không bung 10 cái cùng lúc.
- Mỗi agent NHẬN: spec này + đường dẫn chương mẫu (extra/chapter1.js) + danh sách chủ đề cần drill của chương + "đã có bài nào, tránh trùng".
- Mỗi agent LÀM: thêm bài tới đích, ghi `extra/chapterN.js` + `filesystems/chapterN-missionX.js`; **chỉ đụng file của chương mình**; chạy validate test cho chương mình **tới khi xanh** rồi báo về.
- Ch7: nối bài vào 6 filesystem đã có nội dung thật (mission4-9), không vứt.
- Ch1-3 (một phần) đã có filesystem; agent tái dùng/bổ sung, không ghi đè bừa.

### Pha 2 — opus gom
1. Chạy FULL `vitest`.
2. Cập nhật `chapters.js` `missionCount` cuối cùng.
3. Rà trùng ý + đường cong độ khó (spot-check vài chương).
4. Commit.

## 7. Quy tắc cô lập (chống xung đột song song)
- Mỗi sub-agent **chỉ** ghi `extra/chapterN.js` của chương mình + các file `filesystems/chapterN-missionX.js` của chương mình.
- **Không** sub-agent nào đụng `missions.js`, `chapters.js`, `missions.test.js`, `missions.validate.test.js` — chỉ opus đụng (Pha 0 & 2).
- Kiến trúc "mỗi chương 1 file extra" vốn đã được thiết kế để code song song không đụng nhau.

## 8. Rủi ro & chặn

| Rủi ro | Chặn |
|--------|------|
| Agent lệch tông/độ khó | spec + chương mẫu + validate test |
| Trùng ý giữa các chương | mỗi agent nhận danh sách chủ đề + "tránh trùng"; opus rà cuối |
| Regex sai không khớp lệnh | validate kiểm cấu trúc; opus spot-check thủ công vài bài |
| missionCount/test lệch | test ép `length === missionCount` |
| Tốn token | bậc model haiku/sonnet + thả theo đợt |
| node_modules đã bị commit | (ngoài phạm vi) ghi nhận để `git rm -r --cached node_modules` sau |

## 9. Tiêu chí hoàn thành (Definition of Done)
- `vitest run` xanh toàn bộ (gồm validate test mới).
- 10 chương đạt chỉ tiêu §3 (±1 bài chấp nhận được).
- Mọi bài (kể cả 30 bài gốc) có `terms`.
- `chapters.js` missionCount khớp thực tế.
- Không file nào ngoài phạm vi chương bị sub-agent ghi đè.
