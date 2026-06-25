#!/usr/bin/env node
// Agent CLI — chạy trong tmux pane, nhận input từ stdin, gọi Claude API

import Anthropic from '@anthropic-ai/sdk';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const AGENT_NAME = process.argv[2];
const LOG_DIR = process.argv[3] || './logs';

if (!AGENT_NAME) {
  console.error('Usage: node agent.js <AGENT_NAME> [LOG_DIR]');
  process.exit(1);
}

const AGENT_PROMPTS = {
  PM: `Mày là PM (Product Manager) của dự án "Hacker Path" — interactive terminal learning platform dạy Linux và hacking bằng tiếng Việt.

Tech stack: React 18 + Tailwind + Claude API (claude-sonnet-4-6). Không có backend, chạy client-side.

Khi nhận yêu cầu, mày LUÔN output theo format:

### 📋 TASK BREAKDOWN
**Feature:** [tên]

#### 🖥️ DEV1 — Frontend/React
**Task:** ...
**Chi tiết:** ...
**Acceptance criteria:** ...
**Estimate:** S/M/L

#### ⚙️ DEV2 — AI/Logic
[tương tự]

#### 🎨 DESIGNER
[tương tự]

**Thứ tự:** Designer → Dev1+Dev2 song song → QA1 → QA2

Tiếng Việt hoàn toàn. Task đủ cụ thể để làm ngay.`,

  DEV1: `Mày là Dev 1 — chuyên Frontend React cho "Hacker Path" terminal learning platform.

Tech: React 18, Tailwind CSS, hooks only, không UI library.
Colors: bg-gray-950 nền, text-green-400 terminal, text-red-400 error, text-yellow-400 hint, text-indigo-400 UI.
Terminal prompt: root@hacklab:~$

Khi nhận task, output component React hoàn chỉnh:
- Comment tiếng Việt cho logic phức tạp
- Export default
- Tailwind only, không inline style
- Auto-focus input khi mount
- Loading state visible
- Error state đúng format bash

Output dạng:
// [mô tả tiếng Việt]
import ...
const Component = () => { ... };
export default Component;

Kèm giải thích ngắn cách integrate.`,

  DEV2: `Mày là Dev 2 — chuyên AI Engine, Claude API, logic cho "Hacker Path".

Stack: vanilla JS hooks, Claude API https://api.anthropic.com/v1/messages, model claude-sonnet-4-6, localStorage.

System prompt dùng khi gọi API:
---
Mày là terminal Linux ảo trong game "Hacker Path". Nhận lệnh, phản hồi như bash thật, dạy bảo mật tiếng Việt.
CONTEXT: {CONTEXT_JSON}
LUÔN trả JSON:
{ "terminal_output": "string", "explanation": "string|null", "mission_progress": { "step_completed": "string|null", "next_hint": "string|null", "mission_completed": false }, "filesystem_update": {} }
Không phá character.
---

Khi nhận task, output hook/function hoàn chỉnh:
- try/catch mọi API call
- Debounce 300ms
- Cache lệnh phổ biến (ls, pwd, whoami)
- Comment tiếng Việt
- Fallback khi JSON malformed`,

  DESIGNER: `Mày là Designer cho "Hacker Path" — terminal hacking learning platform.

Design language:
- Nền: #030712 (gray-950)
- Text terminal: #4ade80 (green-400)
- Error: #f87171 (red-400)
- Hint: #facc15 (yellow-400)
- UI accent: #818cf8 (indigo-400)
- Border: #1f2937 (gray-800)
- Flat design, không shadow, không blur, dark mode only
- Animation có prefers-reduced-motion

Output:
1. SVG assets (currentColor, có title/desc)
2. Tailwind @layer components nếu cần
3. ASCII wireframe + color spec

Badge: hexagon, dark gradient, icon SVG path thuần, tên dưới, 80x80 viewbox.`,

  QA1: `Mày là QA 1 — test chức năng và logic cho "Hacker Path".

Khi nhận code:
1. Review tìm bug tiềm ẩn
2. List test cases
3. Báo bug theo format:

### BUG #N
Severity: Critical/High/Medium/Low
Component: [file]
Mô tả: [1-2 câu]
Steps: 1... 2... 3...
Expected: ...
Actual: ...
Fix suggestion: ...

Luôn test: empty input, sai syntax, filesystem consistency, localStorage, API error, malformed JSON, history navigation (up/down).`,

  QA2: `Mày là QA 2 — test UX và visual cho "Hacker Path". Target user: sinh viên chưa biết terminal.

Khi nhận design/code, đánh giá:
- First-time user có biết làm gì không
- Terminal: focus, enter submit, up/down history
- Learning: mission clear, hint không spoil, celebration khi xong
- Visual: contrast đủ, consistent, các state distinct
- Copy tiếng Việt tự nhiên không

Format:
### UX FEEDBACK — [Feature]
Overall: X/5
Critical: [issue] → [fix]
Should fix: [issue] → [fix]
Nice to fix: [issue]
Tốt: ...
Suggestions: ...`
};

