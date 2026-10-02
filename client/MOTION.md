# Renove Motion Design System

## Purpose
Motion is part of Renove's design language. It should make the
interface feel considered, responsive, spatially coherent and
professionally crafted.

Renove takes inspiration from architectural portfolios,
editorial experiences and premium productivity software.

Motion must support the experience, never compete with it.

## Motion Principles

1. Purpose before decoration.
2. Restraint before spectacle.
3. Continuity between interface states.
4. Natural, carefully tuned easing.
5. Consistency across the entire application.
6. Accessibility and performance are mandatory.

## Two Motion Contexts

### Public Website
The public website can use more expressive motion:
- Editorial typography reveals.
- Image masking and clipping.
- Subtle parallax.
- Scroll-triggered transitions.
- Carefully choreographed section entrances.
- Sophisticated hover interactions.

Motion should feel architectural, cinematic and restrained.

### Workspace Application
The workspace is a productivity environment.
Prioritise:
- Fast feedback.
- Small interaction transitions.
- Smooth drawers and dialogs.
- Table and list state transitions where useful.
- Navigation feedback.
- Loading and progress indicators.
- Clear state changes.

Do not introduce elaborate scroll effects into everyday
administrative workflows.

## Timing Guidance

These are starting points, not rigid rules:

- Microinteraction: 100–180ms.
- Button and control feedback: 120–200ms.
- Dropdown and popover: 150–220ms.
- Dialog and drawer: 180–300ms.
- Content entrance: 250–500ms.
- Editorial image reveal: 500–900ms.

Avoid making frequent interactions feel slow.

## Easing

Prefer deliberate ease-out curves for entrances and
ease-in curves for exits.

Use spring motion only when it adds meaningful physical
feedback. Avoid exaggerated bounce and elastic effects.

Avoid linear easing for ordinary interface transitions.

## Visual Rules

- Avoid excessive scaling.
- Avoid unnecessary rotation.
- Avoid continuous decorative movement.
- Avoid large-distance translations.
- Avoid animating every element independently.
- Avoid animation that delays access to content.
- Avoid excessive stagger delays.
- Avoid motion that makes the interface feel unstable.

## Technical Rules

- Prefer transform and opacity for animated elements.
- Avoid repeatedly animating layout-triggering properties.
- Avoid unnecessary requestAnimationFrame loops.
- Clean up observers, listeners and animation instances.
- Prevent layout shifts.
- Avoid introducing animation libraries without approval.
- Follow the installed versions of libraries and their APIs.
- Never assume a library is installed; inspect package.json first.

## Accessibility

Respect prefers-reduced-motion.

Reduced-motion users must retain access to the same
information and functionality.

Do not communicate important state changes through
animation alone.

Preserve keyboard interaction, focus management and
screen-reader semantics.

## Responsive Behaviour

Review motion on mobile, tablet and desktop.

Reduce or remove complex parallax and scroll choreography
where it harms usability or performance.

## Implementation Workflow

Before implementing motion:

1. Identify the purpose of the animation.
2. Identify the elements and states involved.
3. Select the simplest suitable technique.
4. Check the existing codebase and installed dependencies.
5. Implement with reusable, maintainable patterns.
6. Test normal and reduced-motion behaviour.
7. Inspect the result in the browser.
8. Refine timing, easing and visual continuity.

The final result should feel intentional, not animated
for the sake of being animated.
