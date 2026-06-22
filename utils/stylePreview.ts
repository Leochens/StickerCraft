import { StickerStyle } from '../types';

/** UI thumbnail for style picker; custom styles may fall back to referenceImage. */
export function getStylePreviewImage(style: StickerStyle): string | undefined {
  return style.previewImage ?? style.referenceImage;
}
