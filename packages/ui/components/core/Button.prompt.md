Primary action control — use for the main action on a screen; drop to `secondary`/`ghost` for lower-emphasis actions.

```jsx
<Button variant="primary" leftIcon={<ArrowRight />}>Start a project</Button>
<Button variant="secondary">View work</Button>
<Button variant="ghost" size="sm">Cancel</Button>
```

Variants: `primary` (slate fill), `secondary` (bordered surface), `ghost` (transparent), `danger`. Sizes: `sm` / `md` / `lg`. Use `block` for full-width, `as="a"` for link buttons. Pass icons via `leftIcon` / `rightIcon` (Lucide SVG nodes).
