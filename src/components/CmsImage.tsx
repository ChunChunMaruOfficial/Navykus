import type { CSSProperties, ReactNode } from 'react';

import { useSlotImage } from '../hooks/useCmsPageMedia';
import BrandImage from './BrandImage';

type CmsImageProps = {
  /** Slot key from `src/page-media.ts`. */
  slot: string;
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
 * Renders a `BrandImage` whose source is controlled by the CMS «Дерево медиа».
 * Falls back to the built-in image when there is no override, and renders
 * nothing when an admin hid the slot.
 */
export default function CmsImage({ slot, alt, aspectRatio, ...rest }: CmsImageProps) {
  const resolved = useSlotImage(slot);

  if (!resolved.src) return null;

  return (
    <BrandImage
      src={resolved.src}
      alt={alt ?? resolved.alt}
      aspectRatio={aspectRatio ?? resolved.aspectRatio}
      {...rest}
    />
  );
}
