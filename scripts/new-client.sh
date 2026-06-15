#!/usr/bin/env bash
# new-client.sh — scaffold a client record from the _template-client skeleton.
#
# Contract (ICM script):
#   Inputs:       "<Client legal name>"   (e.g. "Acme, Lda.")
#   Outputs:      shared/clients/<slug>/ populated from _template-client/ with {{SLUG}}/{{LEGAL_NAME}}/{{DATE}} filled
#   Side-effects: creates files on disk only; nothing outbound
#   Invocation:   by the agent once a lead is qualified (see _config/conventions/macro-pipeline.md)
#
# Slug rule (client-and-slug.md): lowercase snake_case derived from the legal name. On collision the
# script STOPS and asks for human review rather than guessing a suffix.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

die() { echo "new-client: $*" >&2; exit 1; }

[ $# -ge 1 ] || die 'usage: new-client.sh "<Client legal name>"'
NAME="$*"
TEMPLATE="shared/clients/_template-client"
[ -d "$TEMPLATE" ] || die "template not found: $TEMPLATE"

# Derive slug: lowercase, non-alphanumeric runs -> "_", trim leading/trailing "_".
SLUG="$(printf '%s' "$NAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+//; s/_+$//')"
[ -n "$SLUG" ] || die "could not derive a slug from: $NAME"

DEST="shared/clients/$SLUG"
if [ -e "$DEST" ]; then
  die "collision: $DEST already exists. Per the slug convention, STOP for human review — pick a distinct slug (e.g. add a locality) and create it manually."
fi

DATE="$(date +%F)"
cp -R "$TEMPLATE" "$DEST"

# Escape replacement strings for sed (& and / are special on the RHS).
esc() { printf '%s' "$1" | sed -e 's/[&/\\]/\\&/g'; }
NAME_ESC="$(esc "$NAME")"

find "$DEST" -type f -name '*.md' -exec sed -i \
  -e "s/{{SLUG}}/$SLUG/g" \
  -e "s/{{LEGAL_NAME}}/$NAME_ESC/g" \
  -e "s/{{DATE}}/$DATE/g" {} +

echo "created: $DEST  (slug: $SLUG)"
echo "next: fill profile.md contact/NIF; the delivery build goes in the client's external repo (see repo-link.md)."
