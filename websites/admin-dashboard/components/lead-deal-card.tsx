"use client"

import { useState, useTransition, type ReactNode } from "react"
import {
  ArrowLeftRight,
  Coins,
  FolderGit2,
  LifeBuoy,
  Pencil,
  Percent,
  PieChart,
  Plus,
  X,
} from "lucide-react"

import {
  AppField,
  AppInput,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSelectTrigger,
  AppSelectValue,
  AppTextarea,
  Button,
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  toast,
} from "@jamie-nisbet/ui"
import { dealTermsOf, type DealTerms } from "@jamie-nisbet/services"

import { saveDealTerms } from "@/app/(app)/actions"
import { hapticTick } from "@/lib/haptics"
import { formatMoney, parseAmountToMinor } from "@/lib/money"
import { bpsToPercentInput, formatBps, parsePercentToBps } from "@/lib/percent"

// What was agreed — one row per term, each editable where it sits.
//
// A deal is components: a fee, a swap, a stake, a cut. Any one of them is a
// whole deal, so the card is built from the terms that exist rather than from
// the columns behind them: an engagement paid entirely in equity is one row
// saying `12%`, and no € field ever appears uninvited. Terms the deal doesn't
// have offer themselves quietly under "Add a term" instead of sitting in a
// form as empty boxes.
//
// Tapping a row swaps it for its own small editor in place, and that editor
// writes one term. `saveDealTerms` reads only the fields a form actually posts,
// so a percentage saves without touching the euros and a fee saves without
// touching the stake — which is what lets a row be edited on its own at all.
//
// No sheet here: none of these editors is more than two controls, and a sheet
// for a single number is the indirection this screen was built to lose. The
// long-form field (what's being exchanged) grows with what is typed rather
// than scrolling inside itself, so it never fights the page's own scroll.

/** The deal columns this card reads and writes, plus the row it writes them
 *  back to. Billing and deal type arrive as the plain strings the Client row
 *  carries; narrowing them is the model's job, not this card's. */
export type DealDetails = DealTerms & {
  id: string
}

/** What the deal folder's agreement says the money is, when the folder has
 *  one — offered on the card as a prefill, never written by it (icm-board
 *  D24: the row is the state, the folder is the words; Jamie reconciles). */
export type AgreementSuggestion = {
  agreedMinor: number | null
  recurringMinor: number | null
  /** Where it came from, for the row's hint — "05-agreement.md in berceo-platform". */
  source: string
}

/** Which term is being edited. Cash and a swap share one editor because they
 *  share one figure in the model — they are two readings of `valueMinor`, so
 *  at most one of them is ever a term and one editor writes both. */
type TermKey = "fee" | "equity" | "commission" | "support" | "agreement"

/** How the fee is paid. `billingType` and `dealType` are two columns, but they
 *  answer one question a person actually asks of a fee, so the control asks it
 *  once. */
type PaidHow = "one_off" | "monthly" | "barter"

/** A term as it rests: what it is, what it says, and a glyph saying you can
 *  change it. No chevron — on this tier that means "this navigates", and this
 *  opens in place. */
function TermRow({
  icon,
  label,
  value,
  onEdit,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  onEdit: () => void
}) {
  return (
    <GroupedRow
      icon={icon}
      label={label}
      chevron={false}
      aria-expanded={false}
      onClick={onEdit}
      value={
        <span className="inline-flex items-center gap-2">
          {value}
          {/* Visible on touch, not on hover — there is no hover here. */}
          <Pencil className="size-3.5 shrink-0 text-app-label-3" aria-hidden />
        </span>
      }
    />
  )
}

/** The frame every term editor wears: the term's name, its controls, and the
 *  three things you can do with it. Remove sits far from Save, on the other
 *  end of the row. */
function TermEditor({
  title,
  removable,
  pending,
  onCancel,
  onRemove,
  onSubmit,
  children,
}: {
  /** The term's name, where the field below doesn't already carry it — the
   *  fee's does not ("Amount (€)"), a percentage's does. */
  title?: string
  /** Whether this term is currently part of the deal — you can only remove
   *  what is there. */
  removable: boolean
  pending: boolean
  onCancel: () => void
  onRemove: () => void
  onSubmit: () => void
  children: ReactNode
}) {
  return (
    <GroupedBlock>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel()
        }}
      >
        {title != null ? (
          <span className="text-app-footnote text-app-label-3">{title}</span>
        ) : null}

        {children}

        <div className="flex flex-wrap items-center gap-2">
          {removable ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              className="px-3 text-destructive hover:text-destructive active:text-destructive"
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="px-3"
              disabled={pending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <PendingButton pending={pending} pendingText="Saving…">
              Save
            </PendingButton>
          </div>
        </div>
      </form>
    </GroupedBlock>
  )
}

