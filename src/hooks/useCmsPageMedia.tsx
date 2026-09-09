import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { apiAssetUrl, apiUrl } from '../api';
import { PAGE_MEDIA_SLOT_MAP, type PageMediaOverride } from '../page-media';

type OverrideMap = Record<string, PageMediaOverride>;

type MediaContextValue = {
  overrides: OverrideMap;
  isLoading: boolean;
};

const MediaContext = createContext<MediaContextValue>({ overrides: {}, isLoading: true });

export const CmsMediaProvider = ({ children }: { children: ReactNode }) => {
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch(apiUrl('/api/page-media'), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch page media');
        return res.json() as Promise<{ media?: OverrideMap }>;
      })
      .then((payload) => {
        if (!isMounted) return;
        setOverrides(payload.media || {});
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setOverrides({});
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ overrides, isLoading }), [overrides, isLoading]);
  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
};

export type ResolvedSlotImage = {
  /** Final image URL, or null when the slot should render nothing. */
  src: string | null;
  alt: string;
  aspectRatio?: string;
  /** true when an admin explicitly hid this slot on the site. */
  hidden: boolean;
  /** true while the CMS override list is still loading. */
  isLoading: boolean;
};

/**
 * Resolves a page-image slot to the image the site should show:
 *  - admin hid the slot            → { src: null, hidden: true }
 *  - admin uploaded a replacement  → CMS image URL
 *  - otherwise                     → the built-in fallback image
 */
export const useSlotImage = (slotKey: string): ResolvedSlotImage => {
  const { t } = useTranslation();
  const { overrides, isLoading } = useContext(MediaContext);
  const def = PAGE_MEDIA_SLOT_MAP[slotKey];
  const override = overrides[slotKey];

  const fallbackAlt = def?.altKey ? t(def.altKey) : '';

  if (override?.hidden) {
    return { src: null, alt: fallbackAlt, aspectRatio: def?.aspectRatio, hidden: true, isLoading };
  }

  if (override?.url) {
    return {
      src: apiAssetUrl(override.url) || override.url,
      alt: override.alt || fallbackAlt,
      aspectRatio: def?.aspectRatio,
      hidden: false,
      isLoading,
    };
  }

  return {
    src: def?.fallbackSrc ?? null,
    alt: fallbackAlt,
    aspectRatio: def?.aspectRatio,
    hidden: false,
    isLoading,
  };
};
