---
name: chub
description: Fetch current third-party API, SDK, library, and tool documentation with the chub CLI before writing code that depends on external services or packages. Use when Codex needs up-to-date docs for requests like "use the OpenAI API", "call the Stripe API", "use the Anthropic SDK", "query Pinecone", or any task where relying on memorized API shapes is risky.
---

# Get current docs with chub

Use `chub` to retrieve current docs instead of guessing from training data.

## Core workflow

### 1. Find the right doc ID

```bash
chub search "<library or API name>" --json
```

Pick the best matching `id`. If nothing matches, broaden the query and search again.

### 2. Fetch the docs

```bash
chub get <id> --lang py
chub get <id> --lang ts
chub get <id> --lang js
chub get <id> --lang cs
```

Use the language that matches the user request. If the command reports multiple language variants, rerun with the correct `--lang`.

### 3. Use the fetched docs

Read the returned content and base the answer or code on that material, not memory.

### 4. Save useful notes

If you discover a project-specific gotcha, workaround, or version detail that is not already in the doc, save it for future sessions:

```bash
chub annotate <id> "Webhook verification requires the raw request body"
```

Keep notes short and actionable. Do not restate obvious doc content.

### 5. Ask before sending feedback

If the doc was especially good or clearly flawed, ask the user before sending feedback:

```bash
chub feedback <id> up
chub feedback <id> down --label outdated
```

Common labels include `outdated`, `inaccurate`, `incomplete`, `wrong-examples`, `wrong-version`, `poorly-structured`, `accurate`, `well-structured`, `helpful`, and `good-examples`.

## Useful commands

```bash
chub search
chub search "stripe"
chub get stripe/api --lang py
chub get openai/chat --lang ts
chub get anthropic/sdk --lang cs -o docs.md
chub get openai/chat stripe/api --lang py
chub get openai/chat --lang ts --version <version>
chub get openai/chat --lang ts --full
chub annotate --list
```

## Notes

- `chub search` with no query lists all available entries.
- IDs usually follow an `<author>/<name>` shape. Confirm the exact ID from search before fetching.
- `chub get` can fetch multiple IDs in one command.
- Use `-o` when you need the fetched docs saved to a file or directory.
