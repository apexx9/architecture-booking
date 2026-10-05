interface LogoMarkProps {
  /** Pixel size of the square mark. Defaults to the size the wordmark sits at. */
  size?: number;
  className?: string;
}

/**
 * The Renove arch mark on its own — the same geometry as `app/icon.svg`, inlined
 * so it can take the current text colour and scale with its container.
 *
 * Used when there is no room for the wordmark, which is the collapsed sidebar.
 * Reaching for `next/image` here would mean shipping a second raster asset for
 * a shape that is two paths.
 */
const LogoMark = ({ size = 24, className }: LogoMarkProps) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    role="img"
    aria-label="Renove"
    focusable="false"
  >
    <rect width="64" height="64" rx="12" className="fill-ink" />
    <path fill="currentColor" d="M19 47V30.5a13 13 0 0 1 26 0V47z" className="text-ink-inverse" />
    <path fill="currentColor" d="M29.5 47V36.5a2.5 2.5 0 0 1 5 0V47z" className="text-ink" />
  </svg>
);

export default LogoMark;