import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { APP_NAME, APP_TAGLINE } from "@/utils/utils";

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
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_TAGLINE,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${zodiak.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
