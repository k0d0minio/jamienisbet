# brainstorm.md — Questions to make this system lean and powerful

> **Purpose.** Before we re-architect anything, this file gathers every open question, tension,
> and decision worth surfacing. It is the **data-gathering instrument**: answer what you can,
> ignore what doesn't matter, and the answers become the spec for the rebuild. In ICM terms this
> is a **Layer 4 working artifact** — your answers get folded back into **Layer 3** conventions
> and setup files, so we *fix the source, not the symptom* (ICM §6.3).
>
> **How to use it.** Each item leads with an **Observation** (what I actually found in the repo
> or the ICM paper), a one-line **Why it matters**, then **Questions**. Answer inline under each —
> a word or a paragraph, both are fine. You don't need to answer everything; the **[FORK]** items
> are the ones that change the architecture and are worth doing first.
>
> **Legend.**
> `[FORK]` = high-leverage; changes the architecture downstream ·
> `[CONVENTION]` = a rule to standardise once ·
> `[REFINEMENT]` = polish, can wait.

---

## 0. Honest read of where the repo is today

**Observation.** The skeleton is genuinely good: 90 files, every folder carries a detailed,
consistent `README.md` (ICM role header → Purpose → What this accomplishes → How it connects
→ Contents → Stage contract → Notes). Coverage of your founder-brief is complete — every
requirement (entity setup, proposals/negotiation, brand, affiliate program, triage, tracker,
websites, finance) maps to a folder. **But nothing is *runnable* yet:**

- **Zero scripts exist.** The ICM paper repeatedly says "local scripts handle the mechanical
  work that needs no AI." `CLAUDE.md` says "Local scripts (added later)." There is no scripts
  convention, location, or example anywhere.
- **Every `setup/` questionnaire is empty/planned.** The factory is unconfigured, so no
  pipeline can actually produce a deliverable yet.
- **Every Layer-3 reference is empty** — brand voice, visual tokens, negotiation playbook,
  pricing models, document templates. The system can't yet produce on-brand output because the
  brand is undefined.
- **The convention sub-docs are stubs.** `_config/conventions/README.md` lists five files
  (`the-five-layers.md`, `readme-as-context.md`, `building-a-workspace.md`, `review-gates.md`,
  `provenance-and-verify.md`) all marked *"(planned — do not create)"*. The protocol is
  described but not written.

**Why it matters.** The gaps are **operational/architectural, not coverage**. So this brainstorm
focuses less on "what's missing" and more on "what decisions must be made so the thing can run."

**Question 0.1** — Is the goal to make the *whole* system runnable, or to get **one** workspace
truly operational first (I'd nominate `proposals` or `legal-and-tax`) and prove the pattern before
filling the rest? *(Answer: )* The goal is to make the whole system runnable.

**Question 0.2** — What's the realistic first real-world use? A specific lead you need to close?
Setting up the PT entity? That anchors what we build first. *(Answer: )* this should help me setup my PT entity and run it efficiently.

---

## A. The big architectural forks (decide these first)

### A1. The missing automation layer — where do scripts live and what runs them? `[FORK]`

**Observation.** ICM's whole thesis is "**one agent + folders + local scripts**." The scripts are
half the method — they "handle the parts that don't need AI: fetching data, moving files,
formatting output, sending emails" (paper §1). This repo has the folders and the agent context but
**no script layer at all**, and no convention for one.

**Why it matters.** Without it, *everything* becomes an AI action — including deterministic things
(copying `_template-project/`, stamping a date, totalling an invoice, sending a reminder). That's
slower, costlier, and less reliable than a 10-line script. This is the single biggest gap.

**Questions**
- **A1.1** — Do you want a top-level `scripts/` (or `bin/`) folder as the home for all mechanical
  automation, with a convention doc in `_config/conventions/`? *(Answer: )* yes a top level scripts folder is perfect
- **A1.2** — Language: shell, Python, or Node/TypeScript? (You're a software engineer and the
  environment is Vercel/Next-leaning, so Node is plausible — but Python is the ICM paper's default
  for "no-AI" glue.) *(Answer: )* I think bash would be sufficient but if there are clear arguments for using python over bash then please do so.
- **A1.3** — Which mechanical actions do you want scripted *first*? Candidates: copy-and-rename a
  template (`new-project <client>`, `new-client <slug>`), stamp/version an `output/` run, total a
  quote/invoice, generate the morning brief skeleton, export brand assets. *(Answer: )* a generic send email script using RESEND would be great, and then new project and client generation is good too
- **A1.4** — How should a script be *invoked* — by you on the CLI, or by the agent as a tool? And
  should each script declare its own tiny contract (inputs/outputs) so it's ICM-legible? *(Answer: )* agent tool usage and it should declare its own tiny contract.

### A2. The MCP / external-service boundary — what's an agent job vs a script vs an integration? `[FORK]`

**Observation.** This environment exposes a lot via MCP: Gmail, Google Calendar, Google Drive,
Stripe, Linear, Supabase, Sanity, Vercel, Spotify, Sentry, Atlassian, Figma. `suggestions.md`
already proposes invoice-paid detection (Stripe→finance), deadline reminders (calendar),
follow-ups (Gmail). The paper frames external integration as "local scripts or MCP connections."
But there's **no rule for when to reach for which**.

**Why it matters.** Without a boundary you'll get inconsistent, hard-to-audit side effects (an
agent emailing a client mid-pipeline). ICM's safety property is that *every action is visible in a
file first*. External calls break that unless disciplined.

