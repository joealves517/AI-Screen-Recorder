import Hero from "@/app/components/ui/Hero";
import { StructuredData, generateWebAppSchema, generateOrganizationSchema } from "@/app/components/seo/StructuredData";
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = 'https://vidflow.dev';

  const metadata = {
    es: {
      title: 'Crea demos profesionales y edita videos en segundos',
      description: 'Editor de video online gratuito con IA. Graba pantalla, añade zooms cinemáticos, mockups profesionales y exporta en HD. Sin marca de agua.',
      keywords: ['editor de video', 'grabar pantalla', 'demos profesionales', 'zoom video', 'mockups', 'screen recorder', 'video editor online'],
    },
    en: {
      title: 'Create Professional Demos and Edit Videos in Seconds',
      description: 'Free AI-powered online video editor. Screen recorder, cinematic zooms, professional mockups, and HD export. No watermark.',
      keywords: ['video editor', 'screen recorder', 'professional demos', 'video zoom', 'mockups', 'online video editor', 'free video editor'],
    },
  };

  const { title, description, keywords } = metadata[locale as 'es' | 'en'] || metadata.es;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        es: `${baseUrl}/es`,
        en: `${baseUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      images: [
        {
          url: `${baseUrl}/images/metadata/preview-openvid.jpg`,
          width: 1200,
          height: 630,
          alt: 'VidFlow - Professional Video Editor',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/images/metadata/preview-openvid.jpg`],
    },
  };
}

export default function Home({ params }: any) {
  const locale = 'en';

  return (
    <>
      <StructuredData data={generateWebAppSchema(locale as 'es' | 'en')} />
      <StructuredData data={generateOrganizationSchema()} />
      
      <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-radial-primary w-full h-[calc(100vh-4rem)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-75 h-75 rounded-full bg-cyan-500/15 blur-[80px] pointer-events-none z-0" aria-hidden="true" />

        <section className="w-full flex items-center justify-center py-6 sm:py-12 relative z-10" aria-label="Hero section">
          <div className="max-w-6xl mx-auto px-6 text-center w-full">
            <Hero />
          </div>
        </section>
      </div>
    </>
  );
}