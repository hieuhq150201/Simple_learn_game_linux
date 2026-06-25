#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh <prd_directory> [--tool codex|amp|claude] [max_iterations]
# Example: ./ralph.sh docs/ralph/my-feature --tool codex 20

set -e

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required but not found in PATH." >&2
  exit 1
fi

# Parse arguments
PRD_DIR=""
TOOL="codex"
CODEX_FLAGS="${CODEX_FLAGS:---yolo}"
IFS=' ' read -r -a CODEX_FLAG_ARR <<< "$CODEX_FLAGS"
MAX_ITERATIONS=10

while [[ $# -gt 0 ]]; do
  case $1 in
  --tool)
    TOOL="$2"
    shift 2
    ;;
  --tool=*)
    TOOL="${1#*=}"
    shift
    ;;
  *)
    # First positional arg is PRD directory
    if [[ -z "$PRD_DIR" ]]; then
      PRD_DIR="$1"
    # Assume it's max_iterations if it's a number
    elif [[ "$1" =~ ^[0-9]+$ ]]; then
      MAX_ITERATIONS="$1"
    fi
    shift
    ;;
  esac
done

# Validate PRD directory is provided
if [[ -z "$PRD_DIR" ]]; then
  echo "Error: PRD directory is required."
  echo "Usage: $0 <prd_directory> [--tool codex|amp|claude] [max_iterations]"
  echo "Example: $0 docs/ralph/my-feature --tool codex 20"
  exit 1
fi

# Validate tool choice
if [[ "$TOOL" != "codex" && "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'codex', 'amp', or 'claude'."
  exit 1
fi

# Resolve paths relative to current working directory
CWD="$(pwd)"
PRD_DIR_ABSOLUTE="$CWD/$PRD_DIR"
PRD_FILE="$PRD_DIR_ABSOLUTE/prd.json"
PROGRESS_FILE="$PRD_DIR_ABSOLUTE/progress.txt"
ARCHIVE_DIR="$PRD_DIR_ABSOLUTE/archive"
LAST_BRANCH_FILE="$PRD_DIR_ABSOLUTE/.last-branch"
PROMPT_FILE="$CWD/.agents/skills/ralph/PROMPT.md"

# Validate PRD directory exists
if [[ ! -d "$PRD_DIR_ABSOLUTE" ]]; then
  echo "Error: PRD directory does not exist: $PRD_DIR_ABSOLUTE"
  exit 1
fi

# Validate prompt file exists
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Error: Prompt file not found: $PROMPT_FILE"
  echo "Expected at: .agents/skills/ralph/PROMPT.md"
  exit 1
fi

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph - Tool: $TOOL - Max iterations: $MAX_ITERATIONS"
echo "PRD Directory: $PRD_DIR_ABSOLUTE"
echo "Prompt File: $PROMPT_FILE"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  # Prepend context with file paths to the prompt
  PROMPT_WITH_CONTEXT="# Ralph Context for This Run

**File Paths for this iteration:**
- PRD File: \`$PRD_FILE\`
- Progress Log: \`$PROGRESS_FILE\`
- Working Directory: \`$CWD\`

---

$(cat "$PROMPT_FILE")"

  # Run the selected tool with the contextualized prompt (always use PROMPT.md)
  if [[ "$TOOL" == "codex" ]]; then
    OUTPUT=$(codex exec "${CODEX_FLAG_ARR[@]}" "$PROMPT_WITH_CONTEXT" 2>&1 | tee /dev/stderr) || true
  elif [[ "$TOOL" == "amp" ]]; then
    OUTPUT=$(echo "$PROMPT_WITH_CONTEXT" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
  else
    # Claude Code: use --dangerously-skip-permissions for autonomous operation, --print for output
    OUTPUT=$(echo "$PROMPT_WITH_CONTEXT" | claude --dangerously-skip-permissions --print 2>&1 | tee /dev/stderr) || true
  fi

  # Check for completion signal using PRD pass status as source of truth
  ALL_PASSED="false"
  if [ -f "$PRD_FILE" ]; then
    ALL_PASSED=$(jq -e '.userStories | all(.passes == true)' "$PRD_FILE" >/dev/null 2>&1 && echo "true" || echo "false")
  fi
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>" && [ "$ALL_PASSED" != "true" ]; then
    echo "WARNING: Agent claimed COMPLETE but prd.json still has failing stories. Ignoring completion signal." >&2
  fi
  if [ "$ALL_PASSED" = "true" ]; then
    echo ""
    echo "Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
exit 1
