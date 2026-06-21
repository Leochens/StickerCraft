import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ExternalLink, Eye, EyeOff, Github, Globe, HelpCircle, KeyRound, RotateCcw } from 'lucide-react';
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
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const providerOptions = useMemo(() => ([
    { id: APIProvider.GEMINI, label: 'Gemini', shortLabel: 'Gemini' },
    { id: APIProvider.GPT, label: 'GPT', shortLabel: 'GPT' },
    { id: APIProvider.AGNES, label: 'Agnes', shortLabel: 'Agnes' },
  ]), []);

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
        agnes: 'Agnes AI',
        apiKey: 'API Key',
        endpoint: 'Endpoint',
        imageModel: '图片生成模型',
        helperModel: '文本模型',
        apiKeyPlaceholder: '输入当前 API 的 Key',
        endpointHint: '默认使用官方端点；仅在使用中转站时需要修改。',
        imageModelHint: '用于生成贴纸图片。',
        helperHint: '用于风格分析与提示词生成。',
        disclaimerTitle: 'API 接入说明',
        disclaimerDescription: '推荐优先使用官方 API。可用性、计费与服务条款以对应平台为准。',
        officialEndpoint: '默认端点',
        officialAction: '获取 API Key',
        helpTitle: '需要帮助？',
        helpToggleShow: '查看接入说明',
        helpToggleHide: '收起说明',
        proxyTitle: '无法使用官方 API？',
        proxyDescription: '可尝试使用 VAPI 等中转服务。',
        proxyAction: '了解 VAPI',
        customModel: '自定义…',
        configSection: '连接配置',
        modelsSection: '模型配置',
        showApiKey: '显示 API Key',
        hideApiKey: '隐藏 API Key',
        save: '保存',
        cancel: '取消',
        reset: '恢复默认',
        configured: '已配置',
        missing: '未配置',
      }
    : {
        settings: 'API Settings',
        provider: 'Active API',
        gemini: 'Gemini',
        gpt: 'GPT / OpenAI',
        agnes: 'Agnes AI',
        apiKey: 'API Key',
        endpoint: 'Endpoint',
        imageModel: 'Image generation model',
        helperModel: 'Text model',
        apiKeyPlaceholder: 'Enter the selected API key',
        endpointHint: 'Uses the official endpoint by default. Change this only for proxy services.',
        imageModelHint: 'Used for sticker image generation.',
        helperHint: 'Used for style analysis and prompt generation.',
        disclaimerTitle: 'API access note',
        disclaimerDescription: 'Prefer official APIs first. Availability, billing, and terms are controlled by each provider.',
        officialEndpoint: 'Default endpoint',
        officialAction: 'Get API Key',
        helpTitle: 'Need help?',
        helpToggleShow: 'Show setup guide',
        helpToggleHide: 'Hide setup guide',
        proxyTitle: 'Cannot use the official API?',
        proxyDescription: 'You can try a proxy service such as VAPI.',
        proxyAction: 'Learn about VAPI',
        customModel: 'Custom…',
        configSection: 'Connection',
        modelsSection: 'Models',
        showApiKey: 'Show API Key',
        hideApiKey: 'Hide API Key',
        save: 'Save',
        cancel: 'Cancel',
        reset: 'Reset',
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
  const officialApiOptions: Record<APIProvider, { name: string; endpoint: string; href: string }> = {
    [APIProvider.GEMINI]: {
      name: 'Gemini',
      endpoint: getProviderDefaultEndpoint(APIProvider.GEMINI),
      href: 'https://aistudio.google.com/app/apikey',
    },
    [APIProvider.GPT]: {
      name: 'OpenAI',
      endpoint: getProviderDefaultEndpoint(APIProvider.GPT),
      href: 'https://platform.openai.com/api-keys',
    },
    [APIProvider.AGNES]: {
      name: 'Agnes AI',
      endpoint: getProviderDefaultEndpoint(APIProvider.AGNES),
      href: 'https://platform.agnes-ai.com/settings/apiKeys',
    },
  };
  const activeOfficialOption = officialApiOptions[draft.activeProvider];

  const isCustomImageModel = !activeImageModels.some(model => model.value === activeDraft.imageModel);
  const isCustomTextModel = !activeTextModels.some(model => model.value === activeDraft.textModel);

  const iosSectionClass = 'px-4 mb-1.5 text-[13px] font-normal text-[rgba(60,60,67,0.6)]';
  const iosGroupClass = 'rounded-[10px] bg-white overflow-hidden';
  const iosRowClass = 'px-4 py-3 border-b border-[rgba(60,60,67,0.12)] last:border-b-0';
  const iosFootnoteClass = 'px-4 mt-2 text-[13px] leading-[18px] text-[rgba(60,60,67,0.6)]';
  const iosChipClass = (active: boolean) => (
    active
      ? 'bg-[#007AFF] text-white shadow-sm'
      : 'bg-[rgba(120,120,128,0.12)] text-[rgba(60,60,67,0.6)] active:opacity-70'
  );

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
              setIsApiKeyVisible(false);
              setIsSettingsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-[13px] font-medium border ${
              activeProviderConfigured
                ? 'bg-white/80 text-[#007AFF] border-[rgba(60,60,67,0.12)] hover:bg-white'
                : 'bg-[rgba(255,149,0,0.12)] text-[#FF9500] border-transparent hover:bg-[rgba(255,149,0,0.18)]'
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
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md px-0 sm:px-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="ios-sheet flex h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-[#F2F2F7] shadow-2xl animate-fade-in sm:h-[700px] sm:min-h-[700px] sm:max-h-[700px] sm:w-[520px] sm:min-w-[520px] sm:max-w-[520px] sm:rounded-[20px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1 sm:hidden flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-black/15" />
            </div>

            <div className="relative flex items-center justify-between px-4 h-11 flex-shrink-0 border-b border-[rgba(60,60,67,0.12)]">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="min-w-[52px] text-left text-[17px] text-[#007AFF] active:opacity-60"
              >
                {copy.cancel}
              </button>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <h2 className="text-[17px] font-semibold text-black leading-tight">{copy.settings}</h2>
                <p className={`text-[11px] leading-tight ${draftProviderConfigured ? 'text-[#34C759]' : 'text-[#FF9500]'}`}>
                  {activeProviderLabel} · {draftProviderConfigured ? copy.configured : copy.missing}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="min-w-[52px] text-right text-[17px] font-semibold text-[#007AFF] active:opacity-60"
              >
                {copy.save}
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-6">
              <section>
                <p className={iosSectionClass}>{copy.provider}</p>
                <div className="flex p-1 rounded-[9px] bg-[rgba(120,120,128,0.16)]">
                  {providerOptions.map((provider) => {
                    const isActive = draft.activeProvider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => setDraft(prev => ({ ...prev, activeProvider: provider.id }))}
                        className={`flex-1 rounded-[7px] py-1.5 text-[13px] font-medium transition-all active:scale-[0.98] ${
                          isActive
                            ? 'bg-white text-black shadow-sm'
                            : 'text-[rgba(60,60,67,0.6)]'
                        }`}
                      >
                        <span className="hidden sm:inline">{provider.label}</span>
                        <span className="sm:hidden">{provider.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <p className={iosSectionClass}>{copy.configSection}</p>
                <div className={iosGroupClass}>
                  <label className={`${iosRowClass} block`}>
                    <span className="text-[13px] text-[rgba(60,60,67,0.6)]">{copy.apiKey}</span>
                    <div className="relative mt-1">
                      <input
                        type={isApiKeyVisible ? 'text' : 'password'}
                        value={activeDraft.apiKey}
                        onChange={(event) => updateProviderDraft(draft.activeProvider, { apiKey: event.target.value })}
                        placeholder={copy.apiKeyPlaceholder}
                        className="ios-input w-full bg-transparent pr-10 text-[17px] text-black placeholder:text-[rgba(60,60,67,0.3)]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsApiKeyVisible(prev => !prev)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#007AFF] active:opacity-60"
                        aria-label={isApiKeyVisible ? copy.hideApiKey : copy.showApiKey}
                      >
                        {isApiKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                  <label className={`${iosRowClass} block`}>
                    <span className="text-[13px] text-[rgba(60,60,67,0.6)]">{copy.endpoint}</span>
                    <input
                      type="url"
                      value={activeDraft.endpoint}
                      onChange={(event) => updateProviderDraft(draft.activeProvider, { endpoint: event.target.value })}
                      placeholder={getProviderDefaultEndpoint(draft.activeProvider)}
                      className="ios-input mt-1 w-full bg-transparent text-[17px] text-black"
                    />
                  </label>
                </div>
                <p className={iosFootnoteClass}>{copy.endpointHint}</p>
              </section>

              <section>
                <p className={iosSectionClass}>{copy.modelsSection}</p>
                <div className={iosGroupClass}>
                  <div className={iosRowClass}>
                    <span className="mb-2.5 block text-[17px] text-black">{copy.imageModel}</span>
                    <div className="flex flex-wrap gap-2">
                      {activeImageModels.map((model) => (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => updateProviderDraft(draft.activeProvider, { imageModel: model.value })}
                          className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-all ${iosChipClass(activeDraft.imageModel === model.value)}`}
                        >
                          {model.value}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateProviderDraft(draft.activeProvider, {
                          imageModel: isCustomImageModel ? activeDraft.imageModel : '',
                        })}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-all ${iosChipClass(isCustomImageModel)}`}
                      >
                        {copy.customModel}
                      </button>
                    </div>
                    {isCustomImageModel && (
                      <input
                        type="text"
                        value={activeDraft.imageModel}
                        onChange={(event) => updateProviderDraft(draft.activeProvider, { imageModel: event.target.value })}
                        placeholder={getProviderDefaultImageModel(draft.activeProvider)}
                        className="ios-input mt-3 w-full rounded-[10px] bg-[#F2F2F7] px-3 py-2.5 text-[15px] text-black"
                      />
                    )}
                  </div>

                  <div className={iosRowClass}>
                    <span className="mb-2.5 block text-[17px] text-black">{copy.helperModel}</span>
                    <div className="flex flex-wrap gap-2">
                      {activeTextModels.map((model) => (
                        <button
                          key={model.value}
                          type="button"
                          onClick={() => updateProviderDraft(draft.activeProvider, { textModel: model.value })}
                          className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-all ${iosChipClass(activeDraft.textModel === model.value)}`}
                        >
                          {model.value}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateProviderDraft(draft.activeProvider, {
                          textModel: isCustomTextModel ? activeDraft.textModel : '',
                        })}
                        className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-all ${iosChipClass(isCustomTextModel)}`}
                      >
                        {copy.customModel}
                      </button>
                    </div>
                    {isCustomTextModel && (
                      <input
                        type="text"
                        value={activeDraft.textModel}
                        onChange={(event) => updateProviderDraft(draft.activeProvider, { textModel: event.target.value })}
                        placeholder={getProviderDefaultTextModel(draft.activeProvider)}
                        className="ios-input mt-3 w-full rounded-[10px] bg-[#F2F2F7] px-3 py-2.5 text-[15px] text-black"
                      />
                    )}
                  </div>
                </div>
                <p className={iosFootnoteClass}>{copy.imageModelHint} {copy.helperHint}</p>
              </section>

              <section>
                <div className={iosGroupClass}>
                  <button
                    type="button"
                    onClick={() => setShowHelp(prev => !prev)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-[rgba(120,120,128,0.08)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle size={18} className="text-[#007AFF]" />
                      <span className="text-[17px] text-black">{copy.helpTitle}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-[rgba(60,60,67,0.3)] transition-transform ${showHelp ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showHelp && (
                    <div className="border-t border-[rgba(60,60,67,0.12)] px-4 py-3 space-y-3">
                      <p className="text-[13px] leading-[18px] text-[rgba(60,60,67,0.6)]">{copy.disclaimerDescription}</p>

                      <div className="rounded-[10px] bg-[#F2F2F7] px-3 py-3">
                        <p className="text-[15px] font-medium text-black">{activeOfficialOption.name}</p>
                        <p className="mt-1 text-[13px] leading-[18px] text-[rgba(60,60,67,0.6)] break-all">
                          {activeOfficialOption.endpoint}
                        </p>
                        <a
                          href={activeOfficialOption.href}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[15px] text-[#007AFF] active:opacity-60"
                        >
                          {copy.officialAction}
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      <p className="text-[13px] leading-[18px] text-[rgba(60,60,67,0.6)]">
                        {copy.proxyDescription}{' '}
                        <a
                          href="https://api.gpt.ge/register?aff=qMCL"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#007AFF]"
                        >
                          {copy.proxyAction}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex-shrink-0 border-t border-[rgba(60,60,67,0.12)] bg-[#F2F2F7] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={handleResetSettings}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-[15px] text-[#FF3B30] active:opacity-60"
              >
                <RotateCcw size={15} />
                {copy.reset}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
