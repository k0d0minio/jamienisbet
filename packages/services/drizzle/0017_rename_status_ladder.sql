-- Rename the four-rung ladder to five that say what they mean:
--   new → lead · talking → discussing · client → active · lost → not_won,
-- plus the rung the business actually lacked: past, for a client whose
-- engagement has ended but whose record, repo and history stay warm.
--
-- Nothing lands on `past` here — it only ever gets there by hand, when the
-- owner moves an active client whose work is over.
--
-- Data-plus-default: `status` stays a plain varchar(20) with no CHECK
-- constraint, so the renames are row updates; the column default joins them
-- because the new first rung is `lead`, and no intake row should ever fall
-- through to a value the code no longer names.
--
-- Reversible only in the sense that a row can be re-filed by hand: which of
-- the old strings a row used is not recoverable after this. Take a Neon branch
-- first if that distinction still matters to you.
UPDATE "biz"."clients" SET "status" = 'lead'
WHERE "status" = 'new';--> statement-breakpoint
UPDATE "biz"."clients" SET "status" = 'discussing'
WHERE "status" = 'talking';--> statement-breakpoint
UPDATE "biz"."clients" SET "status" = 'active'
WHERE "status" = 'client';--> statement-breakpoint
UPDATE "biz"."clients" SET "status" = 'not_won'
WHERE "status" = 'lost';--> statement-breakpoint
ALTER TABLE "biz"."clients" ALTER COLUMN "status" SET DEFAULT 'lead';