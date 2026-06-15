# Daily Brief Archive

> **ICM role:** Layer 4 — working (handoff / archive)
> **Purpose:** The dated archive of morning briefs — one file per day, the only output the tracker writes.

## What this folder accomplishes
Every run of [`../routine/`](../routine/) drops a single dated brief here. Over time this becomes Jamie's daily log: what was on the plate each morning, what was overdue, what carried over. It is the standalone tracker's one output surface; nothing downstream in the business consumes it.

## How it connects to the architecture
- **Upstream / reads from:** [`../routine/`](../routine/) (the only writer)
- **Downstream / feeds:** the human (review and the next morning's run, for carry-over); no business pipeline
- **Draws on (Layer 3 reference):** [`../../_config/conventions/`](../../_config/conventions/) for the brief format

## Contents
- `YYYY-MM-DD-brief.md` — one dated brief per day: today's todos, overdue items, sourced deadlines (planned; do not create — produced per run)

## Notes
Briefs contain a mix of business and personal items in clearly separated sections; because personal content lands here, the whole archive inherits the tracker's privacy boundary and must never be merged into a business deliverable. As an edit surface, each brief can be reviewed and ticked off by the human; the next morning's run can read the prior brief for carry-over. Keep one file per day, named by date, so the archive sorts chronologically. Any finance or compliance dates echoed here are decision-support reminders only and require review by a licensed Portuguese contabilista certificado / lawyer.
