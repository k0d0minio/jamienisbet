#!/usr/bin/env bash
# icm-check.sh — verify (and with --fix, populate) the estate-wide .icm/.claude baseline.
#
# Discovers git repos the same way pull-all.sh does (up to 2 levels below Apps/),
# skips sustentus (its .icm/ carries its own pipeline semantics, not TICKETS-SPEC.md),
# and checks each repo against _system/icm-template/:
#
#   .icm/intake/README.md    micro-copy of the ticket contract ({{PREFIX}} substituted)
#   .icm/intake/_done/       finished-ticket folder
#   .icm/docs/               ad hoc reports
#   .claude/settings.json    clean policy baseline
#   CLAUDE.md                reported only — never templated (each repo writes its own)
#
# --fix creates ONLY what is missing, from the template; existing files are never
# touched. Prefix resolution: existing tickets → known map → derived from repo name
# (flagged "suggested" — confirm before cutting the first ticket).
#
# Usage: _system/icm-check.sh [--fix] [root]
# Exit:  0 all conformant (warnings allowed) · 1 gaps remain · 2 bad invocation

set -uo pipefail

FIX=0
APPS_ROOT=""
for arg in "$@"; do
  case "$arg" in
    --fix) FIX=1 ;;
    -*) echo "Unknown flag: $arg" >&2; exit 2 ;;
    *) APPS_ROOT="$arg" ;;
  esac
done
[[ -n "$APPS_ROOT" ]] || APPS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/icm-template"

if [[ ! -d "$APPS_ROOT" ]]; then echo "Not a directory: $APPS_ROOT" >&2; exit 2; fi
if [[ ! -d "$TEMPLATE/icm" || ! -d "$TEMPLATE/claude" ]]; then
  echo "Template missing or incomplete: $TEMPLATE" >&2; exit 2
fi

EXEMPT=("sustentus")

# Known ticket prefixes (TICKETS-SPEC.md); anything else is derived + flagged.
prefix_for() {
  case "$1" in
    jamienisbet)      echo JN ;;
    remi-ai)          echo REMI ;;
    agorasim)         echo AGORA ;;
    berceo)           echo BERC ;;
    kau-american-bbq) echo KAU ;;
    vinecliff)        echo VINE ;;
    barzinho)         echo BARZ ;;
    boystomenretreat) echo BTM ;;
    collabimmo)       echo COLL ;;
    casey-hebbel)     echo CASEY ;;
    cafe-jardim)      echo CAFE ;;
    messy-play)       echo MESSY ;;
    dungeons-dragons) echo DND ;;
    *)                echo "" ;;
  esac
}

# Derive a prefix from the repo directory name: first hyphen-segment, A–Z only, ≤5 chars.
derive_prefix() {
  local seg="${1%%-*}"
  seg="$(printf '%s' "$seg" | tr '[:lower:]' '[:upper:]' | tr -cd 'A-Z')"
  printf '%s' "${seg:0:5}"
}

# Prefix already in use by tickets inside the repo (open or done), if any.
existing_prefix() {
  local f
  for f in "$1"/.icm/intake/[A-Z]*-[0-9]*.md "$1"/.icm/intake/_done/[A-Z]*-[0-9]*.md; do
    [[ -e "$f" ]] || continue
    basename "$f" | sed -E 's/^([A-Z]+)-[0-9].*/\1/'
    return 0
  done
  return 1
}

bold=$'\033[1m'; red=$'\033[31m'; green=$'\033[32m'; yellow=$'\033[33m'; dim=$'\033[2m'; off=$'\033[0m'
[[ -t 1 ]] || { bold=; red=; green=; yellow=; dim=; off=; }

mapfile -t repos < <(
  find "$APPS_ROOT" -mindepth 2 -maxdepth 3 -name .git \
    \( -type d -o -type f \) \
    -not -path '*/node_modules/*' \
    -not -path '*/.*/.*/.git' \
    -printf '%h\n' | sort
)

total=0; conformant=0; fixed=0; warnings=0; gaps=0