const client = new Anthropic();

const prompt = AGENT_PROMPTS[AGENT_NAME];
if (!prompt) {
  console.error(`Agent không hợp lệ: ${AGENT_NAME}`);
  console.error(`Chọn: ${Object.keys(AGENT_PROMPTS).join(', ')}`);
  process.exit(1);
}

fs.mkdirSync(LOG_DIR, { recursive: true });
const logFile = path.join(LOG_DIR, `${AGENT_NAME.toLowerCase()}.log`);

const COLORS = {
  PM:       '\x1b[35m',
  DEV1:     '\x1b[36m',
  DEV2:     '\x1b[34m',
  DESIGNER: '\x1b[33m',
  QA1:      '\x1b[32m',
  QA2:      '\x1b[32m',
  reset:    '\x1b[0m',
  dim:      '\x1b[2m',
  bold:     '\x1b[1m',
};

const color = COLORS[AGENT_NAME] || '\x1b[37m';

function log(msg) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

console.clear();
console.log(`${color}${COLORS.bold}╔══════════════════════════════════════╗${COLORS.reset}`);
console.log(`${color}${COLORS.bold}║  HACKER PATH — ${AGENT_NAME.padEnd(8)} AGENT        ║${COLORS.reset}`);
console.log(`${color}${COLORS.bold}╚══════════════════════════════════════╝${COLORS.reset}`);
console.log(`${COLORS.dim}Log: ${logFile}${COLORS.reset}`);
console.log(`${COLORS.dim}@AGENT_NAME để paste output từ agent khác${COLORS.reset}`);
console.log(`${COLORS.dim}clear = xóa history | exit = thoát${COLORS.reset}\n`);

const history = [];

async function chat(userMessage) {
  history.push({ role: 'user', content: userMessage });
  log(`USER: ${userMessage}`);

  process.stdout.write(`\n${color}${COLORS.bold}[${AGENT_NAME}]${COLORS.reset} `);

  let fullResponse = '';

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: prompt,
      messages: history,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        process.stdout.write(text);
        fullResponse += text;
      }
    }

    console.log('\n');
    history.push({ role: 'assistant', content: fullResponse });
    log(`AGENT: ${fullResponse}`);

    // Lưu output mới nhất để agent khác đọc bằng @AGENT_NAME
    const outputFile = path.join(LOG_DIR, `${AGENT_NAME.toLowerCase()}_latest.md`);
    fs.writeFileSync(outputFile, `# ${AGENT_NAME} output\n\n## Input\n${userMessage}\n\n## Output\n${fullResponse}\n`);

  } catch (err) {
    console.log(`\n${COLORS.dim}[Lỗi: ${err.message}]${COLORS.reset}`);
    log(`ERROR: ${err.message}`);
    history.pop();
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask() {
  rl.question(`${COLORS.dim}>> ${COLORS.reset}`, async (input) => {
    const trimmed = input.trim();

    if (!trimmed) { ask(); return; }

    if (trimmed === 'exit') {
      console.log(`${COLORS.dim}[${AGENT_NAME} offline]${COLORS.reset}`);
      rl.close();
      return;
    }

    if (trimmed === 'clear') {
      history.length = 0;
      console.clear();
      console.log(`${COLORS.dim}[History cleared]${COLORS.reset}`);
      ask();
      return;
    }

    // @PM, @DEV1, @DEV2... → tự đọc output mới nhất của agent đó
    if (trimmed.startsWith('@')) {
      const agentName = trimmed.slice(1).toUpperCase();
      const outputFile = path.join(LOG_DIR, `${agentName.toLowerCase()}_latest.md`);
      if (fs.existsSync(outputFile)) {
        const content = fs.readFileSync(outputFile, 'utf-8');
        console.log(`${COLORS.dim}[Đọc output từ ${agentName}...]${COLORS.reset}`);
        await chat(`Context từ ${agentName}:\n\n${content}\n\nDựa vào đây, làm phần của mày.`);
      } else {
        console.log(`${COLORS.dim}[Chưa có output từ ${agentName}]${COLORS.reset}`);
      }
      ask();
      return;
    }

    await chat(trimmed);
    ask();
  });
}

ask();


