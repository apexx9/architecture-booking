---
name: accessible-motion
description: Accessible animation, reduced-motion support, performance, interaction safety and motion-related UX considerations.
---

# Accessible and Performant Motion

Use this skill whenever implementing or reviewing animations.

## Reduced Motion

Respect prefers-reduced-motion.

Use CSS media queries and the animation library's
supported reduced-motion facilities.

Do not simply hide important content when motion is reduced.

Replace nonessential movement with simpler transitions
or immediate state changes.

## Accessibility

- Preserve semantic HTML.
- Preserve keyboard access.
- Preserve visible focus indicators.
- Do not communicate state through movement alone.
- Avoid flashing and rapid repeated motion.
- Avoid unexpected auto-playing animations.
- Avoid disorienting parallax.
- Keep reading order intact.
- Do not hide important content until an animation completes.

## Performance

- Prefer transform and opacity.
- Avoid unnecessary layout recalculation.
- Avoid excessive observers and listeners.
- Clean up animation instances.
- Avoid long-running animations without a purpose.
- Avoid unnecessary JavaScript animation loops.
- Test on lower-powered devices.

## User Control

Users must be able to interact with the interface
without waiting for decorative motion.

Do not block forms, navigation or essential actions
behind animation completion.

## Testing

Test:
- Normal motion.
- Reduced motion.
- Keyboard navigation.
- Mobile viewport.
- Slow device conditions.
- Repeated interactions.
- Page navigation and component unmounting.

Follow MOTION.md.
