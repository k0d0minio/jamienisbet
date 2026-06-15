# Triage Output

> **ICM role:** Layer 4 — working
> **Purpose:** Hold the per-run triage records and the customer-facing feedback deliverables produced by the pipeline.

## What this folder accomplishes
This is where finished triage runs land. Each entry is the durable record of one decision: the intake, the assessment, the go/no-go call, and the structured feedback page that was (or can be) handed to the customer. It is the workspace's portfolio ledger — Jamie can scan it to see what he said yes to, what he redirected, and why, giving the high-level cross-project view the business needs.

## How it connects to the architecture
- **Upstream / reads from:** [`../stages/03_recommendation/output/`](../stages/03_recommendation/output/) (decision + customer feedback), which in turn draws on stages 01 and 02
- **Downstream / feeds:** on GO -> [`proposals/`](../../proposals/) and a new pipeline copied from [`projects/_template-project/`](../../../projects/_template-project/); outcomes logged to [`lead-generation/`](../../lead-generation/) and the [`shared/clients/`](../../../shared/clients/) registry
- **Draws on (Layer 3 reference):** [`../references/`](../references/) for the structure each record follows

## Contents
- `<slug>/` — planned: one folder per triaged idea, holding its decision record and customer feedback page
- `triage-log.md` — planned: running index of all triage decisions (GO / NO-GO / REDIRECT) for the portfolio view

## Notes
This is per-run Layer 4 content that changes every run — never put stable rubric/config here (that belongs in [`../references/`](../references/) and [`../setup/`](../setup/)). Every record is an edit surface: Jamie reviews each one at the review gate before it drives a downstream proposal or project. Customer-facing files must exclude internal margin/rate figures, and any legal/tax/financial note remains decision-support pending review by a licensed Portuguese contabilista certificado / lawyer.
