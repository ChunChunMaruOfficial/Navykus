import { useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from '../i18n/languages';

const TITLE_KEYS: Record<string, string> = {
  home: 'meta.home.title',
  about: 'meta.about.title',
  championship: 'meta.championship.title',
  activities: 'meta.activities.title',
  'find-team': 'meta.findTeam.title',
  blog: 'meta.blog.title',
  'not-found': 'meta.notFound.title',
};

const DESCRIPTION_KEYS: Record<string, string> = {
  home: 'meta.home.description',
  about: 'meta.home.description',
  championship: 'meta.home.description',
  activities: 'meta.home.description',
  'find-team': 'meta.home.description',
  blog: 'meta.blog.description',
  'not-found': 'meta.notFound.description',
};

const upsertMeta = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
};

const upsertLink = (selector: string, attributes: Record<string, string>) => {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
};

const usePageMeta = (currentPage: string, t: (key: string) => string, i18n: { resolvedLanguage?: string; language?: string }) => {
  useEffect(() => {
    const title = t(TITLE_KEYS[currentPage] || 'meta.home.title');
    const description = t(DESCRIPTION_KEYS[currentPage] || 'meta.home.description');
    const canonicalHref =
      currentPage === 'not-found'
        ? window.location.href
        : `${window.location.origin}${currentPage === 'home' ? '/' : `/${currentPage}`}`;

    document.title = title;

    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = description;
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalHref });
    upsertMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: `${window.location.origin}/images/home/navykus-hero-team.jpg`,
    });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    if (currentPage === 'not-found') {
      upsertMeta('meta[name="robots"]', { name: 'robots', content: 'noindex' });
    } else {
      document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.remove();
    }

    // Hreflang alternate links
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    const origin = window.location.origin;
    const path = currentPage === 'home' ? '/' : `/${currentPage}`;
    SUPPORTED_LANGUAGES.forEach((lang) => {
      upsertLink(`link[rel="alternate"][hreflang="${lang}"]`, {
        rel: 'alternate',
        hreflang: lang,
        href: `${origin}${path}`,
      });
    });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${origin}${path}`,
    });

    // JSON-LD Structured Data (EducationalOrganization)
    const existingJsonLd = document.head.querySelector('script[type="application/ld+json"]');
    if (!existingJsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'seo-jsonld';
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: 'Navykus',
        alternateName: 'Навыкус',
        description: t('meta.home.description'),
        url: origin,
        foundingDate: '2026',
        sameAs: ['https://t.me/navykus_com'],
        knowsAbout: [
          'Project-based learning',
          'Online championships',
          'Youth education',
          'International student community',
        ],
      });
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, t, i18n.resolvedLanguage, i18n.language]);
};

export default usePageMeta;
