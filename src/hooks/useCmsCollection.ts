import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { apiUrl } from '../api';

type CmsResponse<T> = { docs?: T[] } | T[];

type CmsState<T> = {
  data: T[] | undefined;
  error: boolean;
  isLoading: boolean;
};

const docsFrom = <T,>(payload: CmsResponse<T>) => Array.isArray(payload) ? payload : (payload.docs || []);

export const useCmsLanguage = () => {
  const { i18n } = useTranslation();
  return (i18n.resolvedLanguage || i18n.language || 'ru').split('-')[0];
};

export const useCmsCollection = <TRaw, TMapped>({
  path,
  map,
  filter,
  enabled = true,
}: {
  path: string;
  map: (doc: TRaw) => TMapped;
  filter?: (doc: TMapped) => boolean;
  enabled?: boolean;
}) => {
  const [state, setState] = useState<CmsState<TMapped>>({
    data: undefined,
    error: false,
    isLoading: true,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: [], error: false, isLoading: false });
      return undefined;
    }

    let isMounted = true;
    setState((current) => ({ ...current, error: false, isLoading: true }));

    fetch(apiUrl(path), { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch CMS data: ${path}`);
        return res.json() as Promise<CmsResponse<TRaw>>;
      })
      .then((payload) => {
        if (!isMounted) return;
        const mappedDocs = docsFrom(payload).map(map);
        setState({ data: filter ? mappedDocs.filter(filter) : mappedDocs, error: false, isLoading: false });
      })
      .catch(() => {
        if (!isMounted) return;
        setState({ data: undefined, error: true, isLoading: false });
      });

    return () => {
      isMounted = false;
    };
  }, [enabled, filter, path]);

  const data = useMemo(() => {
    if (state.error || state.data === undefined) return undefined;
    return state.data;
  }, [state.data, state.error]);

  return {
    data,
    isLoading: state.isLoading,
    hasLoadError: state.error,
    source: state.error || state.data === undefined ? 'empty' : 'cms',
  } as const;
};