/** The fee: an amount and how it is paid. Picking "Exchange of services" is
 *  what makes the figure notional, and only then does it ask what is being
 *  swapped — the one long field on this card. */
function FeeEditor({
  client,
  intent,
  pending,
  onCancel,
  onCommit,
}: {
  client: DealDetails
  /** The reading to open on when the picker opened this — a fee arrives as
   *  cash, an exchange as a swap. Null when an existing row was tapped, and
   *  then the record decides. */
  intent: PaidHow | null
  pending: boolean
  onCancel: () => void
  onCommit: (formData: FormData) => void
}) {
  const terms = dealTermsOf(client)
  const present = terms.cash !== null || terms.barter !== null

  const [paid, setPaid] = useState<PaidHow>(
    intent ??
      (terms.barter
        ? "barter"
        : terms.cash?.billingType === "monthly"
          ? "monthly"
          : "one_off")
  )
  const [amount, setAmount] = useState(
    client.valueMinor > 0 ? (client.valueMinor / 100).toFixed(2) : ""
  )
  const [exchange, setExchange] = useState(client.barterTerms ?? "")
  const [error, setError] = useState<string | null>(null)

  const swap = paid === "barter"

  function submit() {
    const trimmed = amount.trim()
    // An empty amount is a fee with no figure on it — fine for a swap, and for
    // cash it is simply the term going away. A figure that isn't one is not.
    if (trimmed !== "" && parseAmountToMinor(trimmed) === null) {
      setError("An amount like 2500 or 2500.00.")
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set("value", trimmed)
    formData.set("billingType", paid === "monthly" ? "monthly" : "one_off")
    // Posting the reading is what retires the other one: choosing cash clears
    // the swap's terms, choosing a swap makes the same figure notional.
    formData.set("dealType", swap ? "barter" : "cash")
    if (swap) formData.set("barterTerms", exchange.trim())
    onCommit(formData)
  }

  function remove() {
    const formData = new FormData()
    // Both readings at once: no figure, and back to cash so the swap's terms
    // go with it. Removing a term should not quietly turn it into income.
    formData.set("value", "")
    formData.set("dealType", "cash")
    onCommit(formData)
  }

  return (
    <TermEditor
      title={swap ? "Exchange of services" : "Fee"}
      removable={present}
      pending={pending}
      onCancel={onCancel}
      onRemove={remove}
      onSubmit={submit}
    >
      <AppField
        label={swap ? "Worth (€)" : "Amount (€)"}
        hint={
          swap
            ? "What the swap is worth, if you've put a figure on it."
            : undefined
        }
        error={error}
      >
        <AppInput
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0.00"
          autoFocus
        />
      </AppField>

      <AppField
        label="How it's paid"
        hint={swap ? "Counted in kind — nothing is invoiced for it." : undefined}
      >
        <AppSelect
          value={paid}
          onValueChange={(next) => setPaid(next as PaidHow)}
        >
          <AppSelectTrigger className="w-full">
            <AppSelectValue />
          </AppSelectTrigger>
          <AppSelectContent>
            <AppSelectItem value="one_off">One-off</AppSelectItem>
            <AppSelectItem value="monthly">Every month</AppSelectItem>
            <AppSelectItem value="barter">Exchange of services</AppSelectItem>
          </AppSelectContent>
        </AppSelect>
      </AppField>

      {swap ? (
        <AppField label="What's being exchanged">
          <AppTextarea
            autoResize
            rows={2}
            value={exchange}
            onChange={(event) => setExchange(event.target.value)}
            placeholder="What you're doing for them, and what you're getting back…"
          />
        </AppField>
      ) : null}
    </TermEditor>
  )
}

/** A stake or a cut: one percentage, and nothing else to say about it. */
function PercentEditor({
  client,
  kind,
  pending,
  onCancel,
  onCommit,
}: {
  client: DealDetails
  kind: "equity" | "commission"
  pending: boolean
  onCancel: () => void
  onCommit: (formData: FormData) => void
}) {
  const stored = kind === "equity" ? client.equityBps : client.commissionBps
  const [value, setValue] = useState(bpsToPercentInput(stored))
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const trimmed = value.trim()
    if (trimmed !== "" && parsePercentToBps(trimmed) === null) {
      setError("A percentage between 0 and 100, like 12 or 8.5.")
      return
    }
    setError(null)
    const formData = new FormData()
    formData.set(kind, trimmed)
    onCommit(formData)
  }

  function remove() {
    const formData = new FormData()
    // Empty, not zero — "not part of this deal" rather than a nil cut
    // deliberately agreed.
    formData.set(kind, "")
    onCommit(formData)
  }

  return (
    <TermEditor
      removable={(stored ?? 0) > 0}
      pending={pending}
      onCancel={onCancel}
      onRemove={remove}
      onSubmit={submit}
    >
      <AppField
        label={kind === "equity" ? "Equity (%)" : "Commission (%)"}
        hint={
          kind === "equity"
            ? "The stake in their company."
            : "The cut of their revenue, taken through Stripe."
        }
        error={error}
      >
        <AppInput
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          // A dash, not a zero: no percentage agreed is not the same fact as
          // a nil cut deliberately agreed.
          placeholder="—"
          autoFocus
        />
      </AppField>
    </TermEditor>
  )
}

