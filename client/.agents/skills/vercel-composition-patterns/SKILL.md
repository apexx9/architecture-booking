---
name: vercel-composition-patterns
description: Reusable React component APIs and composition.
---

# React Composition Patterns
Prefer composition and clear boundaries over giant components with boolean props. Use compound components or slots only when they clarify a repeated pattern. Keep page composition near the route/feature; keep shared primitives generic. Lift state only to the lowest common owner. Do not redesign global state for a visual task. Avoid abstractions for one-off UI. Follow the existing `components/` organisation.
