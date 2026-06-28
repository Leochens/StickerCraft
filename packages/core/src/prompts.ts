import { STICKER_STYLES } from './constants';
import { StickerRequest, StickerStyle } from './types';

export interface StickerRequestValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateStickerRequest = (request: StickerRequest): StickerRequestValidationResult => {
  const errors: string[] = [];

  if (!request.prompt.trim()) {
    errors.push('Prompt is required.');
  }

  if (!request.model.trim()) {
    errors.push('Image model is required.');
  }

  if (request.quantity < 1) {
    errors.push('Quantity must be at least 1.');
  }

  if (request.useStickerCollection && request.stickerCollectionCount < 2) {
    errors.push('Sticker collections require at least 2 items.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const buildStickerPrompt = (
  request: StickerRequest,
  styles: StickerStyle[] = STICKER_STYLES,
): string => {
  const style = styles.find(item => item.id === request.styleId) || styles[0];
  const background = request.backgroundConfig.enabled
    ? `keep a ${request.backgroundConfig.color} background`
    : 'generate on a controlled solid background for transparent PNG cleanup';
  const border = request.useStickerBorder ? 'with a clean white sticker border' : 'without a white sticker border';
  const text = request.textConfig.enabled
    ? `include text: ${request.textConfig.content || 'AI-chosen short sticker text'}`
    : 'no text';
  const layout = request.useStickerCollection
    ? `as a cohesive sheet of ${request.stickerCollectionCount} mini stickers`
    : request.useThreeViews
      ? 'as a front, side, and back three-view character sheet'
      : 'as one centered sticker asset';

  return [
    `Style: ${style.promptModifier}.`,
    `Subject: ${request.prompt}.`,
    `Output: ${layout}, ${border}, ${background}, ${text}.`,
  ].join(' ');
};
