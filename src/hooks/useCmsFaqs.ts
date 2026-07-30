import { useCmsCollection, useCmsLanguage } from './useCmsCollection';

import type { FaqItem, PageKey } from '../types';

export const useCmsFaqs = (page: PageKey) => {
  const language = useCmsLanguage();
  return useCmsCollection<FaqItem, FaqItem>({
    path: `/api/faqs?page=${encodeURIComponent(page)}&lang=${encodeURIComponent(language)}`,
    map: (item) => item,
  }).data || [];
};
