import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The app tier's type scale has to be *declared* to tailwind-merge, or it is
// silently thrown away.
//
// twMerge resolves each class to one group and keeps the last of a group. Under
// the `text-` prefix it knows two: `font-size` (a fixed list — xs, sm, …) and
// `text-color` (the catch-all everything else falls into). `text-app-subhead`
// is not on the size list, so it fell into the colour group — and any call that
// set a size and a colour together, which is most of them, kept only the
// colour:
//
//   cn("text-app-caption-2 font-medium", active && "text-app-tint")
//     → "font-medium text-app-tint"        // the 11px is gone
//
// Nothing errors and nothing warns; the text simply inherits 17px from the
// `app-tier` root and reads a stop or two too large. Naming the tier's sizes
// here is the one place that can be fixed for every call site at once — a
// literal beats the catch-all validator, so these now resolve as sizes.
//
// The marketing tier is untouched: every name below is `app-*` or `material-*`,
// which exist only under `@jamie-nisbet/ui/app.css`.
const appTextSizes = [
  "app-large-title",
  "app-title-1",
  "app-title-2",
  "app-title-3",
  "app-headline",
  "app-body",
  "app-callout",
  "app-subhead",
  "app-footnote",
  "app-caption",
  "app-caption-2",
];

// Listed for the same reason, from the other side: these are colours, and
// saying so keeps a future size named `app-<something>` from being ambiguous.
const appTextColors = [
  "app-label",
  "app-label-2",
  "app-label-3",
  "app-tint",
  "app-fill-label",
  "material-label",
  "material-label-2",
  "material-label-3",
];

// The desk tier has the same trap and the same fix: its steps are `desk-*`,
// which exist only under `@jamie-nisbet/ui/desk.css`. Sizes and colours are
// named disjointly (`text-desk-ui` is a size, `text-desk-fg` a colour), and
// listing both keeps each in its own group.
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

// The elevation scale is a `shadow`, not a `shadow-color` — so one elevation
// replaces another rather than stacking with it.
const appShadows = ["app-raised", "app-chrome", "app-sheet", "app-popover"];
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
      "font-size": [{ text: [...appTextSizes, ...deskTextSizes] }],
      "text-color": [{ text: [...appTextColors, ...deskTextColors] }],
      shadow: [{ shadow: [...appShadows, ...deskShadows] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
