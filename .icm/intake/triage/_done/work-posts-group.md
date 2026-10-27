# Stub: Show posts beside the case studies on /work

- lane: tweak
- found-by: house content module (legible-consulting/house#100) · 2026-10-27
- complexity: medium
- priority: P1

## Problem

The site shows case studies only. The house `content/` module writes posts, and Jamie decided on 2026-10-26 that posts live in /work at `/work/posts/<slug>`. The site has no loader, no page and no list for posts.

## Proposed change

Read posts from `content/posts/*.md`. Show a posts group on /work after the case studies. Give each post a page at `/work/posts/<slug>`.

## Acceptance criteria

- [ ] `lib/posts.ts` reads `content/posts/*.md` on the server, skips a slug that starts with `_`, skips a post whose `ready` is not `true`, and sorts the posts newest first.
- [ ] `/work` shows the case studies first, then a posts group. With no ready post, `/work` shows no posts group.
- [ ] `/<locale>/work/posts/<slug>` shows the post title, date, summary and body, with a canonical URL and the language alternates.
- [ ] `app/sitemap.ts` lists each ready post for each locale.
- [ ] The new copy is in `messages/en.json`, `fr.json` and `pt.json`.
- [ ] The home page's selected-work section does not change.

## Notes

- Frontmatter: `slug`, `title`, `summary`, `date` (YYYY-MM-DD), `source` (a house path, never shown), `ready`.
- This pull request adds no post file. Jamie copies a ready post into `content/posts/` by hand until a publish run carries it.
- Do not touch `content/work/`, `lib/services.ts` or the services messages.
