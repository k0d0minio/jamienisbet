---
description: The per-repo workflow — adopt, interrogate intent, analyse, and cut tickets. Idempotent; re-run it any number of times.
allowed-tools: Bash(git -C:*), Bash(gh repo clone:*), Bash(_system/scripts/icm-check.sh:*), Bash(/home/jamie-nisbet/Apps/_system/scripts/icm-check.sh:*), Read, Glob, Grep, Edit, Write, Agent, AskUserQuestion
---

# /project <repo> — what are we building, and what's the next ticket?

Work from the Apps root. Argument: a repo name (`cafe-jardim`) or a client's name —
resolve with Jamie if ambiguous.

**One command, every stage of a repo's life.** First run adopts it and establishes intent.
Every run after asks whether the intent still holds and reconciles the tickets to the
answer. There is no separate onboarding, discovery or sprint-planning command — this is
all three, and running it twice in a row is harmless.

Contracts: `_system/contracts/PROJECT.md` (the register) · `_system/contracts/TICKETS.md`
(tickets) · `_system/contracts/LENSES.md` (the lenses).

**Sustentus is exempt** — its `.icm/` owns its own semantics. Refuse unless Jamie names it
explicitly, and then honour its contracts, not this one.

**Writes only inside `.icm/`** — `project.md`, `intake/`, `docs/`. Never a code file. The
lens agents write nothing at all.

## 0. Guards — never error, always land somewhere

Every one of these is a normal state, not a failure:

| Found | Do |
|---|---|
| Repo not on disk | Clone it (`gh repo clone k0d0minio/<name> projects/<name>`) |
| Repo not on GitHub | **Stop.** The dashboard creates client repos (`createClientRepo`); say so and end |
| No `.icm/` | `_system/scripts/icm-check.sh --fix`, report what it seeded |
| No `project.md` | First run — §1a |
| `project.md` present | Re-run — §1b |
| No tickets, no git history, no docs | Fine. Thin repo, thin first pass, more questions |
| Uncommitted changes | Leave them strictly alone; never `git add -A` |

## 1a. First run — establish the register

Read what already exists before asking anything: `.icm/docs/` (client requests, proposals,
discovery reports, scope decisions), `CLAUDE.md`, `README.md`, any requirements docs.

**Adopt, never fabricate.** A repo carrying scope docs or a decisions register gets them
*folded into* `project.md` with provenance cited — those decisions are already made and
must not be re-asked. Only genuine gaps become questions.

## 1b. Re-run — reconcile before asking

Read `.icm/project.md`. From its run log, take the last commit and get what has happened
since: `git -C <repo> log <sha>..HEAD --oneline` and the changed paths.

Then state the **posture** this run is in, and say it out loud so Jamie can correct it:

- **launch** — no v1 yet; the register's Features table has unshipped essentials
- **maintenance** — v1 shipped; the work is defects, health and constraint drift
- **expansion** — v1 shipped and stable; the work is new features

Posture decides where the interrogation and the lenses aim. Do not guess silently.

## 2. Scan — cheap, structural, no fan-out

Enough to ask good questions, nothing more: the stack, the routes/entry points, the ticket
state (every ID in `intake/` **and** `_done/`, and the prefix), what shipped since the last
run, and whether the register's Features table still matches reality.

**Reconcile the board first.** A ticket whose work is visibly merged goes to `_done/` now —
asking Jamie to plan around a board that is lying wastes his time. Distinguish the commit
that *created* a ticket from the one that *did the work*; where it is ambiguous, ask.
Spawn `ticket-scout` for this if the repo has real git history.

## 3. Interrogate — features and business logic first

**This is the phase that decides ticket quality.** Aim it at what the project must *do* and
the rules that govern it — not at how it looks or what library it uses. A question that
changes the feature set beats one that changes an implementation detail every time.

Ask in rounds of **at most 4**, highest-leverage first. Stop when the remaining questions
no longer change the ticket set; say what you left unasked.

