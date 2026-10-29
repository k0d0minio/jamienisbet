# Where the build runs

| Environment | Address | Vercel project | Database | Moves on |
|---|---|---|---|---|
| Production | <the production domain> | <the Vercel project> | none | every merge to `main`. The merge is the release |
| Preview | the pull request's Vercel preview | <the Vercel project> | none | every push to the branch |

This table is the one home of where the build runs. The blueprint's files read it and never
repeat it. The blueprint owns this file: `copier update` merges a new tag into it three ways,
so a cell that a person filled stays filled.
A person fills each `<…>` cell that no setup stub fills, when the project or the domain exists.
