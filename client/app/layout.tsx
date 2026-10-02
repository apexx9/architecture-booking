import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import SkipLink from "@/components/layout/skip-link";
import { APP_NAME, APP_TAGLINE } from "@/utils/utils";
import { SITE_URL } from "@/lib/site";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/satoshi/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/Satoshi-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
});

const zodiak = localFont({
  src: [
    {
      path: "../public/fonts/zodiak-font-family/Zodiak-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/zodiak-font-family/Zodiak-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/zodiak-font-family/Zodiak-Extrabold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/zodiak-font-family/Zodiak-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-zodiak",
});

export const metadata: Metadata = {
  /**
   * Absolute origin for anything a crawler reads — og:url, share-card URLs,
   * canonical hrefs. Sourced from the same env as the sitemap and robots.txt.
   */
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  /*
   * The share image itself comes from `app/opengraph-image.png`, which Next
   * emits with a hashed URL. Naming it here would produce a broken absolute
   * path, so only the surrounding fields are declared.
   */
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_TAGLINE,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_TAGLINE,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${zodiak.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {/*
           * Wraps every route, because the toast viewport has to stay mounted for
           * live-region updates to be announced. Inside `AuthProvider` so a
           * sign-in or tenant switch can toast too.
           */}
          <ToastProvider>
            <SkipLink />

            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
