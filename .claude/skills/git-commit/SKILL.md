---
name: git-commit
description: Create and split conventional commits from workspace changes. Use when the user asks to commit code, write commit messages, or organize changes into atomic commits.
---

# Git Commit

Create conventional commits that are atomic, policy-compliant, and non-interactive.

## Commit format

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

### Allowed types
- `feat` - Add, adjust or remove a feature in API or UI
- `fix` - Fix a bug in a preceded `feat` commit
- `refactor` - Restructure code without altering API or UI behavior
  - `perf` - Special `refactor` that improves performance
- `style` - Code style changes (whitespace, formatting) without behavior changes
- `test` - Add or correct tests
- `docs` - Documentation-only changes
- `merge` - Merge commits from upstream
- `build` - Build tools, dependencies, project version changes
- `ops` - Infrastructure, deployment, CI/CD, monitoring, backups
- `chore` - Other changes (`.gitignore`, initial commit, etc.)

## Workflow

### 1. Analyze changes

- Run `git status` and `git diff` to understand the logical changes
- **Split** into separate commits if multiple logical changes, by feature, not by file type
- **Never** blindly use `git add .`

### 2. Stage selectively

- Stage your changes only
- **Ask** before staging: `.env`, keys, tokens, unrelated files
- **Exclude**: external repos, git worktrees

### 3. Generate message

- Imperative mood, 72 char limit
- Add `!` for public API breaking changes
- MUST use EXACT type in list above - NO substitutions

## Split Criteria

- Different features/concerns
- Large changesets

## Validation

- Verify staged diff matches the commit message intent
- Ensure each commit is independently understandable
- Use non-interactive git commands only
