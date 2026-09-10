import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';

import type { VisibleEntities } from 'payload';

import type { PageTextsTreeServerProps } from './PageTextsTree';
import ChampionshipArchiveView from './ChampionshipArchiveView';

const ChampionshipArchive = (props: PageTextsTreeServerProps) => {
  const { initPageResult, i18n, params, payload, searchParams, viewActions } = props;
  const req = initPageResult?.req;
  const visibleEntities: VisibleEntities = (initPageResult?.visibleEntities as VisibleEntities) || {
    collections: [],
    globals: [],
  };

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={initPageResult?.locale}
      params={params}
      payload={payload || req?.payload}
      permissions={initPageResult?.permissions}
      req={req}
      searchParams={searchParams}
      user={req?.user}
      viewActions={viewActions}
      visibleEntities={visibleEntities}
    >
      <ChampionshipArchiveView />
    </DefaultTemplate>
  );
};

export default ChampionshipArchive;
