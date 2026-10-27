import { Link } from "@/i18n/navigation"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Eyebrow } from "@/components/brand/eyebrow"
import { ArrowUpRight } from "lucide-react"

import type { Post } from "@/lib/posts"

export function PostCard({ post, date }: { post: Post; date: string }) {
  return (
    <Card className="group relative gap-4 transition-shadow hover:shadow-md">
      <CardHeader>
        <Eyebrow>
          <time dateTime={post.date}>{date}</time>
        </Eyebrow>
        <CardTitle className="text-xl">
          <Link
            href={`/work/posts/${post.slug}`}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 text-sm text-muted-foreground">
        {post.summary}
      </CardContent>

      <CardFooter className="justify-end">
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </CardFooter>
    </Card>
  )
}
