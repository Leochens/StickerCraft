const TRACKING_ORIGIN = 'https://sticker.guantou.site';

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsPayload = Record<string, AnalyticsValue>;

export type AnalyticsEventName =
  | 'api_settings_reset'
  | 'api_settings_saved'
  | 'bead_pattern_exported'
  | 'bead_pattern_opened'
  | 'custom_style_created'
  | 'custom_style_failed'
  | 'language_changed'
  | 'prompt_preset_used'
  | 'prompt_suggestions_generated'
  | 'prompt_suggestions_used'
  | 'reference_image_added'
  | 'sticker_batch_deleted'
  | 'sticker_batch_downloaded'
  | 'sticker_collection_item_deleted'
  | 'sticker_collection_item_downloaded'
  | 'sticker_collection_items_downloaded'
  | 'sticker_collection_opened'
  | 'sticker_collection_split_failed'
  | 'sticker_collection_split_started'
  | 'sticker_collection_split_succeeded'
  | 'sticker_deleted'
  | 'sticker_downloaded'
  | 'sticker_generate_failed'
  | 'sticker_generate_started'
  | 'sticker_generate_succeeded'
  | 'sticker_preview_opened'
  | 'sticker_recrop_failed'
  | 'sticker_recrop_started'
  | 'sticker_recrop_succeeded'
  | 'sticker_regenerate_failed'
  | 'sticker_regenerate_started'
  | 'sticker_regenerate_succeeded'
  | 'sticker_transparency_repair_failed'
  | 'sticker_transparency_repair_started'
  | 'sticker_transparency_repair_succeeded'
  | 'sticker_uploaded';

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number | boolean | null>) => void;
    };
  }
}

const cleanPayload = (payload: AnalyticsPayload = {}) => {
  return Object.fromEntries(
    Object.entries(payload).filter((entry): entry is [string, string | number | boolean | null] => (
      entry[1] !== undefined
    )),
  );
};

export const trackEvent = (eventName: AnalyticsEventName, payload?: AnalyticsPayload) => {
  if (typeof window === 'undefined') return;
  if (window.location.origin !== TRACKING_ORIGIN) return;

  window.umami?.track(eventName, cleanPayload(payload));
};
