# 05 — Compliance Calendar — Contract
<!-- ICM Layer 2 — machine-loaded stage contract. Human narrative is in README.md. -->

## Inputs
- Layer 4 (working): `../03_setup_execution/output/`, `../04_tax_optimization/output/`
- Layer 3 (reference): `../../references/social-security-notes.md`, `../../references/iva-vat-notes.md`

## Process
Build the dated calendar: quarterly SS declarations (Apr/Jul/Oct/Jan) starting when the 12-month exemption ends (state that date); annual IRS Modelo 3 + Anexo B; periodic IVA + recapitulative (VIES) statements. Each entry: due date, what is filed, who files it, buffer reminder.

## Outputs
- `compliance-calendar.md` -> output/

## Integrations
- none (entries are keyed into the dashboard's compliance calendar by hand after review; no Google Calendar feed, per the decision)

## Verify
- The year-1 SS-exemption end date is correct and prominent; every obligation cites its reference + as-of date; cadence matches the confirmed regime.

## Review gate
- Jamie/contabilista validate the calendar before it is entered into the dashboard.
