import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { apiUrl } from '../api';
import type { EditablePageTextPage } from '../page-texts';
import { useCmsLanguage } from './useCmsCollection';

type PageTextsResponse = {
  texts?: Record<string, string>;
};

export const useCmsPageTexts = (pages: readonly EditablePageTextPage[]) => {
  const { i18n } = useTranslation();
  const language = useCmsLanguage();
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const pageParam = useMemo(() => Array.from(new Set(pages)).sort().join(','), [pages]);

  useEffect(() => {
    if (!pageParam) {
      setTexts({});
      setIsLoading(false);
      setHasLoadError(false);
      return undefined;
    }

    let isMounted = true;
    const path = `/api/page-texts?pages=${encodeURIComponent(pageParam)}&lang=${encodeURIComponent(language)}`;
    setIsLoading(true);
    setHasLoadError(false);

    fetch(apiUrl(path), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch page texts: ${path}`);
        return res.json() as Promise<PageTextsResponse>;
      })
      .then((payload) => {
        if (!isMounted) return;
        const incoming = payload.texts || {};
        const texts: Record<string, string> = {};
        for (const [key, value] of Object.entries(incoming)) {
          const trimmed = typeof value === 'string' ? value.trim() : '';
          if (!trimmed) continue;
          texts[key] = trimmed;
          i18n.addResource(language, 'translation', key, trimmed, { silent: true });
        }
        setTexts(texts);
        setIsLoading(false);
        setHasLoadError(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setTexts({});
        setIsLoading(false);
        setHasLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [i18n, language, pageParam]);

  return {
    texts,
    isLoading,
    hasLoadError,
  };
};
