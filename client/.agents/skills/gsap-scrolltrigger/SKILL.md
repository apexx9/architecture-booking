---
name: gsap-scrolltrigger
description: Advanced GSAP timelines, ScrollTrigger, pinned sections, scroll choreography and editorial web experiences.
---

# GSAP and ScrollTrigger

Use this skill for complex, coordinated motion that cannot
be implemented cleanly with ordinary CSS or component transitions.

## Appropriate Use Cases

- Scroll-driven storytelling.
- Pinned editorial sections.
- Coordinated multi-element timelines.
- Horizontal scrolling experiences.
- Complex image and typography sequences.
- Carefully controlled parallax.

Do not use GSAP for every small interaction.

## Before Implementation

1. Inspect installed GSAP packages and versions.
2. Read the relevant installed documentation.
3. Inspect the component structure.
4. Understand existing scroll behaviour.
5. Identify conflicts with existing scroll animations.

## React Integration

- Use the supported GSAP React integration if installed.
- Scope selectors to the component.
- Use context-safe cleanup.
- Revert animations when components unmount.
- Avoid global selectors that affect unrelated pages.
- Avoid duplicate ScrollTriggers.

## ScrollTrigger

Use:
- start and end deliberately.
- scrub only when continuous scroll-linked motion is useful.
- pin only when it improves storytelling.
- invalidateOnRefresh where appropriate.
- refresh safely when layout changes require it.

Consider:
- Mobile viewport changes.
- Image loading.
- Dynamic content height.
- Nested scrolling.
- Sticky headers.
- Reduced-motion preferences.

## Performance

Avoid animating expensive layout properties.
Avoid excessive simultaneous ScrollTriggers.
Do not hijack normal scrolling without a compelling reason.

## Important

Never add GSAP to the project without checking whether
it is already installed and obtaining approval for a
new dependency.

Follow MOTION.md.
