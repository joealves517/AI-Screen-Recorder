import Script from 'next/script';

type WebApplicationSchema = {
  '@context': 'https://schema.org';
  '@type': 'WebApplication';
  name: string;
  applicationCategory: 'MultimediaApplication';
  operatingSystem: 'Any';
  offers: {
    '@type': 'Offer';
    price: '0';
    priceCurrency: 'USD';
  };
  description: string;
  url: string;
  image?: string;
  author?: {
    '@type': 'Organization' | 'Person';
    name: string;
    url?: string;
  };
  featureList?: string[];
};

type OrganizationSchema = {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    contactType: string;
    email?: string;
  };
};

type BreadcrumbSchema = {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
};

type StructuredDataProps = {
  data: WebApplicationSchema | OrganizationSchema | BreadcrumbSchema | Record<string, unknown>;
};

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id={`structured-data-${data['@type']}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="beforeInteractive"
    />
  );
}

export function generateWebAppSchema(locale: 'es' | 'en'): WebApplicationSchema {
  const baseUrl = 'https://vidflow.dev';

  const content = {
    es: {
      name: 'VidFlow - Editor de Video Online',
      description: 'Editor de video online gratuito con IA. Graba pantalla, añade zooms cinemáticos, mockups profesionales y exporta en HD sin marca de agua.',
      features: [
        'Grabación de pantalla HD',
        'Zooms cinemáticos con IA',
        'Mockups profesionales',
        'Sin marca de agua',
        'Exportación en alta calidad',
        'Editor online gratuito',
      ],
    },
    en: {
      name: 'VidFlow - Online Video Editor',
      description: 'Free AI-powered online video editor. Screen recorder, cinematic zooms, professional mockups, and HD export without watermark.',
      features: [
        'HD screen recording',
        'AI-powered cinematic zooms',
        'Professional mockups',
        'No watermark',
        'High quality export',
        'Free online editor',
      ],
    },
    ru: {
      name: 'VidFlow - Online Video Editor',
      description: 'Бесплатный онлайн-видеоредактор на базе ИИ. Запись экрана, кинематографичное приближение, профессиональные мокапы и экспорт в HD без водяных знаков.',
      features: [
        'Запись экрана в HD',
        'Кинематографичное приближение на базе ИИ',
        'Профессиональные мокапы',
        'Без водяных знаков',
        'Экспорт в высоком качестве',
        'Бесплатный онлайн-редактор',
      ],
    },
  };

  const { name, description, features } = content[locale];

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description,
    url: baseUrl,
    image: `${baseUrl}/images/metadata/preview-openvid.jpg`,
    author: {
      '@type': 'Person',
      name: 'Cristian Olivera',
      url: baseUrl,
    },
    featureList: features,
  };
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'VidFlow',
    url: 'https://vidflow.dev',
    logo: 'https://vidflow.dev/images/metadata/favicon.svg',
    sameAs: [
      'https://twitter.com/VidFlowdev',
      'https://github.com/VidFlowdev',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@vidflow.dev',
    },
  };
}
