"use client"

import { useState, useTransition } from "react"
import {
  Briefcase,
  Globe,
  Languages,
  MapPin,
  Pencil,
  Signal,
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
  GroupedBlock,
  GroupedRow,
  GroupedSection,
  PendingButton,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  toast,
} from "@jamie-nisbet/ui"

import { saveClientFacts } from "@/app/(app)/actions"
import { websiteHost, websiteHref } from "@/lib/format"
import { hapticTick } from "@/lib/haptics"
import {
  FIT_TIERS,
  LANGUAGES,
  WEBSITE_GRADES,
  fitTierHint,
  languageLabel,
  websiteGradeLabel,
} from "@/lib/lead-facts"

// What a business *is*, as opposed to how you reach it — the block the cold
// pool needed and every other record turned out to want.
//
// An imported prospect arrives with no message, no budget and no history. What
// it has instead is a profile: what they do, where they are, which language to
// open in, how good a fit they look, and the one line that says why they would
// care. That last one — the hook — is the most valuable field the pool carries
// and the reason a drafted first message can be about *them*. So it is prose in
// a block at the foot of the group, not a badge: a badge is a word you scan
// past, and this is a sentence you read before you write one.
//
// It sits under Contact for the same reason Contact sits under the action
// discs: the Contacts idiom puts a person's facts directly beneath the ways to
// reach them. Rows appear only for the facts a record actually has, and a
// record with none of them says so rather than showing five em dashes.
//
// Editing lives behind the last row, in a sheet, so the page carries the facts
// without carrying the input fields — the same shape as the contact card next
// door, and the same reason its own action posts nothing but its own slice.

export type LeadFacts = {
  id: string
  sector: string | null
  town: string | null
  language: string | null
  hook: string | null
  fitTier: string | null
  websiteUrl: string | null
  websiteGrade: string | null
  reviewCount: number | null
}

/** A Radix select can't carry an empty value, so "nothing chosen" needs a
 *  string of its own. The action clears the column for anything it doesn't
 *  recognise, and this is deliberately one of those. */
const UNSET = "unset"

