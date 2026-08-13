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
  const [, setRevision] = useState(0);
  const pageParam = useMemo(() => Array.from(new Set(pages)).sort().join(','), [pages]);

  useEffect(() => {
    if (!pageParam) return undefined;

    let isMounted = true;
    const path = `/api/page-texts?pages=${encodeURIComponent(pageParam)}&lang=${encodeURIComponent(language)}`;

    fetch(apiUrl(path), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch page texts: ${path}`);
        return res.json() as Promise<PageTextsResponse>;
      })
      .then((payload) => {
        if (!isMounted) return;
        const texts = payload.texts || {};
        for (const [key, value] of Object.entries(texts)) {
          i18n.addResource(language, 'translation', key, value, { silent: true });
        }
        setRevision((current) => current + 1);
      })
      .catch(() => {
        if (isMounted) setRevision((current) => current + 1);
      });

    return () => {
      isMounted = false;
    };
  }, [i18n, language, pageParam]);
};
