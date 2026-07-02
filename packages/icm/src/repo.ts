// Repo-file access for the ICM runtime. The monorepo's markdown IS the
// configuration (Layer 0–3), so this module is the single place that resolves
// "a repo-relative path" into file contents — locally (dev server runs inside
// the repo) and on Vercel (the files ship with the function via
// `outputFileTracingIncludes` in the consuming app's next.config, preserving
// their repo-relative layout).

import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

let cachedRoot: string | null = null

// Walk up from cwd until a directory looks like the repo root. Two markers:
// pnpm-workspace.yaml (present in git checkouts, and explicitly traced into the
// Vercel bundle) or the _config/ folder (always traced — it's Layer 3 itself).
export function findRepoRoot(): string {
  if (cachedRoot) return cachedRoot
  let dir = process.cwd()
  for (;;) {
    if (
      existsSync(join(dir, "pnpm-workspace.yaml")) ||
      existsSync(join(dir, "_config", "brand"))
    ) {
      cachedRoot = dir
      return dir
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  cachedRoot = process.cwd()
  return cachedRoot
}

/** Read a repo-relative file (e.g. "_config/business/rates.md"). Throws with a
 * deploy-oriented hint when the file is missing, because on Vercel a miss
 * almost always means the path isn't covered by outputFileTracingIncludes. */
export function readRepoFile(relPath: string): string {
  const abs = resolve(findRepoRoot(), relPath)
  try {
    return readFileSync(abs, "utf8")
  } catch {
    throw new Error(
      `ICM: cannot read "${relPath}" (resolved to ${abs}). ` +
        "If this is a deployed environment, make sure the path is listed in " +
        "outputFileTracingIncludes in the app's next.config.ts."
    )
  }
}

/** Like readRepoFile but returns null on a miss — for optional references. */
export function tryReadRepoFile(relPath: string): string | null {
  try {
    return readFileSync(resolve(findRepoRoot(), relPath), "utf8")
  } catch {
    return null
  }
}
