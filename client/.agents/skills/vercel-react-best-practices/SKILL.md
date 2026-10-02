---
name: vercel-react-best-practices
description: React and Next.js implementation and performance practices.
---

# React and Next.js Best Practices
Read the installed Next.js 16 docs under `node_modules/next/dist/docs/` for version-sensitive APIs. Prefer Server Components; add `use client` only when state, effects, events or browser APIs require it. Keep client boundaries narrow. Avoid unnecessary effects, state, dependencies and premature memoisation. Parallelise independent async work when existing contracts permit. Use stable keys, `next/link` and `next/image` appropriately. Do not alter API or caching semantics without Aaron's approval.
