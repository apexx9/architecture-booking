---
name: motion-react
description: React component animations, transitions, gestures, layout animations and presence management using Motion for React.
---

# Motion for React

Use this skill when implementing React-specific animations.

## First

Inspect package.json and the lockfile.

Determine whether the project uses:
- motion
- framer-motion
- Another animation library

Do not assume the package or API version.

Motion for React is imported from "motion/react" when the
modern Motion package is installed.

Do not migrate libraries without explicit approval.

## Suitable Use Cases

- Component entrance and exit.
- Dialog and modal transitions.
- Dropdown and popover transitions.
- Navigation indicators.
- Shared layout transitions.
- Expandable sections.
- Drag and gesture interactions.
- Small state transitions.

## Implementation Principles

- Keep animation logic close to the component it controls.
- Prefer reusable variants for repeated choreography.
- Use AnimatePresence for supported exit transitions.
- Use layout animations selectively.
- Avoid unnecessary layout animations in large tables.
- Avoid animating entire application trees.
- Keep React keys stable.
- Avoid unnecessary state updates for animation frames.
- Ensure event handlers and effects are cleaned up.

## React and Next.js

Respect Server and Client Component boundaries.

Only introduce "use client" when browser interaction,
hooks or client-side animation actually require it.

Do not turn entire pages into Client Components merely
to animate one small component.

Use progressive enhancement where practical.

## Avoid

- Multiple animation libraries for the same interaction.
- Animations that block navigation.
- Excessive spring configurations.
- Unnecessary AnimatePresence wrappers.
- Repeatedly mounting and unmounting large component trees.

## Validation

Test:
- Initial render.
- State changes.
- Rapid repeated interaction.
- Component unmounting.
- Reduced-motion behaviour.
- Mobile responsiveness.
