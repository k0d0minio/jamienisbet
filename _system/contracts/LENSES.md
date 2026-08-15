# Discovery lenses — the `/project` roster

*Reference for the `/project` command and the `project-lens` agent. Lenses fan out
read-only over one repo; the command synthesises, interrogates Jamie, and writes.
Companions: [PROJECT.md](PROJECT.md) (what intent they serve) ·
[TICKETS.md](TICKETS.md) (what findings become).*

Edit this file to change the roster — the command reads it, so no command edit is needed.

## Lenses serve intent; they do not set it

By the time a lens runs, `/project` §3 has established what the project is *for*, the
business rules that govern it, and the constraints it is held to. Every lens prompt carries
that. **A lens is checking reality against a stated intent** — not deciding what the
project should be.

Two consequences worth stating, because they are the difference between a useful report and
a hundred thousand tokens of noise:

- **A gap only matters if intent wants it.** A missing feature nobody asked for is not a
  finding. Say it once under *Nothing-to-build* and move on.
- **Constraints come from the register, not from the lens's opinion.** If the register says
  WCAG 2.2 AA, audit against that. If it says "no bar set", say so and raise it as a
  question rather than inventing one.

## Which lenses run

`/project` scopes the fan-out — the roster is a menu, not a checklist:

| Run | Lenses |
|---|---|
| First run | Every lens the repo has substance for; say which were dropped and why |
| Re-run, intent changed | The lenses intent touches, plus any whose domain the code changed in |
| Re-run, intent unchanged | Only what the diff touches |

Posture shifts the weighting too: **launch** favours product and data (does the shape hold
up), **maintenance** favours tech, ux and legal (what is decaying), **expansion** favours
product and market (what is missing).

## The contract every lens shares

Each returns **findings** (things to build or fix) and **questions** (things nobody has
decided). A finding without evidence is an opinion — cite the file, the line, or the
client's own words. A question without a `who` is noise.

| Field | Values |
|---|---|
| `who` | `jamie` (his call) · `client` (only they know) · `either` |
| `blocker` | yes = a responsible build (or quote) is not possible without the answer |
| `size` | S / M / L — honest, not flattering |

## The seven

### 1 · product — does the built thing match the intent
Reads the register's Intent and Features table first, then `.icm/docs/` (the client's own
words), then the app's routes and pages. Looks for: features marked *wanted* with nothing
built or ticketed; features built that intent never asked for; promises in docs that no
code keeps; the next feature the stated job implies. Feature ideation belongs here — always
grounded in the stated job, never a wishlist.

### 2 · copy — voice, message, and the placeholder graveyard
Reads page copy, metadata, markdown content, i18n files. Looks for: lorem/TODO/placeholder
text still rendering; the value proposition above the fold, or its absence; stale dates and
dead years; missing or duplicated meta titles; i18n keys present in one locale and not
another; empty, error and loading states that say nothing; domain vocabulary that
contradicts itself between screens.

### 3 · ux — flows and accessibility
Reads components, forms, layouts, global styles. Audits against **the accessibility bar in
the register** — and where none is set, says so rather than assuming one. Looks for: the
tap-count of the primary flow; keyboard traps; forms with no error or success state;
anything that breaks at the narrowest supported width; contrast, focus rings, alt text,
label/input association, heading order, touch targets. Prefer a handful of real cited
failures over an audit-shaped list of maybes.

### 4 · data — the shape of state, and everything it talks to
Reads schema/migrations, queries, API routes, webhook handlers, `.env.example` (**never**
`.env*` itself — globally denied, and rightly). Looks for: **entities the business logic
requires that the schema cannot hold** — usually the highest-value finding in the whole
run; queries with no index behind them; env vars in code but not in `.env.example`, and
vice versa; integrations half-wired; auth boundaries that assume rather than check. **Flag
any plaintext credential immediately — that is a P0, always.**

### 5 · market — who else serves these users
The only lens that goes outside the repo (`WebSearch` / `WebFetch`). On a commercial
project: competitors, positioning, table stakes, pricing norms. On a personal or internal
one, reframe to a **feature-coverage map** — what comparable tools give top-level real
estate to, and which of those the register wants. Say plainly when research is thin rather
than padding it. Most output here is context, not tickets.

### 6 · legal — what could bite
Reads privacy/cookie/terms pages, analytics and tracking, forms collecting personal data,
licensing, anything sector-specific in `.icm/docs/`. Looks for: personal data with no
lawful basis or notice; trackers set before consent; content licensing and attribution
duties; retention and deletion undefined; sector licensing rules. **Be proportionate** — a
hobby project does not need enterprise compliance apparatus, and "nothing to do here" is a
valuable finding. Portugal/EU context matters; say which regime applies. Tag anything
needing real counsel `[LAWYER]`.

### 7 · tech — health, security, and what will hurt later
Reads config, dependencies, CI workflows, error handling, build setup. Looks for: unpinned
or abandoned dependencies with known advisories; missing security headers; no error
tracking on a production app; CI that does not actually gate the merge; obvious performance
costs; dead code and dead routes; workflows that report success while skipping their job.
**Never run the build, lint, typecheck or tests** — read the config and the CI results.
CI is the source of truth.

## Synthesis is not a lens

Ranking, deduping and cutting tickets is the command's job — it needs the whole picture and
it is the only thing allowed to write. Lenses propose; the command decides. `ticket-scout`
covers the eighth angle (work in flight that no ticket knows about) and runs in `/project`
§2, before the interrogation, so the board is honest before Jamie is asked to plan against
it.
