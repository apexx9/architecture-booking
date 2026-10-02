# Renove — Design System

## Intent
Renove is a professional operating system for architecture and interior-design practices. Its interface should communicate architectural judgement, operational clarity and quiet confidence.

**Keywords:** architectural, editorial, precise, calm, tactile, restrained, deliberate.

## Existing foundations
- **Satoshi** (`--font-satoshi`): UI, body, navigation, labels and controls.
- **Zodiak** (`--font-zodiak`): selective editorial/display moments, primarily public-facing. Do not use it for dense workspace UI.
- Tailwind CSS v4 and the CSS-first setup in `app/globals.css`.
Preserve these foundations. Do not add fonts or replace them without approval.

## Colour
Start from the existing white canvas (`#ffffff`) and charcoal foreground (`#191919`). Use a restrained neutral system:
- Canvas: white or a very subtle neutral.
- Surfaces: white and restrained neutral tints for grouping.
- Text: charcoal primary, accessible muted secondary.
- Borders: fine, low-contrast neutral lines.
- Accent: rare and purposeful; stronger colour is reserved for meaningful status or action feedback.

Avoid purple/blue gradients, neon, decorative blobs, glassmorphism and large saturated panels. Status must not rely on colour alone.

## Typography
Satoshi is the UI workhorse; Zodiak is an accent. Establish hierarchy through size, weight, line-height and spacing. Avoid excessive uppercase and tracking. Keep body copy readable and workspace labels compact. Use tabular numerals for aligned quantities, dates, financial values and counts. Avoid oversized workspace headings. Use balanced heading wraps and inspect real content at narrow widths.

## Shape and depth
Prefer square or subtly rounded geometry. Avoid default pill-shaped controls and heavily rounded cards. Use fine borders and spacing before shadows. Shadows, if needed, should be subtle and contextual. No glassmorphism.

## Layout
### Public site
Maintain the existing architecture-led, editorial, image-forward character. Use generous negative space and strong composition. Preserve existing public navigation and meaningful motion behaviour.

### Workspace
Prioritise scanability and task completion. Establish page title, contextual description/actions, then primary content. Use consistent alignment and spacing. Keep tables and operational data compact but readable. Do not turn every information group into a floating card. Navigation is infrastructure, not decoration. Design for laptop widths and provide an intentional mobile navigation pattern.

## Spacing
Use Tailwind's 4px-based spacing rhythm. Create hierarchy with deliberate tight, standard, generous and expansive gaps. Avoid arbitrary one-off values when the scale communicates the same intent.

## Components
- Buttons: clear primary, secondary, tertiary and destructive hierarchy; not every action is filled.
- Inputs: visible labels, clear focus, concise validation and helper text.
- Navigation: active state is clear without colour alone; unavailable destinations must not look actionable.
- Tables/lists: align numeric values; keep row actions discoverable without clutter.
- Status: concise text plus a semantic cue.
- Empty states: explain what belongs there and provide a next step only if supported by product requirements.
- Icons: use existing `lucide-react`; do not add another icon library.

## Motion and accessibility
Use motion to clarify state changes, navigation and spatial transitions—not as decoration. Respect reduced motion. Use semantic HTML, visible keyboard focus, accessible names, labels and sufficient contrast. Avoid hover-only actions.

## Content voice
Use direct, specific language and the vocabulary of architecture/design practices: studio, lead, client, proposal, project, phase, deliverable, approval, vendor, procurement, site visit, invoice. Avoid generic SaaS slogans, vague AI copy and fabricated customer/project data. Clearly label demonstration fixtures.

## Quality bar
Inspect hierarchy, alignment, spacing, text wrapping, realistic content, relevant UI states, keyboard operation, contrast, reduced motion and 375px/tablet/desktop layouts before considering a screen complete.
