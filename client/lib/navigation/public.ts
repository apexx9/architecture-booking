/**
 * Public (marketing) navigation, typed and shared.
 *
 * The header and its mobile drawer both read from the same list, so a route
 * added in one place shows up in the other. The footer keeps its own section
 * model — its groups carry more structure than a flat link list.
 *
 * `href` is deliberately a plain string. `typedRoutes` is off in this project;
 * turning it on would force every marketing placeholder to be statically known
 * before it could be listed here, and would need `as Route` casts at each call
 * site.
 */
export interface PublicNavLink {
  name: string;
  href: string;
}

export const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { name: "Overview", href: "/" },
  { name: "Pricing", href: "/pricing" },
  { name: "Templates", href: "/templates" },
  { name: "Resources", href: "/blog" },
  { name: "About", href: "/about" },
];
