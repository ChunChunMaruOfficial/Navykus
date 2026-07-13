import type { CSSProperties, ReactNode } from 'react';

type BrandImageProps = {
  src: string;
  webpSrc?: string;
  alt: string;
  aspectRatio?: string;
  objectPosition?: CSSProperties['objectPosition'];
  priority?: boolean;
  className?: string;
  overlay?: boolean | ReactNode;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export default function BrandImage({
  src,
  webpSrc,
  alt,
  aspectRatio = '4 / 3',
  objectPosition = 'center',
  priority = false,
  className = '',
  overlay,
  sizes = '100vw',
  loading,
  fetchPriority,
}: BrandImageProps) {
  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy');
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto');

  return (
    <figure
      className={`relative overflow-hidden rounded-[1.5rem] border border-white/65 bg-white/35 shadow-[0_20px_60px_rgba(91,100,114,0.11)] ${className}`}
      style={{ aspectRatio }}
    >
      <picture>
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={resolvedLoading}
          fetchPriority={resolvedFetchPriority}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover saturate-[0.92]"
          style={{ objectPosition }}
        />
      </picture>
      {overlay === true && <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/28 via-transparent to-white/10" />}
      {overlay && overlay !== true && <div className="absolute inset-0">{overlay}</div>}
    </figure>
  );
}
