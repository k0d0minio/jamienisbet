#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" for every app in websites/*.
#
# Exit 0 skips the build; any other exit builds it. Every failure path in here
# must end up building — a missed deploy costs far more than a wasted one.
#
# Called from each app's vercel.json, with the cwd set to that app's Root
# Directory (websites/<app>):
#
#   bash ../../scripts/vercel-ignore.sh @jamie-nisbet/portfolio
#   bash ../../scripts/vercel-ignore.sh @jamie-nisbet/admin .icm/onboarding
#
# Trailing arguments are repo-root-relative paths the app depends on that turbo
# cannot see, because they belong to no workspace package.

set -u

workspace=$1
shift
extra_paths=("$@")

# turbo-ignore compares against VERCEL_GIT_PREVIOUS_SHA — the last successful
# deployment of this branch — whenever that is set and reachable, and it always
# wins over --fallback. But it is absent on the first push of a new branch, and
# with no fallback turbo-ignore builds: four apps, on every new branch, no
# matter what the branch touched.
#
# Off main, fall back to the default branch. "Has this branch as a whole touched
# the app?" is the right question for a preview, and unlike HEAD^ it cannot be
# fooled by a multi-commit push whose last commit is incidental.
#
# Never do this on main itself, where the deployed commit *is* main: comparing
# main against itself finds nothing affected, so every app would skip and a
# first-ever production deploy would never build. The guard keys off
# VERCEL_GIT_COMMIT_REF rather than VERCEL_ENV because turbo-ignore's own output
# proves that variable is set this early, and an unset one defaults to "main",
# i.e. to no fallback.
fallback=()
branch=${VERCEL_GIT_COMMIT_REF:-main}
if [ "$branch" = "main" ]; then
	echo "vercel-ignore: on $branch — no fallback, comparing main to itself would skip everything"
elif git fetch --depth=20 origin main:refs/remotes/origin/main --quiet; then
	fallback=(--fallback=origin/main)
	echo "vercel-ignore: no previous deploy on $branch would mean comparing against origin/main"
else
	echo "vercel-ignore: could not fetch main — building if there is no previous deploy" >&2
fi

# Exit 1 here means "affected" or "could not tell" — both build.
npx turbo-ignore "$workspace" ${fallback[@]+"${fallback[@]}"} || exit 1

# turbo-ignore wants to skip. The inputs it cannot see get the last word.
base=${VERCEL_GIT_PREVIOUS_SHA:-origin/main}
for path in ${extra_paths[@]+"${extra_paths[@]}"}; do
	# --quiet exits 1 on a difference and 128 on an unusable base. Both build.
	git diff --quiet "$base" HEAD -- ":(top)$path" || exit 1
done

exit 0
