import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Github, Globe, Settings2, KeyRound, RotateCcw, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGE_OPTIONS } from '../constants';
import { DEFAULT_GEMINI_ENDPOINT, DEFAULT_GEMINI_IMAGE_MODEL, DEFAULT_GEMINI_TEXT_MODEL, OFFICIAL_IMAGE_MODELS, OFFICIAL_TEXT_MODELS, loadGeminiSettings, resetGeminiSettings, saveGeminiSettings } from '../services/geminiConfig';
import { GeminiSettings, Language } from '../types';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [settings, setSettings] = useState<GeminiSettings>(() => loadGeminiSettings());
  const [draft, setDraft] = useState<GeminiSettings>(() => loadGeminiSettings());

  useEffect(() => {
    const handleSettingsUpdated = () => {
      const next = loadGeminiSettings();
      setSettings(next);
      setDraft(next);
    };

    window.addEventListener('stickerCraft:gemini-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('stickerCraft:gemini-settings-updated', handleSettingsUpdated);
  }, []);

  const selectedLanguage = LANGUAGE_OPTIONS.find(option => option.code === language) || LANGUAGE_OPTIONS[0];
  const badgeLanguage = language === 'zh' ? 'zh' : 'en';

  const copy = language === 'zh'
    ? {
        settings: 'Gemini 配置',
        apiKey: 'API Key',
        endpoint: 'Endpoint',
        imageModel: '图片生成模型',
        helperModel: '文本模型',
        apiKeyPlaceholder: '输入你的 Gemini API Key',
        endpointHint: '官方端点建议使用 https://generativelanguage.googleapis.com/；只有在使用 Gemini 兼容中转站时才需要修改。',
        imageModelHint: '图片生成优先建议 Nano Banana 2：gemini-3.1-flash-image-preview。需要专业资产或 4K 时可用 Nano Banana Pro。',
        helperHint: '用于风格分析和提示词生成。官方文本模型可使用 Gemini 3 Pro：gemini-3-pro-preview；中转站可填写自己的文本模型名。',
        save: '保存配置',
        reset: '恢复官方默认',
        configured: '已配置',
        missing: '未配置',
      }
    : {
        settings: 'Gemini Settings',
        apiKey: 'API Key',
        endpoint: 'Endpoint',
        imageModel: 'Image generation model',
        helperModel: 'Text model',
        apiKeyPlaceholder: 'Enter your Gemini API Key',
        endpointHint: 'Official endpoint recommendation: https://generativelanguage.googleapis.com/. Change it only for Gemini-compatible proxies.',
        imageModelHint: 'Prefer Nano Banana 2 for image generation: gemini-3.1-flash-image-preview. Use Nano Banana Pro for professional assets or 4K output.',
        helperHint: 'Used for style analysis and prompt generation. Gemini 3 Pro is supported: gemini-3-pro-preview. Proxy users can enter a custom text model.',
        save: 'Save settings',
        reset: 'Reset official defaults',
        configured: 'Configured',
        missing: 'Missing',
      };

  const handleSaveSettings = () => {
    saveGeminiSettings(draft);
    setSettings(loadGeminiSettings());
    setIsSettingsOpen(false);
  };

  const handleResetSettings = () => {
    const defaults = resetGeminiSettings();
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
              className="hidden xl:inline-flex h-11 min-w-[230px] items-center"
            >
              <img
                src={`https://world.guantou.site/badge.svg?theme=light&accent=red&lang=${badgeLanguage}&size=lg`}
                alt="GuanTou Lab"
                className="h-11 w-auto"
              />
            </a>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = loadGeminiSettings();
              setDraft(next);
              setIsSettingsOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs font-bold border ${
              settings.apiKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
            }`}
          >
            <KeyRound size={14} />
            <span className="hidden sm:inline">{copy.settings}</span>
            <span className="sm:hidden">{settings.apiKey ? copy.configured : copy.missing}</span>
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
                  <p className="text-xs text-stone-400">{settings.apiKey ? copy.configured : copy.missing}</p>
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
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.apiKey}</span>
                <input
                  type="password"
                  value={draft.apiKey}
                  onChange={(event) => setDraft(prev => ({ ...prev, apiKey: event.target.value }))}
                  placeholder={copy.apiKeyPlaceholder}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.endpoint}</span>
                <input
                  type="url"
                  value={draft.endpoint}
                  onChange={(event) => setDraft(prev => ({ ...prev, endpoint: event.target.value }))}
                  placeholder={DEFAULT_GEMINI_ENDPOINT}
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
                <p className="text-xs text-stone-500 leading-relaxed">{copy.endpointHint}</p>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.imageModel}</span>
                <input
                  type="text"
                  value={draft.imageModel}
                  onChange={(event) => setDraft(prev => ({ ...prev, imageModel: event.target.value }))}
                  placeholder={DEFAULT_GEMINI_IMAGE_MODEL}
                  list="gemini-image-models"
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
                <datalist id="gemini-image-models">
                  {OFFICIAL_IMAGE_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </datalist>
                <p className="text-xs text-stone-500 leading-relaxed">{copy.imageModelHint}</p>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">{copy.helperModel}</span>
                <input
                  type="text"
                  value={draft.textModel}
                  onChange={(event) => setDraft(prev => ({ ...prev, textModel: event.target.value }))}
                  placeholder={DEFAULT_GEMINI_TEXT_MODEL}
                  list="gemini-helper-models"
                  className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-sm font-bold text-stone-800 focus:border-orange-400 focus:bg-white outline-none"
                />
                <datalist id="gemini-helper-models">
                  {OFFICIAL_TEXT_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </datalist>
                <p className="text-xs text-stone-500 leading-relaxed">{copy.helperHint}</p>
              </label>

              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 space-y-2">
                <p className="text-xs font-black text-orange-800">{language === 'zh' ? '官方图片模型建议' : 'Official image model suggestions'}</p>
                <div className="flex flex-wrap gap-2">
                  {OFFICIAL_IMAGE_MODELS.map((model) => (
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
