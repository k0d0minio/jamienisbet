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

// The elevation scale is a `shadow`, not a `shadow-color` — so one elevation
// replaces another rather than stacking with it.
const appShadows = ["app-raised", "app-chrome", "app-sheet", "app-popover"];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: appTextSizes }],
      "text-color": [{ text: appTextColors }],
      shadow: [{ shadow: appShadows }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