**Questions**
- **A2.1** — Which external services do you actually want wired in, and in what priority?
  (Gmail, Calendar, Stripe, Drive, Sanity/CMS, Vercel, accounting software?) *(Answer: )* stripe, vercel, github
- **A2.2** — Hard rule proposal: **no outbound action (email/payment/calendar write) without a
  human-reviewed file in an `output/` first.** Agree? Any exceptions (e.g. read-only calendar
  scans for the morning brief)? *(Answer: )* agreed, no exceptions for the moment
- **A2.3** — Should MCP/integration usage be declared *per stage* (e.g. an `## Integrations`
  line in the stage contract) so it's auditable, the way Inputs are? *(Answer: )* yes
- **A2.4** — Is there an accounting tool you already use (or a PT-specific one) that finance/
  legal-and-tax should integrate with rather than reinvent? *(Answer: )* stripe

### A3. Monorepo-for-the-whole-business vs ICM's "hand a client the folder" portability `[FORK]`

**Observation.** ICM's portability story is: *to give a workspace to someone, copy the folder.*
But here the **entire business is one repo**, and workspaces freely reference `_config/business/`
(your NIF, IBAN, rates), `shared/clients/` (every other client), and `tracker/personal/`. You
literally **cannot** hand a client the `proposals` workspace without leaking the rest of the business.

