import {
  APIProvider,
  APISettings,
  API_SETTINGS_STORAGE_KEY,
  LEGACY_GEMINI_SETTINGS_STORAGE_KEY,
  ProviderAPISettings,
  configureAPISettingsResolver,
  getDefaultAPISettings,
  normalizeAPISettings,
} from '@stickercraft/core';

const readLegacyGeminiSettings = (): Partial<ProviderAPISettings> | undefined => {
  if (typeof localStorage === 'undefined') return undefined;

  try {
    const saved = localStorage.getItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
    if (!saved) return undefined;
    return JSON.parse(saved) as Partial<ProviderAPISettings>;
  } catch (error) {
    console.warn('Failed to load legacy Gemini settings.', error);
    return undefined;
  }
};

export const loadAPISettings = (): APISettings => {
  const defaults = getDefaultAPISettings();

  if (typeof localStorage === 'undefined') {
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
    console.warn('Failed to load API settings, using defaults.', error);
    return defaults;
  }
};

export const saveAPISettings = (settings: APISettings) => {
  const normalized = normalizeAPISettings(settings);

  localStorage.setItem(API_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
  localStorage.removeItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('stickerCraft:api-settings-updated', {
    detail: normalized,
  }));
};

export const resetAPISettings = () => {
  localStorage.removeItem(API_SETTINGS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_GEMINI_SETTINGS_STORAGE_KEY);
  const defaults = getDefaultAPISettings();
  window.dispatchEvent(new CustomEvent('stickerCraft:api-settings-updated', {
    detail: defaults,
  }));
  return defaults;
};

configureAPISettingsResolver(loadAPISettings);
