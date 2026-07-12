import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import '@payloadcms/next/css';
import type React from 'react';

import config from '../../payload.config';
import { importMap } from './admin/importMap.js';

export { metadata } from '@payloadcms/next/layouts';

const serverFunction: typeof handleServerFunctions = async (args) => {
  'use server';

  return handleServerFunctions(args);
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
