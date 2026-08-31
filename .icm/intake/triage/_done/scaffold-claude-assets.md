# Stub: The scaffold can't seed `.claude/` — the contents API can't commit an executable

- feature-slug: scaffold-claude-assets
- lane: chore
- found-by: settling `scaffold-root-rails`, 2026-08-30
- priority: P2
- size: M

## What this is

`scaffoldIcmBaseline` (`websites/admin-dashboard/lib/icm-scaffold.ts`) now seeds
`_system/template/icm/` and `_system/template/root/opencode.json` into a freshly created
client repo. It does **not** seed `_system/template/claude/`, and that is a gap worth
closing eventually: per the template's own README, `.claude/` is canonical for *every*
live repo, and `icm-check.sh` counts `.claude/`, `.claude/settings.json` and each
canonical skill/hook as **missing** — a red gap, not a warning — in a repo that lacks
them. A repo born from the dashboard therefore lands with no hooks and no ticket-craft /
pr-conventions skills, which is exactly the knowledge a cloud session in a brand-new
client repo has no history to learn from.

The reason it was left out is mechanical, not a judgement call. The seeded
`settings.json` wires both hooks by bare path:

```
"command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh"
```

so `session-start.sh` and `wrap-reminder.sh` must be committed **executable**
(`icm-check.sh --fix` `chmod +x`s them after copying). The GitHub *contents* API —
the single mechanism `commitRepoFile` and the whole scaffold are built on — always
writes mode `100644` and offers no way to say otherwise. Seeding them anyway would
leave a repo whose hooks look present and never run, and which `--fix` would then
decline to repair because the files already exist: a silent broken state in place of a
visible, repairable gap. So the gap was kept.

## What closing it takes

The git **tree** API, which is the only way to set `100755`:

1. `GET /repos/{repo}/git/ref/heads/{branch}` → the base commit, then its tree.
2. `GET /repos/{repo}/git/trees/{sha}?recursive=1` → the set of paths that already
   exist, so the never-overwrite rule survives (today it comes free from the contents
   API's 422).
3. `POST /git/trees` with `base_tree` and one entry per new file — `mode: "100755"` for
   `hooks/*`, `100644` for everything else; the tree API takes inline `content`, so no
   separate blob call.
4. `POST /git/commits`, then `PATCH /git/refs/heads/{branch}`.

Worth knowing: this also collapses the seed from one commit per file (a dozen-odd
commits in the first minute of a repo's life) to a single "Seed the estate baseline"
commit, which is what a scaffold should look like in `git log`. Once it exists, adding
`{ from: "claude", to: ".claude/" }` to `SOURCES` in `lib/icm-scaffold.ts` is the whole
of the feature — the walk is already generic over template folders.

Nothing is broken today: `icm-check.sh --fix` closes the gap correctly on a machine that
has a checkout, which is how every repo in the estate got its `.claude/`.