**First run** — establish: who it is actually for · the one job it must do · what "done"
looks like · the business rules in the domain's own words (who can see what, what happens
when X, what must never happen) · what is explicitly out and why.

**Re-run** — lead with the register: *"Last run you decided X, Y, Z. Still true?"* Then
what has changed — new priorities, features that have become urgent, features that have
died. A re-run where nothing changed is a valid outcome: say so and skip to §7.

**Constraints are asked about, not derived.** Accessibility and technical constraints are
first-class — but they are *bounds on the work*, so ask what bar the project is held to
once, record it in the register, and let every subsequent ticket inherit it rather than
re-litigating it per feature.

**Every question carries an escape hatch.** "Don't know yet" is a real answer: it becomes
an Open question in the register, and a decision ticket if it blocks work. On a client
repo, questions only the client can answer route to a form in `.icm/onboarding/` (format:
the Apps-root `.icm/onboarding/README.md`). On Jamie's own repos there is no client —
those become decision tickets instead. Never invent a recipient.

## 4. Analyse — lenses, scoped by what §3 established

Fan out `project-lens` agents from `_system/contracts/LENSES.md`, **in a single message**
so they run concurrently. Each prompt carries: the repo path, its lens, the intent and
business logic from §3, the constraints, and the existing open ticket titles.

**Scope the fan-out — this is what makes a hundred runs affordable:**

- **First run** — every lens the repo has substance for. Say which you dropped and why.
- **Re-run, intent changed** — the lenses that intent touches, plus any whose domain the
  code changed in since the last run.
- **Re-run, intent unchanged** — only what the diff touches. A quiet week is a cheap run.

A lens with nothing to say costs one line. A lens run on a question nobody asked costs a
hundred thousand tokens and buries the findings that mattered.

## 5. Reconcile — intent in, tickets out

Synthesis is **your** job, not an agent's — it needs the whole picture and it is the only
thing allowed to write.

- **Dedupe.** Lenses converge from different sides; merge, keep the strongest evidence.
- **Drop** what an open ticket already covers and what has already shipped.
- **Rank** by what moves the project: blocks launch or revenue · harms or exposes users
  now · explicitly asked for · everything else. If a third of the list is P0, none of it is.
- **Reconcile against the register's Features table** — every finding maps to a feature
  that is *wanted* or a constraint that is breached. A finding matching nothing is either a
  new feature to add to the table, or noise to drop. Say which.

Then resolve each existing ticket against the new intent:

| Ticket vs intent | Action |
|---|---|
| Still fits | Leave it alone — untouched, not re-worded |
| Fits, wrong priority or scope | Amend in place, noting what changed and why |
| No longer fits | `git mv` to `_done/` with a `> Dropped: <reason, date>` line prepended |
| Missing | Cut it |

**Never delete a ticket file and never reuse a number** — `_done/` is where abandoned work
goes, so the record of the decision survives.

## 6. Write — register, then tickets

**Show Jamie the plan before writing:** the ticket list (ID · title · priority · size ·
which lens), what is being amended, and what is being dropped with its reason. Get his yes.

Then `.icm/project.md` per `_system/contracts/PROJECT.md` — new decisions appended with
stable IDs (supersede, never edit away), the Features table brought current, open questions
carried forward, and a run-log row with today's date and `HEAD`.

Then the tickets, per `_system/contracts/TICKETS.md`. Next `NNN` = highest across `intake/`
**and** `_done/`, plus 1. Each needs a standalone `## Prompt` that works pasted into a
fresh session, and a `Sources` row citing the evidence — the client's own words where they
exist.

## 7. Hand back

Leave everything **uncommitted** for review unless Jamie says push (ticket-only commits
straight to `main`, staged explicitly). Then print:

- Posture, and whether intent changed this run.
- Ticket counts by priority; what was added, amended, dropped.
- The three you would flag `today` — subject to the ≤3 estate-wide cap, which is `/day`'s
  call, not this command's.
- What is still unanswered, and what it blocks.