for repo in "${repos[@]}"; do
  name="${repo#"$APPS_ROOT"/}"
  base="$(basename "$repo")"

  skip=0
  for e in "${EXEMPT[@]}"; do [[ "$base" == "$e" ]] && skip=1; done
  if (( skip )); then
    echo "${dim}${name} — exempt${off}"
    continue
  fi

  total=$((total + 1))
  missing=(); warns=(); actions=()

  # --- .icm baseline ---
  [[ -d "$repo/.icm/intake" ]]           || missing+=(".icm/intake/")
  [[ -f "$repo/.icm/intake/README.md" ]] || missing+=(".icm/intake/README.md")
  [[ -d "$repo/.icm/intake/_done" ]]     || missing+=(".icm/intake/_done/")
  [[ -d "$repo/.icm/docs" ]]             || missing+=(".icm/docs/")

  # --- .claude baseline ---
  [[ -d "$repo/.claude" ]]               || missing+=(".claude/")
  [[ -f "$repo/.claude/settings.json" ]] || missing+=(".claude/settings.json")

  # --- report-only checks (agent/human territory, never auto-fixed) ---
  [[ -f "$repo/CLAUDE.md" ]] || warns+=("no CLAUDE.md (Layer-0 identity/routing file)")
  if git -C "$repo" check-ignore -q .icm 2>/dev/null; then
    warns+=(".gitignore excludes .icm — tickets would never reach the board")
  fi
  if git -C "$repo" check-ignore -q .claude/settings.json 2>/dev/null; then
    warns+=(".gitignore excludes .claude/settings.json — policy won't ship to cloud sessions")
  fi
  if [[ -f "$repo/.claude/settings.local.json" ]] && \
     ! git -C "$repo" check-ignore -q .claude/settings.local.json 2>/dev/null; then
    warns+=(".claude/settings.local.json is not gitignored (accretion layer should stay local)")
  fi
  for loose in TODO.md BACKLOG.md; do
    [[ -f "$repo/$loose" ]] && warns+=("loose $loose at root — should be tickets in .icm/intake/")
  done

  # --- fix ---
  if (( FIX )) && (( ${#missing[@]} > 0 )); then
    mkdir -p "$repo/.icm/intake/_done" "$repo/.icm/docs" "$repo/.claude"
    [[ -f "$repo/.icm/intake/_done/.gitkeep" ]] || : > "$repo/.icm/intake/_done/.gitkeep"
    # .gitkeep only if docs/ is empty, so it can be dropped once real docs land
    if [[ -z "$(ls -A "$repo/.icm/docs" 2>/dev/null)" ]]; then
      : > "$repo/.icm/docs/.gitkeep"
    fi
    if [[ ! -f "$repo/.icm/intake/README.md" ]]; then
      prefix="$(existing_prefix "$repo" || true)"
      src="tickets"
      if [[ -z "$prefix" ]]; then prefix="$(prefix_for "$base")"; src="map"; fi
      if [[ -z "$prefix" ]]; then prefix="$(derive_prefix "$base")"; src="suggested"; fi
      sed "s/{{PREFIX}}/$prefix/g" "$TEMPLATE/icm/intake/README.md" \
        > "$repo/.icm/intake/README.md"
      actions+=("created .icm/intake/README.md (prefix $prefix, $src)")
      [[ "$src" == "suggested" ]] && \
        warns+=("prefix $prefix is auto-derived — confirm it before cutting the first ticket")
    fi
    if [[ ! -f "$repo/.claude/settings.json" ]]; then
      cp "$TEMPLATE/claude/settings.json" "$repo/.claude/settings.json"
      actions+=("created .claude/settings.json")
    fi
    fixed=$((fixed + 1))
    missing=()
    # re-verify what we just created
    for p in .icm/intake/README.md .icm/intake/_done .icm/docs .claude/settings.json; do
      [[ -e "$repo/$p" ]] || missing+=("$p (fix failed)")
    done
  fi

  # --- report ---
  if (( ${#missing[@]} == 0 && ${#warns[@]} == 0 && ${#actions[@]} == 0 )); then
    echo "${green}ok${off}   $name"
    conformant=$((conformant + 1))
  else
    if (( ${#missing[@]} > 0 )); then
      echo "${red}GAP${off}  ${bold}$name${off}"
      gaps=$((gaps + 1))
    else
      echo "${green}ok${off}   ${bold}$name${off}"
      conformant=$((conformant + 1))
    fi
    for a in "${actions[@]}"; do echo "       ${green}+${off} $a"; done
    for m in "${missing[@]}"; do echo "       ${red}missing${off} $m"; done
    for w in "${warns[@]}"; do echo "       ${yellow}warn${off} $w"; warnings=$((warnings + 1)); done
  fi
done

echo
echo "RESULT: $total repos checked, $conformant conformant, $gaps with gaps, $fixed fixed, $warnings warnings$( (( FIX )) || echo ' (check only — rerun with --fix to populate)')"
(( gaps == 0 ))
