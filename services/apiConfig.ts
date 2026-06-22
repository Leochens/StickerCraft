import { GoogleGenAI } from "@google/genai";
import { APIProvider, APISettings, ModelType, ProviderAPISettings } from "../types";

export const API_SETTINGS_STORAGE_KEY = "stickerCraft_apiSettings";
export const LEGACY_GEMINI_SETTINGS_STORAGE_KEY = "stickerCraft_geminiSettings";

export const DEFAULT_GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/";
export const DEFAULT_GEMINI_IMAGE_MODEL = ModelType.NANO_BANANA_2;
export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-3-pro-preview";

export const DEFAULT_GPT_ENDPOINT = "https://api.openai.com/v1/";
export const DEFAULT_GPT_IMAGE_MODEL = "gpt-image-2";
export const DEFAULT_GPT_TEXT_MODEL = "gpt-5.4-mini";

export const DEFAULT_AGNES_ENDPOINT = "https://apihub.agnes-ai.com/v1/";
export const AGNES_PROXY_PREFIX = "/agnes-api";
export const AGNES_REMOTE_ORIGIN = "https://apihub.agnes-ai.com";
export const AGNES_ASSET_PROXY_PREFIX = "/agnes-asset-proxy";
export const DEFAULT_AGNES_IMAGE_MODEL = "agnes-image-2.1-flash";
export const DEFAULT_AGNES_TEXT_MODEL = "agnes-2.0-flash";

