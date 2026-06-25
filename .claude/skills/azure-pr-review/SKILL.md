---
name: azure-pr-review
description: Review Azure DevOps pull requests with Azure CLI and post review comments back to the PR. Use when the task involves an Azure DevOps PR URL or PR ID, fetching PR metadata or diffs with `az`, doing a code review, or writing review comments back to the PR.
---

# Azure PR review

Use Azure CLI for PR metadata first, then review the actual patch locally.

## Review flow

1. Get PR metadata with `az repos pr show --id <PR_ID> --org <ORG_URL> -o json`.
2. Read `lastMergeSourceCommit`, `lastMergeTargetCommit`, `sourceRefName`, and `repository.id`.
3. Fetch the PR branch locally with `git fetch origin refs/heads/<source-branch>:refs/remotes/origin/<source-branch>`.
4. Review the patch with `git diff <targetCommit> <sourceCommit>` and inspect high-risk files first.
5. Report findings in review order: bugs, regressions, missing tests, then residual risk.

## Commenting on the PR

Prefer `az devops invoke` for comments. Some Azure CLI installs do not provide `az repos pr comment`.

Post a top-level PR thread with:

```powershell
$body = @'
{
  "comments": [
    {
      "parentCommentId": 0,
      "content": "@<Display Name> review text here",
      "commentType": 1
    }
  ],
  "status": 1
}
'@

$path = Join-Path $env:TEMP 'pr-comment.json'
Set-Content -Path $path -Value $body -Encoding utf8

az devops invoke `
  --area git `
  --resource pullRequestThreads `
  --route-parameters project=<PROJECT> repositoryId=<REPOSITORY_ID> pullRequestId=<PR_ID> `
  --http-method POST `
  --in-file $path `
  --api-version 7.1 `
  --org <ORG_URL> `
  -o json
```

## Mentions

When mentioning the author or another reviewer, use `@<Display Name>` exactly.

Use:

```text
@<Nhan Nguyen>
```

Do not use raw text like `@Nhan Nguyen`, because Azure DevOps may not convert it into a real mention.

## Notes

- Treat local workspace changes as unrelated unless they are part of the PR branch being reviewed.
- If `az repos pr show` rejects `--project`, rely on configured defaults or pass only `--org`.
- If you need to link findings, include file paths and line references from the PR snapshot or checked-out PR branch.
