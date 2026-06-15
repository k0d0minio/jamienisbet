Single-line text field with label, hint, error and icon slots.

```jsx
<Input label="Work email" placeholder="you@company.com" leftIcon={<Mail />} />
<Input label="Budget" error="Required" />
```

Pass `error` to show the red state; it replaces `hint`. Spreads native input props (`type`, `value`, `onChange`, …).
