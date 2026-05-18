export enum ModelType {
  STANDARD = 'gemini-2.5-flash-image', // Fast, efficient
  PRO = 'gemini-3-pro-image-preview', // High quality, supports sizes
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
  backgroundColor: string;
}

export interface StickerRequest {
  prompt: string;
  styleId: string;
  quantity: number;
  model: ModelType;
  aspectRatio: AspectRatio;
  resolution?: ImageResolution; // Only for Pro model
  textConfig: TextConfig;
  useThreeViews: boolean;
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
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number; // 0 to 100
  currentTask?: string;
}

export type Language = 'en' | 'zh';