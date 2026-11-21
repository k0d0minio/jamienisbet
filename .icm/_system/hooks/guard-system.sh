#!/usr/bin/env bash
# guard-system.sh — PreToolUse hook. It denies two things in a repo:
# 1. Each MCP tool call: a tool name that starts with mcp__, also in a subagent. Rule 9 of
#    the router: a session uses the tools of BAXTER (baxter_tool), git and gh (J, 2026-11-20).
#    This part needs no jq.
# 2. A file write below .icm/_system/, or of one of the three guards of .claude/hooks/
#    (1.0.0-rc18). They belong to the blueprint. The CI job icm-check is the control. This
#    part is a convenience that stops the edit early. It reads Edit, Write, MultiEdit and
#    NotebookEdit, and it needs jq.
# For each other tool it does nothing.
input="$(cat)"
mcp_reason="Do not use an MCP tool. Use the tools of BAXTER: ~/baxter_live/system/bin/baxter_tool list, then baxter_tool schema <tool>. For git and GitHub, use git and gh. If no BAXTER tool does the work, stop and tell the operator. Rule 9 of .icm/_system/ROUTER.md."
if grep -Eq '"tool_name"[[:space:]]*:[[:space:]]*"mcp__' <<<"$input"; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$mcp_reason"
  exit 0
fi
command -v jq >/dev/null 2>&1 || exit 0
case "$(jq -r '.tool_name // empty' <<<"$input" 2>/dev/null)" in
  Edit | Write | MultiEdit | NotebookEdit) ;;
  *) exit 0 ;;
esac
path="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input" 2>/dev/null)"
case "$path" in
  */.icm/_system/* | .icm/_system/*) ;;
  */.claude/hooks/block-local-checks.sh | .claude/hooks/block-local-checks.sh) ;;
  */.claude/hooks/confirm-git-writes.sh | .claude/hooks/confirm-git-writes.sh) ;;
  */.claude/hooks/guard-plaintext-secrets.sh | .claude/hooks/guard-plaintext-secrets.sh) ;;
  *) exit 0 ;;
esac
jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny",
  permissionDecisionReason: "The folder .icm/_system/ and the three guards of .claude/hooks/ (block-local-checks.sh, confirm-git-writes.sh, guard-plaintext-secrets.sh) belong to the blueprint. Do not edit them in this repo. If a file is wrong, tell the operator: the correction is made in the blueprint and comes with the next update."}}'
exit 0
