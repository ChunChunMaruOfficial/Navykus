'use client';

import { useEffect, useState } from 'react';

const GIT_HASH = '1b88e9d';

type HealthResponse = {
  ok: boolean;
  version?: string;
  deployedAt?: string;
};

const VersionBadge = () => {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        if (data.version) setVersion(data.version);
      })
      .catch(() => {
        setVersion(GIT_HASH);
      });
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '8px',
        right: '8px',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        color: 'rgba(255,255,255,0.75)',
        padding: '3px 10px',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: '20px',
      }}
    >
      {version ? `v.${version}` : '...'}
    </div>
  );
};

export default VersionBadge;
