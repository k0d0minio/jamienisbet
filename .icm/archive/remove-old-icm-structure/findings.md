# Findings remove-old-icm-structure

- The root `.copier-answers.yml` is gone. `CLAUDE.md` still says that it is "rendered from
  `legible-consulting/blueprint`" and that Copier writes it once. Its row "change a file the
  blueprint renders" still says `copier update`. `.icm/intake/README.md` also says "Copier
  writes it once". The spec did not name these lines. A later ticket can make them true.
- The BAXTER guard `safe_bash.sh` blocks a Bash command when its text contains `merge.sh`,
  also when the command only edits a file that names `merge.sh`. This session used the Edit
  tool for those lines.
