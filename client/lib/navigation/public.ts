/** Public navigation shared by the desktop header and mobile drawer. */
export interface PublicNavLink {
  name: string;
  href: string;
}

export const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { name: "Overview", href: "/" },
  { name: "The workspace", href: "/#product" },
  { name: "How it works", href: "/#workflow" },
];
