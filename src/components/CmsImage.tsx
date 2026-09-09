import type { CSSProperties, ReactNode } from 'react';

import { apiAssetUrl } from '../api';
import { useSlotImage } from '../hooks/useCmsPageMedia';
import BrandImage from './BrandImage';

type CmsImageProps = {
  /** Slot key from `src/page-media.ts`. */
  slot: string;
  /**
   * Explicit image URL that wins over the slot (e.g. a photo uploaded straight
   * onto a CMS object like a championship). When empty/undefined the slot logic
   * from «Дерево медиа» applies as before.
   */
  overrideSrc?: string | null;
  alt?: string;
  aspectRatio?: string;
  objectPosition?: CSSProperties['objectPosition'];
  priority?: boolean;
  className?: string;
  overlay?: boolean | ReactNode;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
};

/**
 * Renders a `BrandImage` whose source is controlled by the CMS «Дерево медиа»,
 * unless `overrideSrc` is provided (an image attached directly to a CMS record).
 * Falls back to the built-in image when there is no override, and renders
 * nothing when an admin hid the slot and nothing overrides it.
 */
export default function CmsImage({ slot, overrideSrc, alt, aspectRatio, ...rest }: CmsImageProps) {
  const resolved = useSlotImage(slot);
  const override = overrideSrc ? apiAssetUrl(overrideSrc) : undefined;

  const src = override ?? resolved.src;
  if (!src) return null;

  return (
    <BrandImage
      src={src}
      alt={alt ?? resolved.alt}
      aspectRatio={aspectRatio ?? resolved.aspectRatio}
      {...rest}
    />
  );
}
