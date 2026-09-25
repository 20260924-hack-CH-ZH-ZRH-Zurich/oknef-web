import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Preferences } from "@/features/preferences/Preferences";
import { ServiceWorker } from "@/features/preferences/ServiceWorker";
import { type Locale, locales } from "@/lib/locales";
import "@/styles/globals.css";
export const metadata: Metadata = {
  title: {
    default: "Oknef — Your life. Your legacy. Your terms.",
    template: "%s | Oknef",
  },
  description:
    "Organize your digital life, protect the people you trust, and prepare your legacy with care.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Oknef" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#17211a",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestedLocale = (await headers()).get("x-oknef-locale") as Locale;
  const locale = locales.includes(requestedLocale) ? requestedLocale : "en";
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Preferences initialLocale={locale}>{children}</Preferences>
        <ServiceWorker />
      </body>
    </html>
  );
}
