import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://vidflow.dev'),
  title: {
    default: "VidFlow - Crea demos profesionales y edita en segundos",
    template: "%s | VidFlow",
  },
  description: "Crea demos cinemáticas y edita videos en segundos. Añade zooms suaves, mockups, personaliza fondos y exporta demos profesionales.",
  applicationName: "VidFlow",
  keywords: [
    "VidFlow",
    "edición de video",
    "zoom video",
    "grabación de pantalla",
    "creador de demos",
    "tomas cinemáticas",
    "mockups",
    "Cristian Olivera",
  ],
  authors: [{ name: "Cristian Olivera" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "https://vidflow.dev/",
  },
  icons: {
    icon: "/images/metadata/favicon.svg",
    shortcut: "/images/metadata/shortcut.svg",
    apple: "/images/metadata/apple.svg",
  },
  openGraph: {
    type: "website",
    url: "https://vidflow.dev/",
    title: "VidFlow - Crea demos profesionales y edita en segundos",
    description:
      "Añade zooms suaves, mockups, personaliza fondos y exporta demos profesionales sin editores complejos.",
    images: [
      {
        url: "https://vidflow.dev/images/metadata/preview-openvid.jpg",
        width: 1200,
        height: 630,
        alt: "VidFlow - Creador de demos, Graba Pantalla y Editor de Video",
      },
    ],
    locale: "es_ES",
    siteName: "VidFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "VidFlow - Crea demos profesionales y edita en segundos",
    description:
      "Añade zooms suaves, mockups, personaliza fondos y exporta demos profesionales sin editores complejos.",
    images: ["https://vidflow.dev/images/metadata/preview-openvid.jpg"],
    creator: "@cristianolivera",
    site: "@VidFlowdev",
  },
  other: {
    "msapplication-TileColor": "#1f2937",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}