/** The monthly support line beside a build — "one-off + support" (icm-board
 *  pricing.md § Support). Not a retainer: a retainer is the fee itself, paid
 *  monthly. This is what keeps the lights on after handover, priced by the
 *  build's complexity, and it only makes sense next to a one-off. */
function SupportEditor({
  client,
  pending,
  onCancel,
  onCommit,
}: {
  client: DealDetails
  pending: boolean
  onCancel: () => void
  onCommit: (formData: FormData) => void
}) {
  const [amount, setAmount] = useState(
    client.supportMinor > 0 ? (client.supportMinor / 100).toFixed(2) : ""
  )
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const trimmed = amount.trim()
    if (trimmed !== "" && parseAmountToMinor(trimmed) === null) {
      setError("An amount like 60 or 60.00.")
      return
    }
    setError(null)
    const formData = new FormData()
    formData.set("support", trimmed)
    onCommit(formData)
  }

  function remove() {
    const formData = new FormData()
    formData.set("support", "")
    onCommit(formData)
  }

  return (
    <TermEditor
      title="Support"
      removable={client.supportMinor > 0}
      pending={pending}
      onCancel={onCancel}
      onRemove={remove}
      onSubmit={submit}
    >
      <AppField
        label="Per month (€)"
        hint="Basic support beside the build: crash fixes on call. Needs the fail-safe page and Sentry wired first."
        error={error}
      >
        <AppInput
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0.00"
          autoFocus
        />
      </AppField>
    </TermEditor>
  )
}


/** "Use these": the agreement's figures from the deal folder, prefilled into
 *  one editor so the row can be brought in line with the paper in a tap and a
 *  Save. Nothing is written until Save — the folder never writes the row. */
