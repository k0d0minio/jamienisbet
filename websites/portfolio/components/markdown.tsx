import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// Renders case-study markdown bodies. The `.prose` styles in globals.css
// brand every element via the design-system tokens. react-markdown runs fine
// in a Server Component (pure render, no client JS).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}
