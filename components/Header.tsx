import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ExternalLink, Github, Globe, Settings2, KeyRound, RotateCcw, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGE_OPTIONS } from '../constants';
import {
  getActiveProviderSettings,
  getProviderDefaultEndpoint,
  getProviderDefaultImageModel,
  getProviderDefaultTextModel,
  getProviderImageModels,
  getProviderLabel,
  getProviderTextModels,
  isProviderConfigured,
  loadAPISettings,
  resetAPISettings,
  saveAPISettings,
} from '../services/apiConfig';
import { APIProvider, APISettings, Language, ProviderAPISettings } from '../types';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [settings, setSettings] = useState<APISettings>(() => loadAPISettings());
  const [draft, setDraft] = useState<APISettings>(() => loadAPISettings());

  useEffect(() => {
    const handleSettingsUpdated = () => {
      const next = loadAPISettings();
      setSettings(next);
      setDraft(next);
    };

    window.addEventListener('stickerCraft:api-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('stickerCraft:api-settings-updated', handleSettingsUpdated);
  }, []);

  const selectedLanguage = LANGUAGE_OPTIONS.find(option => option.code === language) || LANGUAGE_OPTIONS[0];
  const badgeLanguage = language === 'zh' ? 'zh' : 'en';

  const copy = language === 'zh'
    ? {
        settings: 'API 配置',
        provider: '当前 API',
        gemini: 'Gemini',
        gpt: 'GPT / OpenAI',
        apiKey: 'API Key',
        endpoint: 'Endpoint',
        imageModel: '图片生成模型',
        helperModel: '文本模型',
        apiKeyPlaceholder: '输入当前 API 的 Key',
        endpointHint: 'Gemini 默认使用 Google 官方端点；GPT 默认使用 OpenAI /v1 端点。只有使用中转站时才需要修改。',
        imageModelHint: '当前 API 必须配置一个图片生成模型。GPT 推荐 gpt-image-2，Gemini 推荐 Nano Banana 2。',
        helperHint: '用于风格分析和提示词生成。当前 API 必须配置一个文本模型。',
        disclaimerTitle: 'API 接入免责声明',
        disclaimerDescription: '推荐优先使用 Gemini / OpenAI 官方 API 接入。官方 API 的可用性、计费和服务条款以对应官方平台为准。',
        officialEndpoint: '接入地址',
        officialAction: '打开官方入口',
        proxyTitle: '仍然无法使用官方 API？',
        proxyDescription: '如果因为地区、网络或账号限制无法使用官方 API，再考虑使用 VAPI 来做中转。',
        proxyAction: '打开 VAPI',
        save: '保存配置',
        reset: '恢复默认',
        configured: '已配置',
        missing: '未配置',
      }
    : {
        settings: 'API Settings',
        provider: 'Active API',
        gemini: 'Gemini',
        gpt: 'GPT / OpenAI',
        apiKey: 'API Key',
        endpoint: 'Endpoint',
        imageModel: 'Image generation model',
        helperModel: 'Text model',
        apiKeyPlaceholder: 'Enter the selected API key',
        endpointHint: 'Gemini uses the official Google endpoint by default. GPT uses the OpenAI /v1 endpoint by default. Change this only for proxy services.',
        imageModelHint: 'The selected API must have an image model. Prefer gpt-image-2 for GPT and Nano Banana 2 for Gemini.',
        helperHint: 'Used for style analysis and prompt generation. The selected API must have a text model.',
        disclaimerTitle: 'API access disclaimer',
        disclaimerDescription: 'Prefer the official Gemini / OpenAI APIs first. Availability, billing, and terms are controlled by the official provider.',
        officialEndpoint: 'Endpoint',
        officialAction: 'Open official page',
        proxyTitle: 'Still cannot use the official API?',
        proxyDescription: 'If region, network, or account limits block official API access, you can consider VAPI as a proxy service.',
        proxyAction: 'Open VAPI',
        save: 'Save settings',
        reset: 'Reset defaults',
        configured: 'Configured',
        missing: 'Missing',
      };

  const activeSettings = getActiveProviderSettings(settings);
  const activeDraft = draft[draft.activeProvider];
  const activeProviderConfigured = isProviderConfigured(activeSettings);
  const draftProviderConfigured = isProviderConfigured(activeDraft);
  const activeProviderLabel = getProviderLabel(draft.activeProvider);
  const activeImageModels = getProviderImageModels(draft.activeProvider);
  const activeTextModels = getProviderTextModels(draft.activeProvider);
  const officialApiOptions = [
    {
      name: 'Gemini',
      endpoint: getProviderDefaultEndpoint(APIProvider.GEMINI),
      href: 'https://aistudio.google.com/app/apikey',
    },
    {
      name: 'OpenAI',
      endpoint: getProviderDefaultEndpoint(APIProvider.GPT),
      href: 'https://platform.openai.com/api-keys',
    },
  ];

  const updateProviderDraft = (provider: APIProvider, nextProviderSettings: Partial<ProviderAPISettings>) => {
    setDraft(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        ...nextProviderSettings,
      },
    }));
  };

  const handleSaveSettings = () => {
    saveAPISettings(draft);
    setSettings(loadAPISettings());
    setIsSettingsOpen(false);
  };

  const handleResetSettings = () => {
    const defaults = resetAPISettings();
    setSettings(defaults);
    setDraft(defaults);
  };

  return (
    <header className="bg-white border-b border-orange-100 py-3 sticky top-0 z-30 shadow-sm flex-shrink-0">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.svg"
            alt="StickerCraft logo"
            className="h-10 w-10 rounded-xl shadow-lg shadow-orange-200 transform -rotate-3"
          />
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight leading-none">
              Sticker<span className="text-orange-500">{t('title_suffix')}</span>
            </h1>
            <a
              href="https://world.guantou.site/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit GuanTou Lab portfolio"
              className="hidden md:inline-flex h-8 w-[136px] flex-shrink-0 items-center"
            >
              <img
                src={`https://world.guantou.site/badge.svg?theme=light&accent=red&lang=${badgeLanguage}&size=sm`}
                alt="GuanTou Lab"
                width={136}
                height={32}
                className="h-8 w-[136px]"
              />
            </a>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = loadAPISettings();
              setDraft(next);
              setIsSettingsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-bold border ${
              activeProviderConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
            }`}
          >
            <KeyRound size={14} />
            <span className="hidden sm:inline">{copy.settings}</span>
            <span className="sm:hidden">{activeProviderConfigured ? copy.configured : copy.missing}</span>
          </button>

           {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-stone-500 hover:bg-orange-50 hover:text-orange-600 transition-colors text-xs font-bold border border-transparent hover:border-orange-100"
            >
              <Globe size={14} />
              <span>{selectedLanguage.label}</span>
              <ChevronDown size={12} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-stone-200 bg-white shadow-xl overflow-hidden z-40 animate-fade-in">
                {LANGUAGE_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      setLanguage(option.code as Language);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 flex items-center justify-between text-left text-xs font-bold transition-colors ${
                      language === option.code
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>{option.label}</span>
                    {language === option.code && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href="https://github.com/Leochens/StickerCraft"
            target="_blank"
            rel="noreferrer"
            aria-label="Open StickerCraft on GitHub"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-500 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-transparent hover:border-orange-100"
          >
            <Github size={16} />
          </a>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-sm px-4 py-4 sm:py-8" onClick={() => setIsSettingsOpen(false)}>
          <div
            className="w-full max-w-lg max-h-[calc(100vh-2rem)] rounded-2xl bg-white shadow-2xl border border-orange-100 overflow-hidden animate-fade-in flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-orange-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Settings2 size={18} />
                </div>
                <div>
                  <h2 className="font-black text-stone-900">{copy.settings}</h2>
                  <p className="text-xs text-stone-400">
                    {activeProviderLabel} · {draftProviderConfigured ? copy.configured : copy.missing}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-black text-sky-900">{copy.disclaimerTitle}</p>
                  <p className="text-xs text-sky-700 leading-relaxed">{copy.disclaimerDescription}</p>
                </div>
                <div className="space-y-2">
                  {officialApiOptions.map((option) => (
                    <div key={option.name} className="border-t border-sky-100 pt-2 first:border-t-0 first:pt-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-black text-sky-900">{option.name}</p>
                          <p className="text-[11px] font-bold text-sky-700 break-all">
                            {copy.officialEndpoint}: {option.endpoint}
                          </p>
                        </div>
                        <a
                          href={option.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-black text-sky-700 border border-sky-100 shadow-sm hover:bg-sky-100 hover:text-sky-900 transition-colors"
                        >
                          {copy.officialAction}
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-emerald-900">{copy.proxyTitle}</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">{copy.proxyDescription}</p>
                  </div>
                  <a
                    href="https://api.gpt.ge/register?aff=qMCL"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-700 border border-emerald-100 shadow-sm hover:bg-emerald-100 hover:text-emerald-900 transition-colors"
                  >
                    {copy.proxyAction}
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.provider}</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
                  {[APIProvider.GEMINI, APIProvider.GPT].map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setDraft(prev => ({ ...prev, activeProvider: provider }))}
                      className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${
                        draft.activeProvider === provider
                          ? 'bg-white text-orange-700 shadow-sm'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {provider === APIProvider.GPT ? copy.gpt : copy.gemini}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{activeProviderLabel} {copy.apiKey}</span>
                <input
                  type="password"
                  value={activeDraft.apiKey}
                  onChange={(event) => updateProviderDraft(draft.activeProvider, { apiKey: event.target.value })}
                  placeholder={copy.apiKeyPlaceholder}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.endpoint}</span>
                <input
                  type="url"
                  value={activeDraft.endpoint}
                  onChange={(event) => updateProviderDraft(draft.activeProvider, { endpoint: event.target.value })}
                  placeholder={getProviderDefaultEndpoint(draft.activeProvider)}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
                <p className="text-xs text-stone-500 leading-relaxed">{copy.endpointHint}</p>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.imageModel}</span>
                <input
                  type="text"
                  value={activeDraft.imageModel}
                  onChange={(event) => updateProviderDraft(draft.activeProvider, { imageModel: event.target.value })}
                  placeholder={getProviderDefaultImageModel(draft.activeProvider)}
                  list="api-image-models"
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
                <datalist id="api-image-models">
                  {activeImageModels.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </datalist>
                <p className="text-xs text-stone-500 leading-relaxed">{copy.imageModelHint}</p>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.helperModel}</span>
                <input
                  type="text"
                  value={activeDraft.textModel}
                  onChange={(event) => updateProviderDraft(draft.activeProvider, { textModel: event.target.value })}
                  placeholder={getProviderDefaultTextModel(draft.activeProvider)}
                  list="api-helper-models"
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
                <datalist id="api-helper-models">
                  {activeTextModels.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </datalist>
                <p className="text-xs text-stone-500 leading-relaxed">{copy.helperHint}</p>
              </label>

              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 space-y-2">
                <p className="text-xs font-black text-orange-800">
                  {language === 'zh' ? `${activeProviderLabel} 模型建议` : `${activeProviderLabel} model suggestions`}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeImageModels.map((model) => (
                    <span key={model.value} className="px-2 py-1 rounded-lg bg-white border border-orange-100 text-[11px] font-bold text-orange-700">
                      {model.value}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-orange-700 leading-relaxed">{copy.imageModelHint}</p>
              </div>
            </div>

            <div className="p-5 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row gap-2 sm:justify-between flex-shrink-0">
              <button
                type="button"
                onClick={handleResetSettings}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 font-bold text-xs"
              >
                <RotateCcw size={14} />
                {copy.reset}
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-xs shadow-lg shadow-orange-200 hover:to-rose-600"
              >
                {copy.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
