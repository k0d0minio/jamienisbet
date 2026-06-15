The default surface container — hairline border, generous padding, optional eyebrow/title header.

```jsx
<Card eyebrow="Case study" title="Realtime inference platform"
      action={<IconButton label="Open"><ArrowUpRight /></IconButton>}>
  <p>Cut p99 latency by 60% on a fixed budget.</p>
</Card>

<Card hover as="a" href="#">Clickable card lifts on hover</Card>
```

Use `hover` for interactive cards, `raised` for a resting shadow, `padded={false}` to control padding yourself.
