# Onboarding — customer questionnaire definitions

> Markdown-defined forms for prospection and onboarding. Each file here is a form the
> admin dashboard can publish as a one-off link for a specific lead ("Send form" on the
> lead's profile). **Questions are content and live here, in git; answers are business
> state and live in Neon (`biz.form_links`), shown on the lead's profile — never mirrored
> back into this folder.**

## How publishing works (so you know why the format matters)

Clicking "Send form" on a lead parses the chosen file *at that moment* and stores the
parsed questions as a JSON snapshot alongside the link token. Answers are forever paired
with the exact questions that were asked — editing a file here never changes or breaks a
form that was already sent. There is no build step; the next "Send form" click simply
picks up the current file.

## File convention

One form per file, named `<slug>.md` (kebab-case; the filename **is** the form's slug and
must never be renamed after a link has been sent). Structure:

```markdown
---
title: Project intake
intro: >
  One or two sentences shown to the customer above the questions.
---

## What should we build?

- type: textarea
- hint: A rough description is fine — bullet points welcome.

## What's your budget range?

- type: select
- options: Under €2k | €2k–€5k | €5k–€15k | €15k+
- key: budget

## Do you have an existing site?

- type: boolean
- optional: yes
```

### Rules

- **Front matter** (required): `title` (shown as the page heading) and `intro` (shown
  under it). Nothing else is read.
- **Each `##` heading is one question**, worded exactly as the customer will see it.
  Everything until the next `##` belongs to that question.
- **Under the heading, a single unordered list of `key: value` lines** configures the
  question. Prose outside that list is ignored by the parser (reserved for future use).
- Recognised list keys:
  - `type:` — one of `text` (single line), `textarea`, `select`, `boolean`
    (yes/no). Defaults to `text` if omitted.
  - `options:` — `select` only; choices separated by ` | ` (pipe with spaces).
  - `optional: yes` — questions are **required by default**; this relaxes one.
  - `hint:` — helper text shown under the field.
  - `key:` — stable identifier the answer is stored under in `biz.form_links.answers`.
    Defaults to the slugified heading; set it explicitly on any question you expect to
    reword later, so stored answers stay comparable across sends.
- Keep the vocabulary at these four types. Conditional logic, file uploads, or anything
  Typeform-shaped is deliberately out of scope — if a form needs it, this isn't the tool.

## Files

- [`project-intake.md`](project-intake.md) — the default prospection questionnaire.
