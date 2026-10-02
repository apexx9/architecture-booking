---
name: tailwind-design-system
description: Tailwind CSS v4 design-system conventions.
---

# Tailwind Design System — v4
This project uses Tailwind CSS v4. Read `app/globals.css` before changing tokens. Use `@import "tailwindcss"` and CSS-first `@theme` conventions. Do not introduce a v3 `tailwind.config` pattern, a second styling system or a component library. Keep tokens semantic, use existing utilities and responsive variants, and check focus and responsive states. Extract CSS/components only when it improves clarity or reuse.
