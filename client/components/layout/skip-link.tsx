/**
 * Keyboard-only bypass link.
 *
 * First focusable element on every page. Invisible until focused, at which point
 * it sits above the header and moves focus into the main content — without it,
 * a keyboard user has to tab through the entire header and workspace navigation
 * to reach the screen they asked for.
 */
const SkipLink = () => (
  <a
    href="#main"
    className={[
      "sr-only rounded-sm bg-ink px-4 py-2.5 text-[13px] font-medium text-ink-inverse",
      "focus:not-sr-only",
      // `fixed` so it is not affected by the sticky header or the workspace's
      // `overflow-hidden` shell.
      "focus:fixed focus:top-3 focus:left-3 focus:z-[100]",
      "focus:outline-2 focus:outline-offset-2 focus:outline-ink",
    ].join(" ")}
  >
    Skip to content
  </a>
);

export default SkipLink;