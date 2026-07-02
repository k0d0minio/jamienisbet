// Renders a generated mockup inside a fully sandboxed iframe: srcDoc keeps it
// same-page, and an empty sandbox attribute strips scripts, forms, and
// navigation — the mockup is inert HTML/CSS by construction (the generator is
// instructed to emit none of those), and the sandbox enforces it.
export function MockupFrame({ html }: { html: string }) {
  return (
    <iframe
      srcDoc={html}
      sandbox=""
      title="Mockup preview"
      className="h-[70vh] w-full rounded-md border bg-white"
    />
  )
}
