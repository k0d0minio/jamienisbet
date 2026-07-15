# Provenance, Verify & the Edit→Source Loop

> **ICM role:** Layer 3 — reference (convention)
> **Purpose:** The three practices that make the system improve over time instead of repeating mistakes.

### 1. Verify (mandatory in every contract)
Every `CONTEXT.md` has a non-empty `Verify` section with concrete cross-checks against earlier
stages, run *before* the review gate. Examples: "target rate ≥ floor in `setup/`"; "every client
name matches the `biz.clients` record"; "no invoice is both paid and outstanding". Verify catches drift
early, while it is cheap to fix.

### 2. Provenance markers (in real outputs)
When a stage produces real content, it cites the reference that drove each material claim, so a
wrong sentence is traceable to the file that caused it. Lightweight footer form:

```
<!-- provenance: pricing from references/pricing-models.md §tiering; tone from _config/brand/voice/tone.md -->
```

Especially important for legal / tax / finance outputs, which double as an audit trail.

### 3. Edit→source-fix loop (fix the source, not the symptom)
If the human edits the *same kind* of output the same way across ~2–3 runs, that signals the
**Layer-3 source is wrong**, not the output. The fix is to update the reference / template / rubric
so every future run improves — not to re-patch each output. When you notice the pattern, propose the
Layer-3 change. This is ICM §6.3 and the core of why the factory compounds.

Related: [`review-gates.md`](review-gates.md) · [`stage-contracts.md`](stage-contracts.md)
