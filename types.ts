export enum ModelType {
  NANO_BANANA_2 = 'gemini-3.1-flash-image-preview', // Best all-around Nano Banana model
  NANO_BANANA_PRO = 'gemini-3-pro-image-preview', // Professional assets, supports larger sizes
  NANO_BANANA = 'gemini-2.5-flash-image', // Fast and efficient
}

export enum APIProvider {
  GEMINI = 'gemini',
  GPT = 'gpt',
}

export interface ProviderAPISettings {
  apiKey: string;
  endpoint: string;
  imageModel: string;
  textModel: string;
}

export interface APISettings {
  activeProvider: APIProvider;
  gemini: ProviderAPISettings;
  gpt: ProviderAPISettings;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '3:4',
  LANDSCAPE = '4:3',
  WIDE = '16:9',
}

export enum ImageResolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K',
}

export interface StickerStyle {
  id: string;
  name: string; // English/Technical name
  label_zh?: string; // Chinese label
  promptModifier: string;
  previewColor: string;
  icon?: string;
  isCustom?: boolean;
  referenceImage?: string;
}

export interface TextConfig {
  enabled: boolean;
  content: string;
  font: string;
  hasBorder: boolean;
}

export interface BackgroundConfig {
  enabled: boolean;
  color: string;
}

export interface StickerRequest {
  prompt: string;
  styleId: string;
  quantity: number;
  model: string;
  aspectRatio: AspectRatio;
  resolution?: ImageResolution; // Only for Pro model
  textConfig: TextConfig;
  backgroundConfig: BackgroundConfig;
  useThreeViews: boolean;
  useStickerCollection: boolean;
  stickerCollectionCount: number;
  collectionItemPrompts?: string[];
  useStickerBorder: boolean;
  useFacialFeatures: boolean;
  referenceImage?: string; // Base64 data for image-to-image
}

export interface GeneratedImage {
  id: string;
  dataUrl: string;
  prompt: string;
  createdAt: number;
  styleName: string;
  backgroundRemoved?: boolean;
  backgroundColor?: string;
  hasStickerBorder?: boolean;
  hasText?: boolean;
  hasReferenceImage?: boolean;
  isThreeViews?: boolean;
  isStickerCollection?: boolean;
  stickerCollectionCount?: number;
  sourceType?: 'generated' | 'uploaded';
  collectionItems?: GeneratedImage[];
  splitMethod?: 'auto' | 'manual';
  splitIndex?: number;
  splitSource?: StickerSplitSource;
}

export interface ImageCropBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CropAdjustments {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface StickerSplitSource {
  box: ImageCropBox;
  sourceWidth: number;
  sourceHeight: number;
  cropAdjustments?: CropAdjustments;
}

export type BeadPaletteBrand = 'perler' | 'hama' | 'artkal' | 'mard';

export interface BeadPaletteColor {
  id: string;
  name: string;
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
}

export interface BeadPalette {
  brand: BeadPaletteBrand;
  label: string;
  colors: BeadPaletteColor[];
}

export interface BeadPatternOptions {
  paletteBrand: BeadPaletteBrand;
  width: number;
  maxColors: number;
  ignoreTransparent: boolean;
}

export interface BeadPatternCell {
  x: number;
  y: number;
  colorId?: string;
  hex?: string;
  transparent?: boolean;
}

export interface BeadPattern {
  width: number;
  height: number;
  palette: BeadPalette;
  cells: BeadPatternCell[];
  materialList: Array<{
    color: BeadPaletteColor;
    count: number;
  }>;
  totalBeads: number;
  createdAt: number;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number; // 0 to 100
  currentTask?: string;
}

export type Language = 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'pt';
