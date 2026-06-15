Underline tab bar for switching views. Controlled component.

```jsx
const [tab, setTab] = React.useState('work');
<Tabs value={tab} onChange={setTab} items={[
  {value:'work', label:'Work', count:12},
  {value:'about', label:'About'},
]} />
```

Items can be plain strings or objects with `icon` and `count`.