**Why it matters.** It's a structural tension between "one operating system for my business"
(your brief) and "portable, shareable workspace" (ICM's selling point). Probably fine — you may
never hand these out — but it should be a *conscious* decision, because it affects how tightly
workspaces are allowed to couple to global config.

**Questions**
- **A3.1** — Do you ever intend to hand a workspace to anyone else (a client, an affiliate seller,
  a future hire/contractor)? If yes, which ones? *(Answer: )* no this is entirely for personal use, client folders should only retain project scope documents and financial docs, any shared content with the client would appear in their own project's repo (that has its own ICM pipeline tailored to the needs of the client)
- **A3.2** — If portability matters even a little, should sensitive global config be injected at
  run-time (a script copies the needed facts in) rather than referenced by path? *(Answer: )* injected at run time seems like the safest option
- **A3.3** — Is this repo private-forever, or could parts (the methodology, the website code, an
  affiliate starter-kit) ever be public/open-sourced? That changes what's allowed to live where.
  *(Answer: )* this repo is private forever, however the websites code will be consumed by vercel for my own front facing customer websites.

### A4. The privacy wall (`tracker/personal/`) — convention or real enforcement? `[FORK]`

**Observation.** `tracker/README.md` declares a "hard firewall": personal data must never flow
into business output, data flows business→tracker only, never back. **But it's a prose
convention, not a technical control.** Personal todos live in the same git repo, same history,
same backups as client data and your NIF/IBAN.

**Why it matters.** "Never leak personal into business" is exactly the kind of rule an LLM can
violate by accident (it sees the file, it summarises it). And if the repo is ever shared/backed-up/
synced, personal life-admin rides along.

LET'S FORGET THIS REQUIREMENT AND ASSUME THE TASK TRACKER IS PURELY BUSINESS RELATED TASKS.

**Questions**
- **A4.1** — How strong does this wall need to be — *social* (a rule the agent follows) or
  *structural* (separate repo / git submodule / gitignored / encrypted)? *(Answer: )*
- **A4.2** — Would you rather `tracker/personal/` be a **separate private repo** that the morning
  routine reads but that never ships with the business repo? *(Answer: )*
- **A4.3** — Should there be an explicit, machine-checkable guard (e.g. a pre-output check, or a
  `DO-NOT-READ` marker the agent treats as a hard stop) rather than relying on prose? *(Answer: )*

### A5. Websites are *code*, not markdown pipelines — how do they live in an ICM repo? `[FORK]`

**Observation.** `websites/` (portfolio, personal, clients) will hold **real deployed apps**
(Next.js/Vercel, per the environment). That's a fundamentally different artifact from the
markdown-pipeline workspaces. The ICM paper is entirely about *content* pipelines; it has nothing
to say about a build/deploy/hosting concern living in the same tree.

**Why it matters.** Mixing a Node app (with `node_modules`, build steps, deploys) into a
plain-text ICM repo muddies the "folder structure is the architecture, everything is readable
markdown" property. Brand-as-design-tokens also has to cross the markdown→code boundary.

**Questions**
- **A5.1** — Do the websites live *in this repo* (monorepo) or in **separate repos** that merely
  *consume* the brand tokens from here? *(Answer: )* My websites live here; portfolio, payment gateway, admin dashboard, all my client websites live in their own respective repos
- **A5.2** — One framework/stack standard for all sites (Next.js + Vercel + a CMS like Sanity)?
  Or per-site choices? *(Answer: )* NextJs vercel, don't configure sanity by default.
- **A5.3** — Brand-as-code: do you want `_config/brand/visual/` to emit **machine-readable design
  tokens** (JSON/CSS variables) that both documents *and* websites import, so one brand change
  updates everything (`suggestions.md` #4)? *(Answer: ) * yes
- **A5.4** — Should client sites under `websites/clients/` be one-template-per-site (like
  `_template-site/`) and is hosting/billing your concern or theirs? *(Answer: )* client sites should not live in this repo

### A6. How does the system know "where everything stands"? (state & status) `[FORK]`

**Observation.** Many things imply state — `shared/clients/<slug>/deals.md` (active opportunities,
stage), `lead-generation/05_pipeline` (the pipeline), the morning brief surfacing "anything
overdue," `suggestions.md` #7's metrics dashboard. **But there's no single, machine-readable place
that records the current state** of leads, deals, projects, invoices, or deadlines.

**Why it matters.** "Surface what's overdue" and "is this worth my time (with data)" both need a
queryable state. Scattering status across prose READMEs and per-client files means the morning
routine has to crawl everything every day, and nothing can be reliably reported on.

**Questions**
- **A6.1** — Do you want a small **structured state layer** — e.g. a `state/` index or per-entity
  front-matter (YAML) in client/deal/project files — that scripts and the morning brief can read
  without re-reading every folder? *(Answer: )* yes
- **A6.2** — What are the *statuses* that matter to you? (Lead: new/qualified/proposed/won/lost;
  Project: discovery/build/delivery/closed; Invoice: draft/sent/paid/overdue.) *(Answer: )* lead (new, qualified, proposed, won, lost.), project (discovrey, build, delivery, closed), invoice (draft, sent, paid, overdue)
- **A6.3** — Which metrics do you actually want to see (pipeline value, win rate, monthly revenue,
  utilisation, tax reserve, overdue receivables)? That defines the data model. *(Answer: )* pipeline value, win rate, monthly revenue, tax reserve, overdue receivables.
- **A6.4** — Is plain-text-with-front-matter enough, or do you want a real datastore (SQLite /
  Supabase) for finance + pipeline, with markdown as the human-editable surface over it? *(Answer: )* plain text with front matter is enough.

---

## B. ICM fidelity & conventions

### B1. Stage contracts: `README.md` prose vs the paper's machine-parseable Inputs table `[CONVENTION]`

**Observation.** The paper calls the stage **Inputs table** "the control point of the entire
system" (§3.2) and uses a dedicated `CONTEXT.md` with strict `## Inputs / ## Process / ## Outputs`.
This repo deliberately fuses Layer 2 into the folder's `README.md` (a reasonable choice, stated in
`CLAUDE.md`) and writes the contract as prose under a "Stage contract" heading. It's readable, but
**not consistently structured** — e.g. `proposals/03` has a clean `Inputs/Process/Outputs/Verify/
Review gate`, but the format isn't guaranteed identical everywhere.

**Why it matters.** A strictly structured contract is what lets an agent (and later, a script)
load *exactly* the right context and verify it did so. Loose prose re-introduces the "agent uses
its own judgment about what to load" problem ICM exists to prevent.

**Questions**
- **B1.1** — Lock a **canonical stage-contract schema** (e.g. always
  `Inputs → Process → Outputs → Integrations → Verify → Review gate`) and enforce it across all
  stages? *(Answer: )* yes
- **B1.2** — Keep the contract inside each `README.md`, or split a thin `CONTEXT.md` per stage as
  the paper does (machine-loadable, README stays human narrative)? *(Answer: )* yes
- **B1.3** — Should Inputs explicitly tag each line with its **layer** (Layer 3 reference vs
  Layer 4 working) as the paper insists — so the model knows what to *internalise as rules* vs
  *process as input*? Some stages do this; should all? *(Answer: )* yes

### B2. Provenance, Verify, and traceability (the paper's §6 future directions) `[CONVENTION]`

**Observation.** `suggestions.md` #6 and the paper's §6 both push: outputs should **cite the
source instruction/reference that produced them** (provenance markers), every stage should have a
**Verify** step, and recurring human edits should trigger a **source fix** not a one-off patch.
Today only some stages have a `Verify` section; there's no provenance convention.

**Why it matters.** This is what makes the system *improve over time* instead of needing the same
correction every run. It's also your audit trail for legal/tax/financial output.

**Questions**
- **B2.1** — Make `Verify` **mandatory** in every stage contract (with concrete cross-checks
  against earlier stages)? *(Answer: )* yes
- **B2.2** — Adopt lightweight **provenance markers** in real outputs (e.g. a footer line citing
  which reference/playbook section drove each claim)? Worth the noise? *(Answer: )* yes
- **B2.3** — Do you want a standing **edit-log → source-fix loop**: when you edit the same kind of
  output 2–3 runs running, the system proposes a Layer-3 change (paper §6.3)? *(Answer: )* yes

### B3. Folder numbering vs hard-coded cross-references (fragility) `[CONVENTION]`

**Observation.** ICM says "reorder stages by renaming folders." But stages reference each other by
**relative path** (`../02_deal_analysis/output/`). Renumbering or inserting a stage (the template
even suggests `02a_design/`) **breaks those links**.

**Why it matters.** The "just rename a folder" superpower is partly an illusion once stages
cross-reference by number. Need a convention to keep it cheap.

**Questions**
- **B3.1** — Reference prior stages by **role/name** ("the deal-analysis output") rather than
  number, or accept that reordering means a find-replace pass? *(Answer: )* reference via number, I accept that reordering means a find-replace pass
- **B3.2** — Standardise the **insert-a-stage** pattern (the `02a_` suffix) so numbering survives
  edits, and document it in `building-a-workspace.md`? *(Answer: )* yes standardise.

### B4. Output versioning, re-runs, and idempotency `[CONVENTION]`

**Observation.** `proposals/output/<client>/` holds a run per client. **What happens on a second
run** (renegotiation, revised quote)? Overwrite? New dated folder? The paper suggests committing
outputs to git for version history, but there's no stated convention here.

**Questions**
- **B4.1** — Run-versioning scheme: `output/<client>/` overwrites and git keeps history, **or**
  `output/<client>/<date-or-vN>/` keeps every run side-by-side? *(Answer: )* every run side by side
- **B4.2** — Should each `output/` run carry a small header (date, which setup version, which
  input run it consumed) for traceability? *(Answer: )*  yes
- **B4.3** — Do you want a **git commit per stage/run** convention (paper's "version history of
  the pipeline") so every deliverable is diffable? *(Answer: )* yes

### B5. Write the actual convention docs `[REFINEMENT]`

**Observation.** Five convention docs are referenced-but-planned. Until written, the protocol
lives only in headers and the paper.

**Question B5.1** — Priority order to actually author these? My suggested order:
`building-a-workspace.md` → `review-gates.md` → `provenance-and-verify.md` →
`the-five-layers.md` → `readme-as-context.md`. Agree? *(Answer: )* agreed

---

## C. Business data model & the macro-pipeline

### C1. The client slug — the spine that threads a client end-to-end `[CONVENTION]`

**Observation.** `suggestions.md` #6 flags this and it's real: a client appears in
`shared/clients/<slug>/`, `proposals/output/<slug>/`, `projects/<slug>/`, and
`websites/clients/<slug>/`. The slug **must be identical everywhere** or an agent can't trace one
client across the business. Proposals says `output/<client>/`; clients says `acme_lda/`
(snake_case). Need one rule, enforced.

**Questions**
- **C1.1** — Confirm the slug format: lowercase `snake_case`, derived how (legal name? trading
  name?) and who/what assigns it (a `new-client` script)? *(Answer: )* lowercase snake case is perfect, derive it from legal name. the new client script is perfect for scaffolding this
- **C1.2** — Collision/rename policy (two "Acme"s; a client rebrands)? *(Answer: )* if any collision is detected, surface it and request human review/change

### C2. The pipeline-of-pipelines is implied but undocumented `[CONVENTION]`

**Observation.** The macro-flow is: `lead-generation → project-triage → proposals → projects →
finance`, with `shared/clients` as the connective tissue. The root README narrates it, but **no
single artifact defines the cross-workspace handoffs** (what triggers the next workspace, what
file is the baton).

**Questions**
- **C2.1** — Want an explicit **macro-pipeline map** (a Layer-3 doc) showing each workspace→workspace
  handoff, the trigger, and the file passed? *(Answer: )* yes
- **C2.2** — Is `project-triage` a *gate before* `proposals` (qualify, then pitch), or can it run
  standalone for "give the customer fast feedback on the spot" (your brief)? Both? *(Answer: )* both
- **C2.3** — At what exact moment does a lead get a `shared/clients/` folder — first contact, or
  only once qualified? *(Answer: )* only once qualified

### C3. Finance is a ledger, not a content pipeline `[FORK]`

**Observation.** `finance/` has stages (income/expense/tax-reserve/reporting) but its real nature
is **accumulating structured records over time** (every invoice, every expense, IVA/IRS/Segurança
Social reserves). That's a ledger/database shape, which sits awkwardly as a markdown "run produces
a deliverable" pipeline.

**Questions**
- **C3.1** — Data model for finance: append-only markdown/CSV ledgers, JSON, or SQLite/Supabase
  with markdown reports generated on top? *(Answer: )* append only markdown, csv ledgers.
- **C3.2** — The auto tax-reserve split (`suggestions.md` #5): which rates/percentages do you want
  reserved per income event (IVA, IRS retention, Segurança Social), pending your *contabilista*'s
  confirmation? *(Answer: )* this will get answered when I decide on a business structure
- **C3.3** — Reporting cadence you need (monthly P&L, quarterly IVA, annual)? That sets the
  `04_reporting` stage. *(Answer: )* monthly P&L, quarterly IVA.

### C4. The learning loop — win/loss, case studies, "fix the source" `[REFINEMENT]`

**Observation.** `shared/knowledge/` is meant to hold reusable playbooks/case studies;
`suggestions.md` #1–2 propose a testimonial engine and a win/loss log that feeds the negotiation
playbook. There's no defined mechanism to *capture* and *feed back* these lessons.

**Questions**
- **C4.1** — After each won/lost deal and each delivered project, what's the minimal capture you'd
  actually do (a 3-line result + quote)? Who/what prompts it? *(Answer: )* a 3 line result + quote, I would start a claude session and give the information to claude to add it to the appropriate section
- **C4.2** — Should the proposals workspace **read** the win/loss log as Layer-3 reference so the
  coach measurably improves over time? *(Answer: )* yes

---

## D. Per-workspace deep dives

### D1. `legal-and-tax` (your stated first priority) `[FORK]`

**Observation.** Five stages, mixing **one-time** setup (entity options, execution) with
**recurring** operations (compliance calendar). It's your brief's #1 ("entity not set up yet…
focus on this first").

**Questions**
- **D1.1** — Current status: sole trader (*trabalhador independente*) vs a company (*Lda./
  Unipessoal*)? NHR/IFICI tax regime in play? Already have a *contabilista*? This determines almost
  everything downstream. *(Answer: )* currently nothing is set up, sole trader seems to be the most logical decision but I'm not sure yet.
- **D1.2** — Do you want this workspace to produce a **decision-support pack you hand to a
  contabilista**, or to go further and draft filings? (The standing rule says decision-support
  only.) *(Answer: )* decision support only
- **D1.3** — Should the `05_compliance_calendar` output feed **Google Calendar** (via MCP) and the
  morning brief automatically? *(Answer: )* no
- **D1.4** — How do we keep PT-law references from going stale (`suggestions.md` #6 date-stamping)?
  Want a "source + as-of date" convention on every legal/tax note? *(Answer: )* yes

### D2. `proposals` (the flagship) `[REFINEMENT]`

**Observation.** Strong design already: 7 stages, `03_negotiation_strategy` is the heavy gate with
target-vs-floor and a talk-track. The defining bias is "ask as many questions as possible before
advising."

**Questions**
- **D2.1** — What are *your* real numbers — standard day/project rate, the floor you never go
  below, your anchor appetite? (Goes into `setup/`.) These power the whole negotiation engine.
  *(Answer: )* 120€/hour, open to reduced rate in return for commission or incentive based compensation, ongoing monthly retainers would also incur a slight hourly rate reduction.
- **D2.2** — Tiered good/better/best as a **default** in every quote (`suggestions.md` #2)? *(Answer: )* yes
- **D2.3** — The intake interrogation — do you want it **adaptive** (the agent keeps asking until
  it has enough), and is there a checklist of must-know facts before it'll proceed? *(Answer: )* yes make it adaptive, please draft a checklist for me.
- **D2.4** — Value-based pricing calculator (`suggestions.md` #2): do you want to price against the
  client's upside, and can you estimate that upside in your typical deals? *(Answer: )* price against the client's upside.

### D3. `lead-generation` + the affiliate program `[FORK]`

**Observation.** Five stages including `03_affiliate_program`. Your brief's signature idea: local
friends sell landing pages, they get 10%. `suggestions.md` #1 proposes per-seller referral codes,
a productised fixed-scope offer, and a seller starter-kit.

**Questions**
- **D3.1** — The productised offer: what's the **fixed scope and starting price** of the landing
  page your sellers pitch? (Sellers need one sentence + one price.) *(Answer: )* sellers are free to quote just about any amount with a minimum of 200€, they are free to quote without my approval or verification for a landing page + contact us form. Anything more complex requires a back and forth between seller and myself.
- **D3.2** — Referral attribution: unique codes per seller, logged at first contact, to make the
  10% unambiguous — agree, and where's the source of truth (a `sellers/` registry)? *(Answer: )* a public facing sellers website will allow inputing a lead with the referral code.
- **D3.3** — Payout mechanics: when does 10% trigger (on payment received?), and do you need a
  simple statement per seller? *(Answer: )* payment to seller upon payment received from client.
- **D3.4** — Beyond the affiliate idea: are reciprocal partner referrals (accountants, print shops,
  co-working, agencies — `suggestions.md` #1) worth a stage? Any social presence at all, or keep it
  strictly word-of-mouth? *(Answer: )* partner referrals is good too, that should be a part of the public facing sellers website.

### D4. `project-triage` `[REFINEMENT]`

**Observation.** Three stages (intake/assessment/recommendation). Dual purpose in your brief:
(a) decide if a project is worth your time / if a better solution exists, and (b) give a customer
**structured feedback on the fly** without "I'll get back to you."

**Questions**
- **D4.1** — What's your **go/no-go rubric**? (Fit, budget, your interest, strategic value,
  "is there an off-the-shelf tool that beats me?") This is the heart of the assessment stage.
  *(Answer: )* fit, budget, strategic value.
- **D4.2** — For the "on-the-fly feedback" mode: how fast/lightweight must it be — a 5-minute
  verbal-ready summary? *(Answer: )* exactly
- **D4.3** — Should triage be honest enough to **recommend a competitor/SaaS** when that genuinely
  serves the client better (reputation play)? *(Answer: )* yes

### D5. `tracker` (covered in A4, plus) `[REFINEMENT]`

**Questions**
- **D5.1** — What should a perfect **morning brief** contain, in priority order? (Overdue invoices,
  today's deadlines, stalled deals, personal must-dos?) *(Answer: )* yes
- **D5.2** — Add the Friday **weekly review** routine (`suggestions.md` #3)? What would it scan?
  *(Answer: )* yes, it should scan everything.
- **D5.3** — How do todos get *in* — you type them, or the agent proposes them from pipeline state?
  *(Answer: )* both

### D6. `websites` (covered in A5, plus) `[REFINEMENT]`

**Questions**
- **D6.1** — Portfolio: auto-suggested entries from completed projects (`suggestions.md` #4), or
  hand-curated? *(Answer: )* auto suggested from completed projects.
- **D6.2** — What's the immediate website need — your own portfolio live first, or a client/affiliate
  landing-page template to sell? *(Answer: )* portfolio first

---

## E. Brand, identity & language

**Observation.** `_config/brand/` splits visual / voice / assets, and is the declared single source
of truth feeding websites *and* documents. All three are empty. Your founder email is `.be`
(Belgian) and you're in Portugal — clients could be PT, EN, or other.

**Questions**
- **E1** — Brand starting point: do you have *any* existing logo, colours, name treatment, or are
  we designing from zero? *(Answer: )* we are desiging from zero, incoming emails can go to contact@jamienisbet.com, eventually outgoing mails will be delivered from this too. there is no existing logo, colours or name treatment.
- **E2** — The vibe you want (the README guesses "trustworthy, expert, approachable" for a
  word-of-mouth consultant) — right, or different? *(Answer: )* this is right, i want to put an emphasis on the friendly informative tone of voice, this will build trust in my expertise and confidence in the ease of working with me
- **E3** — **Languages.** Do proposals/contracts/invoices/website need **Portuguese, English, or
  both**? Is multi-language a first-class requirement (templates in two languages, a `language`
  field per client driving output)? *(Answer: )* english first
- **E4** — Is the business brand "Jamie Nisbet" (personal) or a trading name? Affects entity,
  domains, and brand. *(Answer: )* the business brand is indeed Jamie Nisbet.

---

## F. Operating the system day-to-day

**Observation.** There's no defined **entry point / runner**. The `CLAUDE.md` routing table is the
closest thing to "how do I start a task." The tracker's morning routine is "planned." In practice,
how do *you* drive this — what do you type, what does the agent do?

**Questions**
- **F1** — Day-to-day, do you want to drive via **natural language** ("run proposals for Acme"),
  **slash-commands / scripts** (`./new-project acme`), **scheduled Claude routines** (morning brief,
  invoice chaser), or all three? *(Answer: )* I will setup claude routines for the morning brief, friday review and invoice chaser. Slash commands and scripts should be used exclusively by agents and everything shoul be driven via natural language.
- **F2** — Which **recurring routines** do you want scheduled, and at what cadence? (Morning brief
  daily, invoice chaser weekly, compliance check monthly, weekly review Fridays.) *(Answer: )* yes
- **F3** — How much **autonomy** do you grant per task type? (Draft-and-wait for everything client-
  facing; auto-run for read-only scans and internal formatting?) *(Answer: )* draft and wait for everything client facing, and auto run for read only scans and internal formatting
- **F4** — Do you want a single **"start here" operator guide** (a runbook) distinct from the
  architectural README — i.e. the human's daily cheat-sheet? *(Answer: )* yes

---

## G. Governance, risk & compliance

**Observation.** The "decision-support only" disclaimer for legal/tax/financial is repeated as
prose across many files. Client data is flagged as GDPR/RGPD-sensitive in `shared/clients/`.

**Questions**
- **G1** — Make the disclaimer a **single referenced standard** (one Layer-3 file every relevant
  output cites) instead of copy-pasted prose, so it's consistent and maintainable? *(Answer: )* yes
- **G2** — GDPR/RGPD: do you want a minimal **data-handling note** (what client data you keep, how
  long, lawful basis) given you store NIF/VAT and contact details? *(Answer: )* yes
- **G3** — Contracts: will a Portuguese lawyer review the master contract template **once** so
  every generated contract inherits a vetted base (`suggestions.md` #7)? *(Answer: )* most likely but it won't be done for a while
- **G4** — Secrets: where do API keys / IBAN / credentials live (env vars, never committed)? Worth
  stating explicitly before any integration work. *(Answer: )* business details like IBAN, NIF and other can be stored explicitly in the repo, sensitive data will be stored in .env files and in the vercel environment variable store.

---

## H. Scaling & evolution

**Observation.** The repo is built to grow by *copying folders*. The ICM paper also notes
sub-agent delegation (Opus orchestrates, Sonnet does sub-tasks) driven by the folder structure.

**Questions**
- **H1** — When does a recurring need become its **own workspace** vs a **stage** in an existing
  one? Want a stated rule (e.g. "if it has its own setup + 3 stages and runs independently → new
  workspace")? *(Answer: )* yes, sounds good.
- **H2** — Model strategy: are you happy letting the agent pick models, or do you want a stated
  policy (heavy reasoning for negotiation/triage, cheaper for formatting/scans)? *(Answer: )* heavy reasoning for negotiation and triage and cheaper for formatting/scans.
- **H3** — Capabilities you can foresee wanting in 6–12 months that we should leave room for now
  (content/marketing pipeline, a course/productised service, hiring/subcontracting, recurring
  retainer clients)? *(Answer: )* I already have a recurring retainer client, so we should account for that type of client from the jump.
- **H4** — How will you know a workspace is "correctly built" before using it on a real client —
  do you want a **validation checklist** (the paper's workspace-builder has one) per new workspace?
  *(Answer: )* yes

---

## I. Prioritisation — what to build first

**Observation.** Everything above is sequenceable. My instinct, for "lean and powerful, fast":

1. **Decide the forks** (Section A) — scripts layer, MCP boundary, privacy wall, websites
   placement, state layer. These unblock everything.
2. **Lock conventions** (Section B + C1/C2) — stage-contract schema, client slug, run-versioning,
   macro-pipeline map. Cheap now, expensive later.
3. **Configure one workspace end-to-end** — I'd pick `legal-and-tax` (your stated #1) *or*
   `proposals` (highest revenue leverage) — fill its `setup/` and references, run it for real.
4. **Brand minimum viable** — enough voice + visual tokens to make that first workspace's output
   look/sound right.
5. **Stand up the tracker morning routine** — immediate daily value, low risk.

**Questions**
- **I.1** — Does that order match your priorities, or do you want to flip something (e.g. brand or
  websites first because a live portfolio drives leads)? *(Answer: )* that order seems good to me
- **I.2** — What does **"powerful" mean to you** concretely — fewer hours on admin, higher close
  rate, never missing a deadline, looking bigger than a one-person shop? Knowing the target metric
  shapes every trade-off. *(Answer: )* fewer hours on admin, higher close rate, and never missing a deadline. I don't need to look bigger than a one-person shop, if the client wants to feel like a team is behind the project I have contractors on standby for large scale projects.
- **I.3** — Anything in your head that **isn't represented anywhere** in the repo or this file yet?
  *(Answer: )* no

---

### Appendix — tensions I'm flagging as the highest-leverage to resolve

| # | Tension | Section | Why it's high-leverage |
|---|---|---|---|
| 1 | No script/automation layer exists, though ICM depends on it | A1 | Half the methodology is missing; everything is needlessly an AI action |
| 2 | No rule for MCP/external actions; outbound side-effects unaudited | A2 | Safety + cost; breaks ICM's "visible in a file first" property |
| 3 | Whole-business monorepo vs ICM's portable, shareable workspace | A3 | Determines how tightly workspaces may couple to global config |
| 4 | Privacy wall is prose, not enforced | A4 | Personal data shares repo/history/backups with client data |
| 5 | Websites are code inside a markdown-pipeline repo | A5 | Different artifact class; brand must cross markdown→code |
| 6 | No machine-readable state for deals/projects/invoices | A6 | "What's overdue / is it worth it" needs queryable state |
| 7 | Stage contracts are prose, not the paper's strict Inputs table | B1 | Re-introduces the "agent guesses what to load" problem |

> Once you've marked up answers, the next step is to turn the resolved forks into **Layer-3
> conventions** and **`setup/` files**, then make one workspace genuinely runnable. That's the
> rebuild — and this file is its spec.
