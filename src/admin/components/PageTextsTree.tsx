import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';

import type { InitPageResult, DocumentSubViewTypes, ViewTypes, VisibleEntities } from 'payload';

import PageTextsTreeView from './PageTextsTreeView';

export type PageTextsTreeServerProps = {
  clientConfig: any;
  initPageResult: InitPageResult;
  i18n?: any;
  importMap?: any;
  params?: any;
  payload?: any;
  searchParams?: any;
  viewActions?: any[];
  collectionConfig?: any;
  globalConfig?: any;
  docID?: number | string;
  documentSubViewType?: DocumentSubViewTypes;
  viewType?: ViewTypes;
};

const PageTextsTree = (props: PageTextsTreeServerProps) => {
  const {
    initPageResult,
    i18n,
    importMap,
    params,
    payload,
    searchParams,
    viewActions,
    collectionConfig,
    globalConfig,
    docID,
    documentSubViewType,
    viewType,
  } = props;

  const req = initPageResult?.req;
  const permissions = initPageResult?.permissions;
  const visibleEntities: VisibleEntities = (initPageResult?.visibleEntities as VisibleEntities) || {
    collections: [],
    globals: [],
  };
  const locale = initPageResult?.locale;

  return (
    <DefaultTemplate
      collectionSlug={collectionConfig?.slug}
      docID={docID}
      documentSubViewType={documentSubViewType}
      globalSlug={globalConfig?.slug}
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload || req?.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req?.user}
      viewActions={viewActions}
      visibleEntities={visibleEntities}
      viewType={viewType}
    >
      <PageTextsTreeView />
    </DefaultTemplate>
  );
};

export default PageTextsTree;
