"use client"

import { useRef, useState, useTransition } from "react"
import { Check, Plus, Trash2 } from "lucide-react"

import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from "@jamie-nisbet/ui"

import {
  addComplianceDateAction,
  completeComplianceDateAction,
  deleteComplianceDateAction,
} from "@/app/(app)/actions"

// Serializable projection of a biz.compliance_dates row.
export type ComplianceItem = {
  id: string
  title: string
  notes: string | null
  dueDate: string // ISO
  recurrence: string
  overdue: boolean
}

// Mirrors complianceRecurrences in @jamie-nisbet/services — kept local so this
// client component doesn't pull the services barrel into the browser bundle.
const RECURRENCES = ["none", "monthly", "quarterly", "yearly"] as const

export function ComplianceList({ items }: { items: ComplianceItem[] }) {
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No compliance dates yet — add the obligations your contabilista
          confirms (IRS payments-on-account, Segurança Social declarations,
          IES, …).
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-start gap-3 rounded-md px-2 py-2"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {item.title}
                  {item.overdue && <Badge variant="destructive">Overdue</Badge>}
                  {item.recurrence !== "none" && (
                    <Badge variant="outline" className="capitalize">
                      {item.recurrence}
                    </Badge>
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs",
                    item.overdue
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  Due{" "}
                  {new Date(item.dueDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {item.notes && (
                  <span className="text-xs text-muted-foreground">
                    {item.notes}
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                className="shrink-0"
                onClick={() =>
                  startTransition(() => completeComplianceDateAction(item.id))
                }
              >
                <Check />
                Done
              </Button>
              {/* Always visible on a phone — there is no hover to reveal it. */}
              <button
                type="button"
                aria-label={`Delete "${item.title}"`}
                disabled={pending}
                className="-mr-1 shrink-0 rounded-sm p-2 text-muted-foreground transition-opacity hover:text-destructive sm:mt-2 sm:p-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                onClick={() =>
                  startTransition(() => deleteComplianceDateAction(item.id))
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          ref={formRef}
          action={(formData) =>
            startTransition(async () => {
              await addComplianceDateAction(formData)
              formRef.current?.reset()
              setAdding(false)
            })
          }
          className="flex flex-col gap-2 rounded-md border border-border p-3"
        >
          <Input name="title" placeholder="Obligation (e.g. IRS 1st payment on account)" required />
          {/* Stacked on a phone: a date input plus a recurrence dropdown is
              wider than a narrow screen once the browser's date chrome is in. */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="dueDate"
              type="date"
              required
              className="w-full sm:w-40"
              aria-label="Due date"
            />
            <Select name="recurrence" defaultValue="none">
              <SelectTrigger className="w-full shrink-0 capitalize sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r === "none" ? "One-off" : r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            name="notes"
            rows={2}
            placeholder="Source + as-of date (e.g. 'contabilista email, 2026-07-01') — decision-support only"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              Add obligation
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-fit"
          onClick={() => setAdding(true)}
        >
          <Plus />
          Add obligation
        </Button>
      )}
    </div>
  )
}
