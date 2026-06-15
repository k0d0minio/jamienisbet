Centered modal dialog with overlay click-to-close and a footer action row.

```jsx
<Dialog open={open} onClose={() => setOpen(false)} title="Start a project"
  footer={<>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button>Send brief</Button>
  </>}>
  <p>Tell me what you're building and I'll come back within two working days.</p>
</Dialog>
```

Clicking the overlay calls `onClose`; clicks inside are stopped.
