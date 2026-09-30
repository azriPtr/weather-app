import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { PlaceNavigationProvider } from "@/components/navigation/place-navigation";
import { UnitProvider } from "@/components/units/unit-provider";
import { site } from "@/config";
import { getPreferences } from "@/lib/preferences";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.name,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#12162b",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { units } = await getPreferences();

  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-white px-4 py-2 font-medium text-neutral-900 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <UnitProvider initialSystem={units}>
          <PlaceNavigationProvider>{children}</PlaceNavigationProvider>
        </UnitProvider>
      </body>
    </html>
  );
}
