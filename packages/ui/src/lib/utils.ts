import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The desk tier's type scale has to be *declared* to tailwind-merge, or it is
// silently thrown away.
//
// twMerge resolves each class to one group and keeps the last of a group. Under
// the `text-` prefix it knows two: `font-size` (a fixed list — xs, sm, …) and
// `text-color` (the catch-all everything else falls into). `text-desk-meta` is
// not on the size list, so it would fall into the colour group — and any call
// that set a size and a colour together, which is most of them, would keep
// only the colour:
//
//   cn("text-desk-micro font-medium", active && "text-desk-fg")
//     → "font-medium text-desk-fg"        // the 11px is gone
//
// Nothing errors and nothing warns. Naming the tier's sizes here is the one
// place that can be fixed for every call site at once — a literal beats the
// catch-all validator, so these resolve as sizes. Sizes and colours are named
// disjointly (`text-desk-ui` is a size, `text-desk-fg` a colour), and listing
// both keeps each in its own group.
//
// The marketing tier is untouched: every name below is `desk-*`, which exists
// only under `@jamie-nisbet/ui/desk.css`.
const deskTextSizes = [
  "desk-title",
  "desk-heading",
  "desk-body",
  "desk-ui",
  "desk-meta",
  "desk-micro",
  "desk-figure",
];

const deskTextColors = [
  "desk-fg",
  "desk-fg-2",
  "desk-fg-3",
  "desk-ink",
  "desk-ink-fg",
  "desk-running",
  "desk-blocked",
  "desk-done",
];

// The elevation step is a `shadow`, not a `shadow-color` — so it replaces
// another shadow rather than stacking with it.
const deskShadows = ["desk-float"];

// The desk tier's named sizes, corners and tracking are theme *values*, not
// classes: tailwind-merge's default theme only recognises numbers and t-shirt
// sizes, so `h-desk-row` next to a caller's `h-8` would otherwise keep both and
// leave the winner to stylesheet order. Declaring them makes every spacing
// utility (h-, w-, size-, p-, gap-, …) and every rounded- one resolve.
const deskSpacing = [
  "desk-row",
  "desk-control",
  "desk-control-sm",
  "desk-grid-row",
  "desk-grid-header",
  "desk-rail",
  "desk-rail-item",
  "desk-pane-header",
  "desk-toolbar",
  "desk-icon",
  "desk-icon-rail",
  "desk-dot",
  "desk-check",
  "desk-badge",
];
const deskRadius = ["desk-key", "desk-control", "desk-pane"];
const deskTracking = ["desk-eyebrow"];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: deskSpacing,
      radius: deskRadius,
      tracking: deskTracking,
    },
    classGroups: {
      "font-size": [{ text: deskTextSizes }],
      "text-color": [{ text: deskTextColors }],
      shadow: [{ shadow: deskShadows }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
