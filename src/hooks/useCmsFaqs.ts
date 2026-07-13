import { useEffect, useMemo, useState } from 'react';

import { fetchFaqs } from '../api';
import type { FaqItem, PageKey } from '../types';

export const useCmsFaqs = (page: PageKey, fallbackItems: FaqItem[]) => {
  const [cmsItems, setCmsItems] = useState<FaqItem[] | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchFaqs(page)
      .then((items) => {
        if (isMounted) setCmsItems(items);
      })
      .catch(() => {
        if (isMounted) setCmsItems([]);
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  return useMemo(() => {
    if (!cmsItems?.length) return fallbackItems;
    return cmsItems;
  }, [cmsItems, fallbackItems]);
};
