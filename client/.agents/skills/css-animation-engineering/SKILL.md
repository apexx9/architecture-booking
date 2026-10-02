---
name: css-animation-engineering
description: CSS transitions, keyframes, transforms, scroll-driven animations, compositing and maintainable animation architecture.
---

# CSS Animation Engineering

Use this skill for native CSS motion and lightweight transitions.

## Preferred Techniques

- transition.
- @keyframes.
- transform.
- opacity.
- clip-path where appropriate.
- CSS variables.
- Animation composition.
- Native scroll-driven animation where supported and suitable.

## Principles

Prefer CSS for simple and self-contained motion.

Use consistent timing and easing tokens.

Keep animation definitions maintainable.
Avoid duplicating similar keyframes.
Use descriptive class names.
Avoid unnecessary !important declarations.

## Performance

Prefer transform and opacity where possible.

Be cautious with:
- width and height.
- top and left.
- box-shadow.
- filter.
- large blur effects.
- expensive clip-path animations.

Do not add will-change everywhere.
Use it only when there is a measured reason.

## Tailwind

Respect the project's installed Tailwind version and conventions.

Use existing utilities where practical.
Do not introduce another styling framework.

## Progressive Enhancement

The interface must remain understandable and usable
if an animation is unsupported or disabled.

Follow MOTION.md.
