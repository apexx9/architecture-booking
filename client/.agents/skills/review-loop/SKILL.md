---
name: review-loop
description: Review frontend changes after implementation.
---

# Frontend Review Loop
After implementation, run the app/browser preview when available. Inspect desktop and narrow/mobile widths. Check hierarchy, alignment, spacing, text wrapping and realistic content. Test every visible control in scope. Check keyboard focus, labels, contrast and reduced motion. Run `pnpm lint` and `pnpm build` when practical. Fix regressions introduced by the task, not unrelated legacy issues. Never claim a check was run unless it was.
