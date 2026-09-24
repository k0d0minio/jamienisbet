import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Renders a ticket body the way it reads in the repo. Markdown is the
// interface, but syntax is not the *reading* surface — on a phone, `## Prompt`
// and `- [ ] step` are noise between you and the work. The `.prose` layer in
// globals.css brands every element with the design-system tokens, sized down
// for the dashboard's denser type scale. Loaded on demand by TicketDetail, in
// the browser, when a ticket is opened.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
