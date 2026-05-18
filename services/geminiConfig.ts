import { GoogleGenAI } from "@google/genai";
import { GeminiSettings, ModelType } from "../types";

export const GEMINI_SETTINGS_STORAGE_KEY = "stickerCraft_geminiSettings";
export const DEFAULT_GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/";
export const DEFAULT_GEMINI_IMAGE_MODEL = ModelType.NANO_BANANA_2;
export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-3-pro-preview";

export const OFFICIAL_IMAGE_MODELS = [
  {
    value: ModelType.NANO_BANANA_2,
    label: "Nano Banana 2 (Gemini 3.1 Flash Image Preview)",
    description: "Official recommended Nano Banana model for most image generation",
  },
  {
    value: ModelType.NANO_BANANA_PRO,
    label: "Nano Banana Pro (Gemini 3 Pro Image Preview)",
    description: "Official professional image model with 2K/4K support",
  },
  {
    value: ModelType.NANO_BANANA,
    label: "Nano Banana (Gemini 2.5 Flash Image)",
    description: "Official fast image model optimized for low latency",
  },
];

export const OFFICIAL_TEXT_MODELS = [
  {
    value: "gemini-3-pro-preview",
    label: "Gemini 3 Pro Preview",
  },
  {
    value: "gemini-3-flash-preview",
    label: "Gemini 3 Flash Preview",
  },
  {
    value: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
  },
];

const getEnvApiKey = (): string => {
  if (typeof process === "undefined" || !process.env) return "";
  return process.env.GEMINI_API_KEY || process.env.API_KEY || "";
};

export const getDefaultGeminiSettings = (): GeminiSettings => ({
  apiKey: getEnvApiKey(),
  endpoint: DEFAULT_GEMINI_ENDPOINT,
  imageModel: DEFAULT_GEMINI_IMAGE_MODEL,
  textModel: DEFAULT_GEMINI_TEXT_MODEL,
});

export const loadGeminiSettings = (): GeminiSettings => {
  const defaults = getDefaultGeminiSettings();

  if (typeof localStorage === "undefined") {
    return defaults;
  }

  try {
    const saved = localStorage.getItem(GEMINI_SETTINGS_STORAGE_KEY);
    if (!saved) return defaults;

    const parsed = JSON.parse(saved) as Partial<GeminiSettings>;
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : defaults.apiKey,
      endpoint: typeof parsed.endpoint === "string" && parsed.endpoint.trim()
        ? parsed.endpoint.trim()
        : defaults.endpoint,
      imageModel: typeof parsed.imageModel === "string" && parsed.imageModel.trim()
        ? parsed.imageModel.trim()
        : defaults.imageModel,
      textModel: typeof parsed.textModel === "string" && parsed.textModel.trim()
        ? parsed.textModel.trim()
        : defaults.textModel,
    };
  } catch (error) {
    console.warn("Failed to load Gemini settings, using defaults.", error);
    return defaults;
  }
};

export const saveGeminiSettings = (settings: GeminiSettings) => {
  const normalized: GeminiSettings = {
    apiKey: settings.apiKey.trim(),
    endpoint: settings.endpoint.trim() || DEFAULT_GEMINI_ENDPOINT,
    imageModel: settings.imageModel.trim() || DEFAULT_GEMINI_IMAGE_MODEL,
    textModel: settings.textModel.trim() || DEFAULT_GEMINI_TEXT_MODEL,
  };

  localStorage.setItem(GEMINI_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("stickerCraft:gemini-settings-updated", {
    detail: normalized,
  }));
};

export const resetGeminiSettings = () => {
  localStorage.removeItem(GEMINI_SETTINGS_STORAGE_KEY);
  const defaults = getDefaultGeminiSettings();
  window.dispatchEvent(new CustomEvent("stickerCraft:gemini-settings-updated", {
    detail: defaults,
  }));
  return defaults;
};

const parseEndpoint = (endpoint: string) => {
  const trimmed = endpoint.trim() || DEFAULT_GEMINI_ENDPOINT;
  const versionMatch = trimmed.match(/\/(v1(?:alpha|beta)?)\/?$/);

  if (!versionMatch) {
    return {
      baseUrl: trimmed.endsWith("/") ? trimmed : `${trimmed}/`,
      apiVersion: "v1beta",
    };
  }

  const apiVersion = versionMatch[1];
  const baseUrl = trimmed.slice(0, versionMatch.index);
  return {
    baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    apiVersion,
  };
};

export const createGeminiClient = () => {
  const settings = loadGeminiSettings();
  if (!settings.apiKey.trim()) {
    throw new Error("Please configure a Gemini API Key before generating stickers.");
  }

  const endpoint = parseEndpoint(settings.endpoint);

  return new GoogleGenAI({
    apiKey: settings.apiKey.trim(),
    httpOptions: {
      baseUrl: endpoint.baseUrl,
      apiVersion: endpoint.apiVersion,
    },
  });
};

export const modelSupportsImageSize = (model: string): boolean => {
  const normalized = model.toLowerCase();
  const hasProSegment = /(^|[-_.])pro([-_.]|$)/.test(normalized);
  const hasImageSegment = /(^|[-_.])image([-_.]|$)/.test(normalized);
  const hasFlash31Image = normalized.includes("3.1-flash-image");
  return model === ModelType.NANO_BANANA_PRO || hasFlash31Image || (hasProSegment && hasImageSegment);
};