export const OFFICIAL_GEMINI_IMAGE_MODELS = [
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

export const OFFICIAL_GEMINI_TEXT_MODELS = [
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

export const OFFICIAL_GPT_IMAGE_MODELS = [
  {
    value: "gpt-image-2",
    label: "GPT Image 2",
    description: "OpenAI state-of-the-art image generation and editing model",
  },
  {
    value: "gpt-image-1.5",
    label: "GPT Image 1.5",
    description: "Previous GPT Image model",
  },
  {
    value: "gpt-image-1",
    label: "GPT Image 1",
    description: "Previous GPT Image model",
  },
  {
    value: "gpt-image-1-mini",
    label: "GPT Image 1 Mini",
    description: "Cost-efficient GPT Image model",
  },
];

export const OFFICIAL_GPT_TEXT_MODELS = [
  {
    value: "gpt-5.4-mini",
    label: "GPT-5.4 Mini",
  },
  {
    value: "gpt-5.4-nano",
    label: "GPT-5.4 Nano",
  },
  {
    value: "gpt-5.4",
    label: "GPT-5.4",
  },
  {
    value: "gpt-5.5",
    label: "GPT-5.5",
  },
];

export const OFFICIAL_AGNES_IMAGE_MODELS = [
  {
    value: "agnes-image-2.1-flash",
    label: "Agnes Image 2.1 Flash",
    description: "Recommended Agnes image model for text-to-image and image-to-image",
  },
  {
    value: "agnes-image-2.0-flash",
    label: "Agnes Image 2.0 Flash",
    description: "Previous Agnes image model with edit-heavy workflows",
  },
];

export const OFFICIAL_AGNES_TEXT_MODELS = [
  {
    value: "agnes-2.0-flash",
    label: "Agnes 2.0 Flash",
  },
];

export const OFFICIAL_IMAGE_MODELS = OFFICIAL_GEMINI_IMAGE_MODELS;
export const OFFICIAL_TEXT_MODELS = OFFICIAL_GEMINI_TEXT_MODELS;

const getEnvValue = (key: string): string => {
  if (typeof process === "undefined" || !process.env) return "";
  return process.env[key] || "";
};

const getEnvGeminiApiKey = (): string => getEnvValue("GEMINI_API_KEY") || getEnvValue("API_KEY");
const getEnvOpenAIApiKey = (): string => getEnvValue("OPENAI_API_KEY");
const getEnvAgnesApiKey = (): string => getEnvValue("AGNES_API_KEY");

export const getDefaultGeminiSettings = (): ProviderAPISettings => ({
  apiKey: getEnvGeminiApiKey(),
  endpoint: DEFAULT_GEMINI_ENDPOINT,
  imageModel: DEFAULT_GEMINI_IMAGE_MODEL,
  textModel: DEFAULT_GEMINI_TEXT_MODEL,
});

export const getDefaultGPTSettings = (): ProviderAPISettings => ({
  apiKey: getEnvOpenAIApiKey(),
  endpoint: DEFAULT_GPT_ENDPOINT,
  imageModel: DEFAULT_GPT_IMAGE_MODEL,
  textModel: DEFAULT_GPT_TEXT_MODEL,
});

export const getDefaultAgnesSettings = (): ProviderAPISettings => ({
  apiKey: getEnvAgnesApiKey(),
  endpoint: DEFAULT_AGNES_ENDPOINT,
  imageModel: DEFAULT_AGNES_IMAGE_MODEL,
  textModel: DEFAULT_AGNES_TEXT_MODEL,
});

export const getDefaultAPISettings = (): APISettings => ({
  activeProvider: APIProvider.GEMINI,
  gemini: getDefaultGeminiSettings(),
  gpt: getDefaultGPTSettings(),
  agnes: getDefaultAgnesSettings(),
});

type RawAPISettings = Partial<Omit<APISettings, "gemini" | "gpt" | "agnes">> & {
  gemini?: Partial<ProviderAPISettings>;
  gpt?: Partial<ProviderAPISettings>;
  agnes?: Partial<ProviderAPISettings>;
};

const isAPIProvider = (value: unknown): value is APIProvider => (
  value === APIProvider.GEMINI || value === APIProvider.GPT || value === APIProvider.AGNES
);

const normalizeEndpoint = (endpoint: string | undefined, fallback: string): string => {
  const normalized = endpoint?.trim() || fallback;
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
};

const normalizeProviderSettings = (
  raw: Partial<ProviderAPISettings> | undefined,
  defaults: ProviderAPISettings,
): ProviderAPISettings => ({
  apiKey: typeof raw?.apiKey === "string" ? raw.apiKey.trim() : defaults.apiKey,
  endpoint: normalizeEndpoint(typeof raw?.endpoint === "string" ? raw.endpoint : undefined, defaults.endpoint),
  imageModel: typeof raw?.imageModel === "string" && raw.imageModel.trim()
    ? raw.imageModel.trim()
    : defaults.imageModel,
  textModel: typeof raw?.textModel === "string" && raw.textModel.trim()
    ? raw.textModel.trim()
    : defaults.textModel,
});

export const normalizeAPISettings = (raw: RawAPISettings | undefined): APISettings => {
  const defaults = getDefaultAPISettings();

  return {
    activeProvider: isAPIProvider(raw?.activeProvider) ? raw.activeProvider : defaults.activeProvider,
    gemini: normalizeProviderSettings(raw?.gemini, defaults.gemini),
    gpt: normalizeProviderSettings(raw?.gpt, defaults.gpt),
    agnes: normalizeProviderSettings(raw?.agnes, defaults.agnes),
  };
};

const readLegacyGeminiSettings = (): Partial<ProviderAPISettings> | undefined => {
  if (typeof localStorage === "undefined") return undefined;

  try {
    const saved = localStorage.getItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
    if (!saved) return undefined;
    return JSON.parse(saved) as Partial<ProviderAPISettings>;
  } catch (error) {
    console.warn("Failed to load legacy Gemini settings.", error);
    return undefined;
  }
};

export const loadAPISettings = (): APISettings => {
  const defaults = getDefaultAPISettings();

  if (typeof localStorage === "undefined") {
    return defaults;
  }

  try {
    const saved = localStorage.getItem(API_SETTINGS_STORAGE_KEY);
    if (saved) {
      return normalizeAPISettings(JSON.parse(saved) as Partial<APISettings>);
    }

    const legacyGeminiSettings = readLegacyGeminiSettings();
    if (legacyGeminiSettings) {
      const migrated = normalizeAPISettings({
        activeProvider: APIProvider.GEMINI,
        gemini: legacyGeminiSettings,
      });
      localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
      return migrated;
    }

    return defaults;
  } catch (error) {
    console.warn("Failed to load API settings, using defaults.", error);
    return defaults;
  }
};

export const saveAPISettings = (settings: APISettings) => {
  const normalized = normalizeAPISettings(settings);

  localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  localStorage.removeItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("stickerCraft:api-settings-updated", {
    detail: normalized,
  }));
};

export const resetAPISettings = () => {
  localStorage.removeItem(API_SETTINGS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
  const defaults = getDefaultAPISettings();
  window.dispatchEvent(new CustomEvent("stickerCraft:api-settings-updated", {
    detail: defaults,
  }));
  return defaults;
};

export const getActiveProviderSettings = (
  settings: APISettings = loadAPISettings(),
): ProviderAPISettings => settings[settings.activeProvider];

export const isProviderConfigured = (providerSettings: ProviderAPISettings): boolean => (
  Boolean(
    providerSettings.apiKey.trim() &&
    providerSettings.imageModel.trim() &&
    providerSettings.textModel.trim(),
  )
);

export const getProviderLabel = (provider: APIProvider) => {
  if (provider === APIProvider.GPT) return "GPT / OpenAI";
  if (provider === APIProvider.AGNES) return "Agnes AI";
  return "Gemini";
};

export const getProviderImageModels = (provider: APIProvider) => {
  if (provider === APIProvider.GPT) return OFFICIAL_GPT_IMAGE_MODELS;
  if (provider === APIProvider.AGNES) return OFFICIAL_AGNES_IMAGE_MODELS;
  return OFFICIAL_GEMINI_IMAGE_MODELS;
};

export const getProviderTextModels = (provider: APIProvider) => {
  if (provider === APIProvider.GPT) return OFFICIAL_GPT_TEXT_MODELS;
  if (provider === APIProvider.AGNES) return OFFICIAL_AGNES_TEXT_MODELS;
  return OFFICIAL_GEMINI_TEXT_MODELS;
};

export const getProviderDefaultImageModel = (provider: APIProvider) => {
  if (provider === APIProvider.GPT) return DEFAULT_GPT_IMAGE_MODEL;
  if (provider === APIProvider.AGNES) return DEFAULT_AGNES_IMAGE_MODEL;
  return DEFAULT_GEMINI_IMAGE_MODEL;
};

export const getProviderDefaultTextModel = (provider: APIProvider) => {
  if (provider === APIProvider.GPT) return DEFAULT_GPT_TEXT_MODEL;
  if (provider === APIProvider.AGNES) return DEFAULT_AGNES_TEXT_MODEL;
  return DEFAULT_GEMINI_TEXT_MODEL;
};

export const getProviderDefaultEndpoint = (provider: APIProvider) => {
  if (provider === APIProvider.GPT) return DEFAULT_GPT_ENDPOINT;
  if (provider === APIProvider.AGNES) return DEFAULT_AGNES_ENDPOINT;
  return DEFAULT_GEMINI_ENDPOINT;
};

export const usesOpenAIImageAPI = (provider: APIProvider): boolean => (
  provider === APIProvider.GPT || provider === APIProvider.AGNES
);

export const usesChatCompletionsAPI = (provider: APIProvider): boolean => (
  provider === APIProvider.AGNES
);

const parseGeminiEndpoint = (endpoint: string) => {
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

export const createGeminiClient = (providerSettings = loadAPISettings().gemini) => {
  if (!providerSettings.apiKey.trim()) {
    throw new Error("Please configure a Gemini API Key before generating stickers.");
  }

  const endpoint = parseGeminiEndpoint(providerSettings.endpoint);

  return new GoogleGenAI({
    apiKey: providerSettings.apiKey.trim(),
    httpOptions: {
      baseUrl: endpoint.baseUrl,
      apiVersion: endpoint.apiVersion,
    },
  });
};

export const getOpenAIEndpointUrl = (providerSettings: ProviderAPISettings, path: string): string => {
  let base = providerSettings.endpoint.trim() || DEFAULT_GPT_ENDPOINT;

  if (import.meta.env.DEV && base.includes(AGNES_REMOTE_ORIGIN)) {
    base = base.replace(AGNES_REMOTE_ORIGIN, AGNES_PROXY_PREFIX);
  }

  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const resolvedBase = normalizedBase.startsWith("/") && typeof window !== "undefined"
    ? new URL(normalizedBase, window.location.origin).toString()
    : normalizedBase;

  return new URL(path.replace(/^\/+/, ""), resolvedBase).toString();
};

export const resolveAgnesAssetUrl = (url: string): string => {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return url;
  }

  try {
    const parsed = new URL(url);
    const isAgnesAssetHost = parsed.hostname.endsWith("agnes-ai.com")
      || parsed.hostname.endsWith("agnes-ai.space");

    if (isAgnesAssetHost) {
      return `${AGNES_ASSET_PROXY_PREFIX}/${parsed.hostname}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }

  return url;
};

export const modelSupportsImageSize = (model: string): boolean => {
  const normalized = model.toLowerCase();
  const isGPTImageModel = normalized.startsWith("gpt-image-");
  const hasProSegment = /(^|[-_.])pro([-_.]|$)/.test(normalized);
  const hasImageSegment = /(^|[-_.])image([-_.]|$)/.test(normalized);
  const hasFlash31Image = normalized.includes("3.1-flash-image");
  return isGPTImageModel || model === ModelType.NANO_BANANA_PRO || hasFlash31Image || (hasProSegment && hasImageSegment);
};
