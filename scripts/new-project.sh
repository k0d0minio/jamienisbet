#!/usr/bin/env bash
# new-project.sh — scaffold a docs-only delivery folder from the _template-project skeleton.
#
# Contract (ICM script):
#   Inputs:       <slug>   (an existing client slug, lowercase snake_case)
#   Outputs:      projects/<slug>/ populated from _template-project/ with {{SLUG}}/{{DATE}} filled
#   Side-effects: creates files on disk only; nothing outbound. The actual build lives in the
#                 client's EXTERNAL repo — this folder holds scope/milestones/acceptance/finances only.
#   Invocation:   by the agent once a deal is won (see _config/conventions/macro-pipeline.md)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

die() { echo "new-project: $*" >&2; exit 1; }

[ $# -eq 1 ] || die "usage: new-project.sh <slug>"
SLUG="$1"
printf '%s' "$SLUG" | grep -Eq '^[a-z0-9]+(_[a-z0-9]+)*$' \
  || die "invalid slug '$SLUG' — expected lowercase snake_case (use new-client.sh to derive one)"

TEMPLATE="projects/_template-project"
[ -d "$TEMPLATE" ] || die "template not found: $TEMPLATE"

DEST="projects/$SLUG"
[ -e "$DEST" ] && die "collision: $DEST already exists. Stop for human review."

# Soft check: the client record should already exist (created at the triage->proposals gate).
[ -d "shared/clients/$SLUG" ] || echo "warning: shared/clients/$SLUG not found — create the client record first (new-client.sh)."

DATE="$(date +%F)"
cp -R "$TEMPLATE" "$DEST"

find "$DEST" -type f -name '*.md' -exec sed -i \
  -e "s/{{SLUG}}/$SLUG/g" \
  -e "s/{{DATE}}/$DATE/g" {} +

echo "created: $DEST  (docs-only delivery pipeline)"
echo "next: create the client's EXTERNAL delivery repo and record its URL in shared/clients/$SLUG/repo-link.md (a separate, reviewed step)."
