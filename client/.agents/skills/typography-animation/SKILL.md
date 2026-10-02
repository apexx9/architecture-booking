---
name: typography-animation
description: Editorial typography animation including line reveals, word staggering, clipping and carefully choreographed heading entrances.
---

# Typography Animation

Use this skill when headings, statements or editorial text
need expressive but restrained animation.

## Techniques

- Line-by-line reveals.
- Word-level stagger.
- Character-level animation when justified.
- Clip-path and overflow masking.
- Subtle opacity and vertical movement.
- Text transitions between interface states.

## Design Principles

Typography must remain readable throughout the animation.

Avoid:
- Excessive character-by-character effects.
- Large translations.
- Rotating individual letters.
- Long delays before text becomes readable.
- Animating body copy unnecessarily.

Prefer line-level animation for editorial headings.

## Technical Considerations

- Preserve semantic text in the DOM.
- Do not make screen readers announce every animated character.
- Avoid splitting text in ways that break accessibility.
- Handle responsive line wrapping.
- Do not assume a heading has the same line count at every width.
- Avoid hydration mismatches in Next.js.
- Avoid layout shifts during text animation.

Use Satoshi and Zodiak according to Renove's existing
typography system.

Follow MOTION.md.
