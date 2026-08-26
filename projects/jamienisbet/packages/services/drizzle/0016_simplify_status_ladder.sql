-- Collapse the seven-rung CRM ladder to three rungs plus a drop-out:
--   new → talking → client, terminal lost.
--
-- Data-only: `status` is a plain varchar(20) with no CHECK constraint, so the
-- table shape is unchanged and only the rows move. Nothing is lost — the three
-- middle rungs were one state in practice ("we're talking"), and the split
-- between won and delivered is already carried, better, by `work_started_at`
-- and by whether Stripe has seen any money.
--
-- Reversible only in the sense that a lead can be re-filed by hand: which of
-- contacted/qualified/proposed a row used to be is not recoverable after this.
-- Take a Neon branch first if that distinction still matters to you.
UPDATE "biz"."clients" SET "status" = 'talking'
WHERE "status" IN ('contacted', 'qualified', 'proposed');--> statement-breakpoint
UPDATE "biz"."clients" SET "status" = 'client'
WHERE "status" IN ('won', 'delivered');