export function LeadFactsCard({ client }: { client: LeadFacts }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const language = languageLabel(client.language)
  const grade = websiteGradeLabel(client.websiteGrade)

  // What the website row says under itself: how the site was graded, and how
  // many reviews they carry. Either can stand alone.
  const presence = [
    grade,
    client.reviewCount === null
      ? null
      : `${client.reviewCount} ${client.reviewCount === 1 ? "review" : "reviews"}`,
  ]
    .filter(Boolean)
    .join(" · ")

  const hasAny = Boolean(
    client.sector ||
      client.town ||
      language ||
      client.fitTier ||
      client.websiteUrl ||
      presence ||
      client.hook
  )

  return (
    <GroupedSection header="Facts">
      {client.sector ? (
        <GroupedRow
          icon={<Briefcase />}
          label="Sector"
          value={client.sector}
          chevron={false}
        />
      ) : null}

      {client.town ? (
        <GroupedRow
          icon={<MapPin />}
          label="Town"
          value={client.town}
          chevron={false}
        />
      ) : null}

      {language ? (
        <GroupedRow
          icon={<Languages />}
          label="Language"
          value={language}
          chevron={false}
        />
      ) : null}

      {client.fitTier ? (
        // A grade, so it sets in mono like every other figure on this tier —
        // and it is the letter the prospects list sorts on, so it reads the
        // same here as it does there. The line under it is what the letter
        // means, which a single character cannot say on its own.
        <GroupedRow
          icon={<Signal />}
          label="Fit tier"
          description={fitTierHint(client.fitTier) ?? undefined}
          value={<span className="font-mono">{client.fitTier}</span>}
          chevron={false}
        />
      ) : null}

      {client.websiteUrl ? (
        // The site itself, opened in its own tab — this is a link out of the
        // app, not a move inside it.
        <GroupedRow
          icon={<Globe />}
          label="Website"
          description={presence || undefined}
          value={websiteHost(client.websiteUrl)}
          href={websiteHref(client.websiteUrl)}
          target="_blank"
          rel="noreferrer"
        />
      ) : presence ? (
        // Graded, with no address on file: "no website" is a finding, and the
        // row that carries it is exactly where you would look for one.
        <GroupedRow
          icon={<Globe />}
          label="Web presence"
          value={presence}
          chevron={false}
        />
      ) : null}

      {/* The pitch angle, in their own paragraph. Prose rather than a row: it
          is a sentence you read before writing one, and a 44px line would
          truncate the half that matters. */}
      {client.hook ? (
        <GroupedBlock>
          <span className="text-app-label-3">Hook</span>
          <p className="mt-1 whitespace-pre-wrap text-app-label">{client.hook}</p>
        </GroupedBlock>
      ) : null}

      {hasAny ? null : (
        <GroupedBlock>
          Nothing on file — what they do, where they are, and the line a first
          message would lead with all land here.
        </GroupedBlock>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <GroupedRow icon={<Pencil />} label="Edit facts" />
        </SheetTrigger>
        {/* Two detents: the fields fit at half height on a phone, and the hook
            wants the whole sheet when you are actually writing one. */}
        <SheetContent detents={["medium", "large"]}>
          <SheetHeader>
            <SheetTitle>Edit facts</SheetTitle>
            <SheetDescription>
              What they do, where they are, and why they would care.
            </SheetDescription>
          </SheetHeader>
          <form
            action={(formData) =>
              startTransition(async () => {
                hapticTick()
                try {
                  await saveClientFacts(client.id, formData)
                  setOpen(false)
                } catch {
                  // The sheet stays open on a failure, so the fields you
                  // typed are still there to try again with.
                  toast.error("Couldn't save the facts")
                }
              })
            }
            className="grid gap-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <AppField label="Sector">
                <AppInput
                  name="sector"
                  defaultValue={client.sector ?? ""}
                  placeholder="Restaurant, clinic, builder…"
                  autoCapitalize="sentences"
                  enterKeyHint="next"
                />
              </AppField>
              <AppField label="Town">
                <AppInput
                  name="town"
                  defaultValue={client.town ?? ""}
                  placeholder="Mafra"
                  autoCapitalize="words"
                  enterKeyHint="next"
                />
              </AppField>
              <AppField label="Language" hint="Which one to open in.">
                <AppSelect
                  name="language"
                  defaultValue={client.language ?? UNSET}
                >
                  <AppSelectTrigger className="w-full">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    <AppSelectItem value={UNSET}>Not set</AppSelectItem>
                    {LANGUAGES.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </AppField>
              <AppField label="Fit tier" hint="A is the best fit.">
                <AppSelect
                  name="fitTier"
                  defaultValue={client.fitTier ?? UNSET}
                >
                  <AppSelectTrigger className="w-full">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    <AppSelectItem value={UNSET}>Not tiered</AppSelectItem>
                    {FIT_TIERS.map((tier) => (
                      <AppSelectItem key={tier.value} value={tier.value}>
                        {tier.value} — {tier.hint}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </AppField>
            </div>

            <AppField label="Website" hint="With or without the https://.">
              <AppInput
                name="websiteUrl"
                // The URL keyboard, but not the URL *type*: the pool's
                // addresses are written the way people say them ("example.pt"),
                // and native url validation would refuse to submit the form
                // over a missing scheme. `websiteHref` puts one on for the
                // link instead.
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
                defaultValue={client.websiteUrl ?? ""}
                placeholder="example.pt"
              />
            </AppField>

            <div className="grid gap-3 sm:grid-cols-2">
              <AppField label="Web presence">
                <AppSelect
                  name="websiteGrade"
                  defaultValue={client.websiteGrade ?? UNSET}
                >
                  <AppSelectTrigger className="w-full">
                    <AppSelectValue />
                  </AppSelectTrigger>
                  <AppSelectContent>
                    <AppSelectItem value={UNSET}>Not graded</AppSelectItem>
                    {WEBSITE_GRADES.map((option) => (
                      <AppSelectItem key={option.value} value={option.value}>
                        {option.label}
                      </AppSelectItem>
                    ))}
                  </AppSelectContent>
                </AppSelect>
              </AppField>
              <AppField label="Google reviews" hint="Empty if nobody looked.">
                <AppInput
                  name="reviewCount"
                  inputMode="numeric"
                  enterKeyHint="next"
                  defaultValue={client.reviewCount ?? ""}
                  placeholder="—"
                />
              </AppField>
            </div>

            <AppField
              label="Hook"
              hint="The one thing about them a first message leads with."
            >
              <AppTextarea
                name="hook"
                rows={3}
                autoCapitalize="sentences"
                defaultValue={client.hook ?? ""}
                placeholder="Menu is a PDF nobody can read on a phone…"
              />
            </AppField>

            <PendingButton
              pending={pending}
              pendingText="Saving…"
              className="w-full sm:w-fit"
            >
              Save
            </PendingButton>
          </form>
        </SheetContent>
      </Sheet>
    </GroupedSection>
  )
}