function AgreementEditor({
  suggestion,
  pending,
  onCancel,
  onCommit,
}: {
  suggestion: AgreementSuggestion
  pending: boolean
  onCancel: () => void
  onCommit: (formData: FormData) => void
}) {
  const toInput = (minor: number | null) =>
    minor !== null && minor > 0 ? (minor / 100).toFixed(2) : ""
  const [amount, setAmount] = useState(toInput(suggestion.agreedMinor))
  const [support, setSupport] = useState(toInput(suggestion.recurringMinor))
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const a = amount.trim()
    const s = support.trim()
    if ((a !== "" && parseAmountToMinor(a) === null) || (s !== "" && parseAmountToMinor(s) === null)) {
      setError("Amounts like 2500 or 2500.00.")
      return
    }
    setError(null)
    const formData = new FormData()
    formData.set("value", a)
    formData.set("billingType", "one_off")
    formData.set("dealType", "cash")
    formData.set("support", s)
    onCommit(formData)
  }

  return (
    <TermEditor
      title={`From ${suggestion.source}`}
      removable={false}
      pending={pending}
      onCancel={onCancel}
      onRemove={() => undefined}
      onSubmit={submit}
    >
      <AppField label="Agreed (€, one-off)" error={error}>
        <AppInput
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          placeholder="0.00"
          autoFocus
        />
      </AppField>
      <AppField label="Support per month (€)" hint="The agreement's recurring line; blank for none.">
        <AppInput
          value={support}
          onChange={(event) => setSupport(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder="0.00"
        />
      </AppField>
    </TermEditor>
  )
}

export function LeadDealCard({
  client,
  dealFolder,
  suggestion = null,
}: {
  client: DealDetails
  /** Which `workspaces/deals/<slug>/` in icm-board holds this relationship's
   *  documents: the delivery repo's name (icm-board D28), or null until a repo
   *  is connected. Read-only here — nothing to set, nothing to propose. */
  dealFolder: string | null
  /** The folder's agreement, when it has one and it disagrees with the row. */
  suggestion?: AgreementSuggestion | null
}) {
  const [editing, setEditing] = useState<TermKey | null>(null)
  const [picking, setPicking] = useState(false)
  const [feeIntent, setFeeIntent] = useState<PaidHow | null>(null)
  const [pending, startTransition] = useTransition()

  const terms = dealTermsOf(client)
  const feeSlotFree = terms.cash === null && terms.barter === null
  const empty =
    feeSlotFree &&
    terms.equity === null &&
    terms.commission === null &&
    terms.support === null

  // One term at a time, through the same scoped action every editor posts to.
  // The editor stays open on a failure, holding what was typed, because the
  // fields are controlled and nothing here resets them.
  const commit = (formData: FormData) =>
    startTransition(async () => {
      hapticTick()
      try {
        await saveDealTerms(client.id, formData)
        setEditing(null)
        setFeeIntent(null)
      } catch {
        toast.error("Couldn't save the deal terms")
      }
    })

  function openEditor(key: TermKey, intent: PaidHow | null = null) {
    setPicking(false)
    setFeeIntent(intent)
    setEditing(key)
  }

  function cancel() {
    setEditing(null)
    setFeeIntent(null)
  }

  // The terms this deal doesn't have yet, offered rather than pre-printed.
  // Cash and a swap share the fee slot, so both are offered while it is free
  // and neither once it is taken — the reading is changed inside the fee's own
  // editor, where the figure it applies to is.
  const available: {
    key: TermKey
    intent: PaidHow | null
    icon: ReactNode
    label: string
    hint: string
  }[] = []
  if (feeSlotFree) {
    available.push({
      key: "fee",
      intent: "one_off",
      icon: <Coins />,
      label: "Fee",
      hint: "A euro figure, one-off or monthly",
    })
    available.push({
      key: "fee",
      intent: "barter",
      icon: <ArrowLeftRight />,
      label: "Exchange of services",
      hint: "Work traded for work, counted in kind",
    })
  }
  if (terms.equity === null) {
    available.push({
      key: "equity",
      intent: null,
      icon: <PieChart />,
      label: "Equity",
      hint: "A stake in their company",
    })
  }
  if (terms.commission === null) {
    available.push({
      key: "commission",
      intent: null,
      icon: <Percent />,
      label: "Commission",
      hint: "A cut of their revenue",
    })
  }
  // Support only makes sense beside a one-off build — a retainer already
  // pays monthly, and a swap has nothing to keep the lights on for.
  if (terms.support === null && terms.barter === null && terms.cash?.billingType !== "monthly") {
    available.push({
      key: "support",
      intent: null,
      icon: <LifeBuoy />,
      label: "Support",
      hint: "A monthly line beside the build — crash fixes on call",
    })
  }

  return (
    <GroupedSection
      header="Deal"
      footer="Your own record of what was agreed — any combination of a fee, a swap, a stake, a cut and a support line. Stripe stays the authority on what was invoiced and paid; the deal folder in icm-board holds the words."
    >
      {/* The agreement's figures, offered when the folder has paper and the
          row says something else. A prefill, not a sync: Save is yours. */}
      {suggestion && editing === null && !picking ? (
        <GroupedRow
          icon={<FolderGit2 />}
          label="Use the agreement's figures"
          description={[
            suggestion.agreedMinor !== null ? formatMoney(suggestion.agreedMinor, "eur") : null,
            suggestion.recurringMinor ? `${formatMoney(suggestion.recurringMinor, "eur")}/mo support` : null,
          ]
            .filter(Boolean)
            .join(" + ") || suggestion.source}
          chevron={false}
          variant="tint"
          onClick={() => openEditor("agreement")}
        />
      ) : null}
      {editing === "agreement" ? (
        <AgreementEditor
          suggestion={suggestion ?? { agreedMinor: null, recurringMinor: null, source: "the deal folder" }}
          pending={pending}
          onCancel={cancel}
          onCommit={commit}
        />
      ) : null}

      {/* The fee, in whichever of its two readings this deal uses. */}
      {editing === "fee" ? (
        <FeeEditor
          client={client}
          intent={feeIntent}
          pending={pending}
          onCancel={cancel}
          onCommit={commit}
        />
      ) : terms.cash ? (
        <TermRow
          icon={<Coins />}
          label="Fee"
          onEdit={() => openEditor("fee")}
          value={
            <span className="font-mono">
              {formatMoney(terms.cash.valueMinor, "eur")}
              {terms.cash.billingType === "monthly" ? "/mo" : ""}
            </span>
          }
        />
      ) : terms.barter ? (
        <TermRow
          icon={<ArrowLeftRight />}
          label="In kind"
          onEdit={() => openEditor("fee")}
          value={
            // A swap is a term whether or not anyone has put a figure on it,
            // so the row exists either way and only the figure waits.
            terms.barter.valueMinor > 0 ? (
              <span className="font-mono">
                {formatMoney(terms.barter.valueMinor, "eur")}
              </span>
            ) : (
              <span className="text-app-label-3">Agreed</span>
            )
          }
        />
      ) : null}

      {/* What is actually being swapped, in their words rather than a figure.
          It edits with the fee above, which is where it is written. */}
      {editing !== "fee" && terms.barter?.terms ? (
        <GroupedBlock>
          <span className="mb-1 block text-app-footnote text-app-label-3">
            What&apos;s being exchanged
          </span>
          <p className="whitespace-pre-wrap">{terms.barter.terms}</p>
        </GroupedBlock>
      ) : null}

      {editing === "equity" ? (
        <PercentEditor
          client={client}
          kind="equity"
          pending={pending}
          onCancel={cancel}
          onCommit={commit}
        />
      ) : terms.equity ? (
        <TermRow
          icon={<PieChart />}
          label="Equity"
          onEdit={() => openEditor("equity")}
          value={<span className="font-mono">{formatBps(terms.equity.bps)}</span>}
        />
      ) : null}

      {editing === "commission" ? (
        <PercentEditor
          client={client}
          kind="commission"
          pending={pending}
          onCancel={cancel}
          onCommit={commit}
        />
      ) : terms.commission ? (
        <TermRow
          icon={<Percent />}
          label="Commission"
          onEdit={() => openEditor("commission")}
          value={
            <span className="font-mono">{formatBps(terms.commission.bps)}</span>
          }
        />
      ) : null}

      {editing === "support" ? (
        <SupportEditor
          client={client}
          pending={pending}
          onCancel={cancel}
          onCommit={commit}
        />
      ) : terms.support ? (
        <TermRow
          icon={<LifeBuoy />}
          label="Support"
          onEdit={() => openEditor("support")}
          value={
            <span className="font-mono">
              {formatMoney(terms.support.valueMinor, "eur")}/mo
            </span>
          }
        />
      ) : null}

      {/* Nothing agreed yet is a fact about the relationship, not a gap — so
          it is said plainly and the way out of it sits directly under it. */}
      {empty && editing === null && !picking ? (
        <GroupedBlock>
          Nothing agreed yet. A deal is any of these — a fee, a swap, a stake in
          the company, a cut of their revenue — and one of them is enough.
        </GroupedBlock>
      ) : null}

      {/* Where the words live. Always a row, even unset: a relationship with
          no folder is a fact worth seeing. Not editable — the folder is named
          after the repo (D28), so the way to get one is the repo row above. */}
      <GroupedRow
        icon={<FolderGit2 />}
        label="Deal folder"
        chevron={false}
        value={
          dealFolder ? (
            <span className="font-mono">{dealFolder}</span>
          ) : (
            <span className="text-app-label-3">Named after the repo — connect one</span>
          )
        }
      />

      {editing === null && picking ? (
        <>
          {/* Said out loud, because these rows sit in the same slab as the
              terms the deal already has and a tinted label alone still reads
              as a fact when it is stacked under one. */}
          <GroupedBlock className="py-2">
            <span className="text-app-footnote text-app-label-3">
              Add a term
            </span>
          </GroupedBlock>
          {available.map((term) => (
            <GroupedRow
              key={term.label}
              icon={term.icon}
              label={term.label}
              description={term.hint}
              chevron={false}
              // Tinted: an action you can take, not a term you have.
              variant="tint"
              onClick={() => openEditor(term.key, term.intent)}
            />
          ))}
          <GroupedRow
            icon={<X />}
            label="Cancel"
            chevron={false}
            onClick={() => setPicking(false)}
          />
        </>
      ) : null}

      {editing === null && !picking && available.length > 0 ? (
        <GroupedRow
          icon={<Plus />}
          label="Add a term"
          variant="tint"
          chevron={false}
          onClick={() => setPicking(true)}
        />
      ) : null}
    </GroupedSection>
  )
}
