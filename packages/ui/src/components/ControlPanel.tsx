
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { APIProvider, AspectRatio, ImageResolution, StickerRequest, StickerStyle } from '@stickercraft/core';
import { STICKER_STYLES, ASPECT_RATIOS, RESOLUTIONS, AVAILABLE_FONTS, BACKGROUND_COLORS, PRESET_PROMPTS } from '@stickercraft/core';
import { Wand2, Layers, Monitor, Sliders, Check, Plus, Upload, Trash2, ImagePlus, Info, Type, Palette as PaletteIcon, Sparkles, Box, LayoutPanelLeft, Sticker, ChevronDown, Smile, ChevronUp, Save, X, Lightbulb, ListPlus } from 'lucide-react';
import { analyzeStyleFromImage, generateCollectionItemPrompts, generateRelatedPrompts } from '@stickercraft/core';
import { useLanguage } from '../contexts/LanguageContext';
import { getActiveProviderSettings, getProviderDefaultImageModel, getProviderImageModels, getProviderLabel, modelSupportsImageSize } from '@stickercraft/core';
import { loadAPISettings } from '../services/apiSettingsStorage';
import CollapsibleSection from './CollapsibleSection';
import SegmentedControl from './ui/SegmentedControl';
import CustomSelect from './ui/CustomSelect';
import Chip from './ui/Chip';
import ChipGroup from './ui/ChipGroup';
import StylePickerPanel from './ui/StylePickerPanel';
import { getStylePreviewImage } from '../utils/stylePreview';
import { FOCUS_RING_CLASS } from '../utils/uiClasses';
import { trackEvent } from '../services/analytics';

interface ControlPanelProps {
  onGenerate: (requests: StickerRequest[]) => void;
  isGenerating: boolean;
  customStyles: StickerStyle[];
  onAddCustomStyle: (style: StickerStyle) => void;
  onRemoveCustomStyle: (id: string) => void;
}

type LayoutMode = 'single' | 'threeViews' | 'collection';

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  isGenerating,
  customStyles,
  onAddCustomStyle,
  onRemoveCustomStyle
}) => {
  const { t, language } = useLanguage();
  const getConfiguredImageModelState = () => {
    const apiSettings = loadAPISettings();
    const configuredImageModel = getActiveProviderSettings(apiSettings).imageModel;
    const providerImageModels = getProviderImageModels(apiSettings.activeProvider);

    return {
      provider: apiSettings.activeProvider,
      model: providerImageModels.some(option => option.value === configuredImageModel)
        ? configuredImageModel
        : 'custom',
      customModel: providerImageModels.some(option => option.value === configuredImageModel)
        ? ''
        : configuredImageModel,
    };
  };
  const initialModelState = getConfiguredImageModelState();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STICKER_STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState(AspectRatio.SQUARE);
  const [activeProvider, setActiveProvider] = useState<APIProvider>(initialModelState.provider);
  const [model, setModel] = useState<string>(initialModelState.model);
  const [customModel, setCustomModel] = useState(initialModelState.customModel);
  const [resolution, setResolution] = useState(ImageResolution.RES_1K);
  
  // Advanced Config
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [stickerCollectionCount, setStickerCollectionCount] = useState(6);
  const [collectionItemPrompts, setCollectionItemPrompts] = useState<string[]>(Array.from({ length: 6 }, () => ''));
  const [isGeneratingCollectionItems, setIsGeneratingCollectionItems] = useState(false);
  const [useStickerBorder, setUseStickerBorder] = useState(true);
  const [useFacialFeatures, setUseFacialFeatures] = useState(true);

  // Text Config
  const [textEnabled, setTextEnabled] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [selectedFont, setSelectedFont] = useState(AVAILABLE_FONTS[0].name);
  const [textBorder, setTextBorder] = useState(true);

  // Background Config
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('white');

  // Generation Reference Image
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const styleDropdownTriggerRef = useRef<HTMLButtonElement>(null);

  // UI State
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isCreatingStyle, setIsCreatingStyle] = useState(false);
  const [isPromptGeneratorOpen, setIsPromptGeneratorOpen] = useState(false);

  // Style Creation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newStyleText, setNewStyleText] = useState('');
  const [newStyleImageFile, setNewStyleImageFile] = useState<File | null>(null);
  const [newStyleImagePreview, setNewStyleImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prompt Generator State
  const [promptCategory, setPromptCategory] = useState('');
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);

  const allStyles = [...STICKER_STYLES, ...customStyles];
  const activeStyle = allStyles.find(s => s.id === selectedStyle);
  const isCustomModel = model === 'custom';
  const activeModel = isCustomModel ? customModel.trim() : model;
  const activeModelSupportsImageSize = modelSupportsImageSize(activeModel);
  const imageModelOptions = getProviderImageModels(activeProvider);

  useEffect(() => {
    const handleFillPreset = (event: Event) => {
      const preset = (event as CustomEvent<string>).detail;
      if (preset) setPrompt(preset);
    };

    window.addEventListener('stickerCraft:fill-preset', handleFillPreset);
    return () => window.removeEventListener('stickerCraft:fill-preset', handleFillPreset);
  }, []);

  const collectionCountPresets = [4, 6, 9];
  const isCustomCollectionCount = !collectionCountPresets.includes(stickerCollectionCount);

  useEffect(() => {
    const handleSettingsUpdated = () => {
      const nextModelState = getConfiguredImageModelState();
      setActiveProvider(nextModelState.provider);
      setModel(nextModelState.model);
      setCustomModel(nextModelState.customModel);
    };

    window.addEventListener('stickerCraft:api-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('stickerCraft:api-settings-updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    setCollectionItemPrompts(prev => (
      Array.from({ length: stickerCollectionCount }, (_, index) => prev[index] || '')
    ));
  }, [stickerCollectionCount]);

  const updateStickerCollectionCount = (nextCount: number) => {
    setStickerCollectionCount(Math.max(2, Math.min(12, Math.round(nextCount || 2))));
  };

  const updateCollectionItemPrompt = (index: number, value: string) => {
    setCollectionItemPrompts(prev => prev.map((item, itemIndex) => (
      itemIndex === index ? value : item
    )));
  };

  const handleGenerateCollectionItems = async () => {
    if (!prompt.trim()) return;

    setIsGeneratingCollectionItems(true);
    try {
      const items = await generateCollectionItemPrompts(prompt.trim(), stickerCollectionCount);
      setCollectionItemPrompts(prev => (
        Array.from({ length: stickerCollectionCount }, (_, index) => items[index] || prev[index] || '')
      ));
      trackEvent('prompt_suggestions_generated', {
        source: 'collection_items',
        requested_count: stickerCollectionCount,
        result_count: items.length,
      });
    } finally {
      setIsGeneratingCollectionItems(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!activeModel) return;

    const distinctPrompts = prompt.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    
    if (distinctPrompts.length === 0) return;

    const requests: StickerRequest[] = distinctPrompts.map(p => ({
      prompt: p,
      styleId: selectedStyle,
      quantity: 1,
      model: activeModel,
      aspectRatio,
      resolution: activeModelSupportsImageSize ? resolution : undefined,
      textConfig: {
        enabled: textEnabled,
        content: textContent.trim(),
        font: selectedFont,
        hasBorder: textBorder
      },
      backgroundConfig: {
        enabled: backgroundEnabled,
        color: backgroundColor
      },
      useThreeViews: layoutMode === 'threeViews',
      useStickerCollection: layoutMode === 'collection',
      stickerCollectionCount: layoutMode === 'collection' ? stickerCollectionCount : 1,
      collectionItemPrompts: layoutMode === 'collection'
        ? collectionItemPrompts.map(item => item.trim()).filter(Boolean)
        : undefined,
      useStickerBorder,
      useFacialFeatures,
      referenceImage: referenceImage || undefined
    }));

    onGenerate(requests);
  };

  const addPreset = (preset: string) => {
    if (prompt.trim().length === 0) {
        setPrompt(preset);
    } else {
        setPrompt(prev => prev + '\n' + preset);
    }
    trackEvent('prompt_preset_used', {
      language,
    });
  };

  // Handler for Style Creation Image
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewStyleImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStyleImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearStyleImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewStyleImageFile(null);
    setNewStyleImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handler for Generation Reference Image
  const handleReferenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      trackEvent('reference_image_added', {
        file_type: file.type || 'unknown',
      });
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      setReferenceImage(null);
      if (referenceInputRef.current) referenceInputRef.current.value = '';
  };

  const handleCreateStyle = async () => {
    if (!newStyleText.trim() && !newStyleImageFile) {
      alert(t('style_creation_error'));
      return;
    }

    setIsAnalyzing(true);
    let finalDescription = newStyleText;
    let base64ImageString = null;

    try {
      // If there's an image, analyze it
      if (newStyleImageFile && newStyleImagePreview) {
        base64ImageString = newStyleImagePreview;
        const analyzedDescription = await analyzeStyleFromImage(base64ImageString);
        
        // Merge descriptions: If user provided text, append analyzed text.
        if (finalDescription) {
          finalDescription = `${finalDescription}, ${analyzedDescription}`;
        } else {
          finalDescription = analyzedDescription;
        }
      }

      const newStyle: StickerStyle = {
        id: `custom-${Date.now()}`,
        name: `${t('custom_style_name')} ${customStyles.length + 1}`,
        promptModifier: finalDescription,
        previewColor: 'bg-indigo-500',
        isCustom: true,
        referenceImage: base64ImageString || undefined
      };

      onAddCustomStyle(newStyle);
      setSelectedStyle(newStyle.id);
      trackEvent('custom_style_created', {
        has_text: Boolean(newStyleText.trim()),
        has_image: Boolean(newStyleImageFile),
      });
      
      // Reset Form
      setNewStyleText('');
      setNewStyleImageFile(null);
      setNewStyleImagePreview(null);
      setIsCreatingStyle(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error("Style creation failed", err);
      trackEvent('custom_style_failed', {
        has_text: Boolean(newStyleText.trim()),
        has_image: Boolean(newStyleImageFile),
      });
      alert(t('style_creation_failed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGeneratePrompts = async () => {
    if (!promptCategory.trim()) return;
    setIsGeneratingPrompts(true);
    setGeneratedPrompts([]);
    try {
        const results = await generateRelatedPrompts(promptCategory);
        setGeneratedPrompts(results);
        trackEvent('prompt_suggestions_generated', {
          source: 'prompt_generator',
          result_count: results.length,
        });
    } catch (e) {
        console.error(e);
    } finally {
        setIsGeneratingPrompts(false);
    }
  };

  const useGeneratedPrompts = () => {
    const textToAppend = generatedPrompts.join('\n');
    if (prompt.trim().length === 0) {
        setPrompt(textToAppend);
    } else {
        setPrompt(prev => prev + '\n' + textToAppend);
    }
    setIsPromptGeneratorOpen(false);
    setPromptCategory('');
    setGeneratedPrompts([]);
    trackEvent('prompt_suggestions_used', {
      source: 'prompt_generator',
      count: generatedPrompts.length,
    });
  };

  const mainPromptLabel = layoutMode === 'collection' ? t('config_sticker_collection') : t('prompt_label');
  const transparentHint = useStickerBorder ? t('output_transparent_hint_black') : t('output_transparent_hint_white');
  const modelHint = t('config_model_hint').replace('{provider}', getProviderLabel(activeProvider));

  const layoutModeOptions = useMemo(() => ([
    { value: 'single' as const, label: t('config_single_sticker'), icon: Sticker },
    { value: 'threeViews' as const, label: t('config_three_views'), icon: LayoutPanelLeft },
    { value: 'collection' as const, label: t('config_sticker_collection'), icon: Layers },
  ]), [t]);

  const collectionCountOptions = useMemo(
    () => collectionCountPresets.map((num) => ({ value: String(num), label: String(num) })),
    [],
  );

  const aspectRatioOptions = useMemo(
    () => ASPECT_RATIOS.map((ratio) => ({ value: ratio.value, label: ratio.label })),
    [],
  );

  const modelOptions = useMemo(
    () => [
      ...imageModelOptions.map((option) => ({ value: option.value, label: option.label })),
      { value: 'custom', label: t('custom_model_option') },
    ],
    [imageModelOptions, t],
  );

  const resolutionOptions = useMemo(
    () => RESOLUTIONS.map((res) => ({ value: res.value, label: res.label })),
    [],
  );

  const isFormValid = prompt.trim().length > 0 && activeModel.length > 0;

  return (
    <div className="space-y-4 pb-4">
      <CollapsibleSection title={t('section_core')} defaultOpen>
      <div className="rounded-xl border border-orange-100 bg-white p-2.5 shadow-sm shadow-orange-100/40 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black text-orange-700 uppercase tracking-wider">
            {t('layout_type_title')}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
        </div>
        <SegmentedControl
          value={layoutMode}
          onChange={setLayoutMode}
          options={layoutModeOptions}
          disabled={isGenerating}
          ariaLabel={t('config_layout_mode')}
          layout="vertical"
          columns={3}
        />

        {layoutMode === 'collection' && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white p-2">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                {t('layout_collection_count')}
              </span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <SegmentedControl
                  value={
                    collectionCountPresets.includes(stickerCollectionCount)
                      ? String(stickerCollectionCount)
                      : ''
                  }
                  onChange={(next) => updateStickerCollectionCount(Number(next))}
                  options={collectionCountOptions}
                  disabled={isGenerating}
                  layout="compact"
                />
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={stickerCollectionCount}
                  onChange={(event) => updateStickerCollectionCount(Number(event.target.value))}
                  disabled={isGenerating}
                  className="w-16 rounded-lg border border-orange-100 bg-orange-50 px-2 py-1.5 text-center text-xs font-black text-orange-700 outline-none focus:border-orange-400 focus:bg-white"
                />
              </div>
            </div>
            {isCustomCollectionCount && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-amber-700 border border-amber-100">
                {t('layout_custom_count_hint')}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Prompt Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label htmlFor="prompt" className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
            {mainPromptLabel}
            </label>
            <button 
                type="button"
                onClick={() => setIsPromptGeneratorOpen(!isPromptGeneratorOpen)}
                className={`cursor-pointer text-[11px] font-bold flex items-center gap-1 px-2 py-1 rounded-md transition-colors duration-200 ${FOCUS_RING_CLASS} ${isPromptGeneratorOpen ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-600 hover:text-stone-700'}`}
            >
                <ListPlus size={12} />
                {t('prompt_generator_title')}
            </button>
        </div>

        {/* Prompt Generator Panel */}
        {isPromptGeneratorOpen && (
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 mb-2 space-y-3 animate-fade-in">
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={promptCategory}
                        onChange={(e) => setPromptCategory(e.target.value)}
                        placeholder={t('prompt_generator_placeholder')}
                        className="flex-1 p-2 text-xs rounded-lg border border-orange-200 focus:border-orange-400 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleGeneratePrompts()}
                     />
                     <button 
                        onClick={handleGeneratePrompts}
                        disabled={isGeneratingPrompts || !promptCategory.trim()}
                        className="bg-orange-500 text-white px-3 rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50"
                     >
                        {isGeneratingPrompts ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Wand2 size={14} />}
                     </button>
                 </div>
                 
                 {generatedPrompts.length > 0 && (
                     <div className="space-y-2">
                         <div className="bg-white rounded-lg border border-orange-100 p-2 max-h-32 overflow-y-auto custom-scrollbar">
                             {generatedPrompts.map((p, idx) => (
                                 <div key={idx} className="text-xs text-stone-600 border-b border-stone-50 last:border-0 py-1">{p}</div>
                             ))}
                         </div>
                         <button 
                            onClick={useGeneratedPrompts}
                            className="w-full py-1.5 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-stone-700"
                         >
                            {t('prompt_generator_use')}
                         </button>
                     </div>
                 )}
            </div>
        )}

        <div className="relative group">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('prompt_placeholder')}
            className="w-full p-3 rounded-xl border-2 border-stone-200 bg-stone-50 text-base focus:border-orange-400 focus:ring-0 focus:bg-white transition-all resize-none h-32 placeholder:text-stone-400 leading-relaxed"
            disabled={isGenerating}
          />
        </div>
        
        {/* Preset Suggestions - Compact for sidebar */}
        <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <Sparkles size={10} /> {t('prompt_presets')}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS[language].slice(0, 3).map((preset, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => addPreset(preset)}
                        disabled={isGenerating}
                        className="cursor-pointer text-[11px] font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors duration-200 border border-orange-100 truncate max-w-full disabled:cursor-not-allowed"
                    >
                        {preset}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Style Selection - Dropdown */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
            {t('style_label')}
          </label>
          <span className="text-[10px] text-stone-400 font-medium">
            {customStyles.length > 0 ? `${customStyles.length} ${t('style_custom_count')}` : ''}
          </span>
        </div>
        
        <div>
            <button
                ref={styleDropdownTriggerRef}
                type="button"
                onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                disabled={isGenerating}
                aria-expanded={isStyleDropdownOpen}
                className={`
                  w-full rounded-xl border-2 p-3 flex items-center justify-between text-left transition-all duration-200 group
                  ${isStyleDropdownOpen
                    ? 'border-orange-400 bg-orange-50/50 shadow-md shadow-orange-100/50 ring-2 ring-orange-100'
                    : 'border-stone-200 bg-white hover:border-orange-300 hover:shadow-sm'
                  }
                `}
            >
                <div className="flex items-center gap-3">
                    {/* Active Style Icon/Preview */}
                     <div className={`
                          w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/5
                          ${activeStyle && getStylePreviewImage(activeStyle) ? 'bg-stone-100' : `${activeStyle?.previewColor || 'bg-stone-200'} bg-opacity-20 flex items-center justify-center`}
                        `}>
                          {activeStyle && getStylePreviewImage(activeStyle) ? (
                            <img src={getStylePreviewImage(activeStyle)} alt={activeStyle.name} className="w-full h-full object-cover object-center" />
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${activeStyle?.previewColor || 'bg-stone-400'}`}></div>
                          )}
                    </div>
                    <span className="font-bold text-stone-700 group-hover:text-orange-600 transition-colors">
                        {language === 'zh' && activeStyle?.label_zh ? activeStyle.label_zh : activeStyle?.name}
                    </span>
                </div>
                <ChevronDown size={18} className={`text-stone-400 transition-transform ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <StylePickerPanel
                isOpen={isStyleDropdownOpen}
                anchorRef={styleDropdownTriggerRef}
                onClose={() => setIsStyleDropdownOpen(false)}
                styles={allStyles}
                selectedStyleId={selectedStyle}
                onSelect={(styleId) => {
                  setSelectedStyle(styleId);
                  setIsStyleDropdownOpen(false);
                }}
                language={language}
                title={t('style_label')}
                customCountLabel={
                  customStyles.length > 0
                    ? `${customStyles.length} ${t('style_custom_count')}`
                    : undefined
                }
            />
        </div>

        {/* Create Style Toggle Button */}
        <div className="mt-2">
            <button
                type="button"
                onClick={() => setIsCreatingStyle(!isCreatingStyle)}
                disabled={isGenerating || isAnalyzing}
                className={`
                    w-full py-2.5 rounded-xl border border-dashed transition-all group flex items-center justify-center gap-2
                    ${isCreatingStyle ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-orange-200 bg-orange-50/50 text-orange-600 hover:bg-orange-50 hover:border-orange-400'}
                `}
            >
                {isCreatingStyle ? <ChevronUp size={16} /> : <ImagePlus size={16} className="group-hover:scale-110 transition-transform" />}
                <span className="font-bold text-xs">{t('style_import')}</span>
            </button>
        </div>

        {/* Custom Style Creation Form */}
        {isCreatingStyle && (
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-stone-500 uppercase">{t('create_style_title')}</span>
                </div>
                
                {/* Description Input */}
                <textarea 
                    value={newStyleText}
                    onChange={(e) => setNewStyleText(e.target.value)}
                    placeholder={t('style_desc_placeholder')}
                    className="w-full p-2 text-xs rounded-lg border border-stone-200 focus:border-orange-400 outline-none resize-none h-20"
                />

                {/* File Upload */}
                <div className="relative">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                     />
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 p-2 rounded-lg border border-stone-200 bg-white hover:border-orange-300 transition-colors relative group"
                     >
                        <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {newStyleImagePreview ? (
                                <img src={newStyleImagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload size={14} className="text-stone-400" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-stone-600 truncate flex-1 text-left">
                            {newStyleImageFile ? newStyleImageFile.name : t('upload_reference')}
                        </span>
                        
                        {newStyleImagePreview && (
                             <div 
                                onClick={clearStyleImage}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 bg-stone-200 rounded-full hover:bg-stone-300 text-stone-600 transition-colors z-10"
                                title={t('action_clear_image')}
                             >
                                <X size={12} />
                             </div>
                        )}
                     </button>
                </div>

                {/* Create Button */}
                <button
                    type="button"
                    onClick={handleCreateStyle}
                    disabled={isAnalyzing || (!newStyleText.trim() && !newStyleImageFile)}
                    className="w-full py-2 bg-stone-800 text-white rounded-lg text-xs font-bold hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isAnalyzing ? (
                       <>
                         <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         {t('btn_creating_style')}
                       </>
                    ) : (
                       <>
                         <Save size={14} />
                         {t('btn_create_style')}
                       </>
                    )}
                </button>
            </div>
        )}

      </div>
      </CollapsibleSection>

      <CollapsibleSection
        title={t('section_reference_layout')}
        defaultOpen={layoutMode === 'collection' || Boolean(referenceImage)}
      >
      {layoutMode === 'collection' && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3 space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-orange-900">{t('layout_item_title')}</p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-orange-700/80">{t('layout_item_hint')}</p>
            </div>
            <button
              type="button"
              onClick={handleGenerateCollectionItems}
              disabled={isGenerating || isGeneratingCollectionItems || !prompt.trim()}
              className="inline-flex flex-shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-orange-700 border border-orange-100 shadow-sm hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGeneratingCollectionItems ? (
                <div className="h-3 w-3 rounded-full border-2 border-orange-200 border-t-orange-600 animate-spin"></div>
              ) : (
                <Wand2 size={13} />
              )}
              {isGeneratingCollectionItems ? t('layout_generating_items') : t('layout_generate_items')}
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {collectionItemPrompts.map((itemPrompt, index) => (
              <label key={index} className="flex items-center gap-2">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-orange-600 border border-orange-100">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={itemPrompt}
                  onChange={(event) => updateCollectionItemPrompt(index, event.target.value)}
                  placeholder={t('layout_item_placeholder').replace('{index}', String(index + 1))}
                  disabled={isGenerating}
                  className="min-w-0 flex-1 rounded-lg border border-orange-100 bg-white px-3 py-2 text-xs font-bold text-stone-700 outline-none focus:border-orange-400"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Generation Reference Image Upload Section */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
          {t('upload_reference')}
        </label>
        <div className="relative">
            <input
              type="file"
              ref={referenceInputRef}
              onChange={handleReferenceSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => referenceInputRef.current?.click()}
              className={`
                  w-full p-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-colors relative group
                  ${referenceImage ? 'border-orange-300 bg-orange-50' : 'border-stone-200 bg-stone-50 hover:border-orange-300 hover:bg-white'}
              `}
            >
              {referenceImage ? (
                   <div className="relative w-full h-32 flex items-center justify-center">
                       <img src={referenceImage} alt="Reference" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                        <div
                          onClick={clearReferenceImage}
                          className="absolute top-0 right-0 p-1.5 bg-white rounded-full shadow-md hover:bg-rose-100 hover:text-rose-600 cursor-pointer transform translate-x-1/4 -translate-y-1/4"
                          title={t('action_clear_image')}
                        >
                          <X size={14} />
                        </div>
                   </div>
              ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-400 py-4">
                       <div className="bg-stone-200 p-2 rounded-full group-hover:bg-orange-100 group-hover:text-orange-500 transition-colors">
                           <ImagePlus size={20} />
                       </div>
                       <span className="text-xs font-bold text-stone-600">{t('use_image_reference')}</span>
                  </div>
              )}
            </button>
        </div>
      </div>
      </CollapsibleSection>

      <CollapsibleSection title={t('section_output_settings')} defaultOpen={false}>
      {/* Configuration Grid - 2 cols for sidebar */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
        {/* Aspect Ratio */}
        <div className="space-y-1 col-span-2">
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">{t('config_ratio')}</label>
          <CustomSelect
            value={aspectRatio}
            onChange={(next) => setAspectRatio(next as AspectRatio)}
            options={aspectRatioOptions}
            disabled={isGenerating}
            ariaLabel={t('config_ratio')}
          />
        </div>

        {/* Model */}
        <div className="space-y-1 col-span-2">
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">{t('config_model')}</label>
          <CustomSelect
            value={model}
            onChange={setModel}
            options={modelOptions}
            disabled={isGenerating}
            ariaLabel={t('config_model')}
          />
          {isCustomModel && (
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              disabled={isGenerating}
              placeholder={`e.g. ${getProviderDefaultImageModel(activeProvider)}`}
              className="w-full p-1.5 rounded-lg border border-orange-200 bg-white text-xs font-bold text-stone-700 focus:border-orange-400 outline-none"
            />
          )}
          <p className="text-[11px] text-stone-600 leading-snug">
            {modelHint}
          </p>
        </div>

        {/* Resolution */}
        <div className={`space-y-1 col-span-2 ${!activeModelSupportsImageSize ? 'opacity-50 pointer-events-none' : ''}`}>
           <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">{t('config_resolution')}</label>
           <CustomSelect
            value={resolution}
            onChange={(next) => setResolution(next as ImageResolution)}
            options={resolutionOptions}
            disabled={isGenerating || !activeModelSupportsImageSize}
            ariaLabel={t('config_resolution')}
          />
        </div>
      </div>
      </CollapsibleSection>

      <CollapsibleSection title={t('section_advanced')} defaultOpen={false}>
      {/* Advanced Toggles */}
      <div className="space-y-2 border-t border-stone-100 pt-4">
        {/* Facial Features Toggle */}
        <label className={`
            flex items-center justify-between cursor-pointer group p-3 rounded-xl border transition-all
            ${useFacialFeatures ? 'border-orange-200 bg-orange-50/50' : 'border-stone-100 hover:border-orange-100'}
          `}>
             <div className="flex items-center gap-2">
                 <Smile size={16} className={useFacialFeatures ? 'text-orange-500' : 'text-stone-400'} />
                 <span className={`text-xs font-bold ${useFacialFeatures ? 'text-orange-900' : 'text-stone-600'}`}>
                    {t('config_facial_features')}
                 </span>
             </div>
             <input 
                  type="checkbox" 
                  checked={useFacialFeatures}
                  onChange={(e) => setUseFacialFeatures(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                  disabled={isGenerating}
             />
        </label>

        <label className={`
            flex items-center justify-between cursor-pointer group p-3 rounded-xl border transition-all
            ${useStickerBorder ? 'border-orange-200 bg-orange-50/50' : 'border-stone-100 hover:border-orange-100'}
          `}>
             <div className="flex items-center gap-2">
                 <Sticker size={16} className={useStickerBorder ? 'text-orange-500' : 'text-stone-400'} />
                 <span className={`text-xs font-bold ${useStickerBorder ? 'text-orange-900' : 'text-stone-600'}`}>
                    {t('config_sticker_border')}
                 </span>
             </div>
             <input 
                  type="checkbox" 
                  checked={useStickerBorder}
                  onChange={(e) => setUseStickerBorder(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                  disabled={isGenerating}
             />
        </label>
        
      </div>

      {/* Text Toggle Section */}
      <div className="space-y-3 border-t border-stone-100 pt-4">
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <Type size={14} /> {t('text_section_title')}
            </span>
             <button
              type="button"
              onClick={() => setTextEnabled(!textEnabled)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${textEnabled ? 'bg-orange-500' : 'bg-stone-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${textEnabled ? 'translate-x-4' : ''}`}></div>
            </button>
        </div>

        {textEnabled && (
           <div className="space-y-3 animate-fade-in bg-stone-50 p-3 rounded-lg border border-stone-100">
              <input 
                 type="text" 
                 value={textContent}
                 onChange={(e) => setTextContent(e.target.value)}
                 placeholder={t('text_input_placeholder')}
                 className="w-full p-2 text-sm font-bold border rounded-md focus:border-orange-400 outline-none text-stone-700"
              />
               <ChipGroup ariaLabel={t('font_style')} className="grid grid-cols-3 gap-1">
                 {AVAILABLE_FONTS.slice(0, 3).map((font) => (
                    <Chip
                        key={font.name}
                        tone="panel"
                        size="sm"
                        shape="rounded"
                        selected={selectedFont === font.name}
                        onClick={() => setSelectedFont(font.name)}
                        style={{ fontFamily: font.family }}
                    >
                        {font.name}
                    </Chip>
                 ))}
               </ChipGroup>
           </div>
        )}
      </div>

      {/* Background Toggle Section */}
      <div className="space-y-3 border-t border-stone-100 pt-4">
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                <PaletteIcon size={14} /> {t('background_section_title')}
            </span>
             <button
              type="button"
              onClick={() => setBackgroundEnabled(!backgroundEnabled)}
              className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${backgroundEnabled ? 'bg-orange-500' : 'bg-stone-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${backgroundEnabled ? 'translate-x-4' : ''}`}></div>
            </button>
        </div>

        <div className={`rounded-xl border p-3 ${backgroundEnabled ? 'border-stone-200 bg-stone-50' : 'border-emerald-100 bg-emerald-50/70'}`}>
          <div className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-wide ${backgroundEnabled ? 'text-stone-600' : 'text-emerald-700'}`}>
            <Info size={13} />
            {backgroundEnabled ? t('output_background_mode') : t('output_transparent_mode')}
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${backgroundEnabled ? 'text-stone-600' : 'text-emerald-700'}`}>
            {backgroundEnabled ? t('output_background_hint') : transparentHint}
          </p>
        </div>

        {backgroundEnabled && (
           <div className="space-y-2 animate-fade-in bg-stone-50 p-3 rounded-lg border border-stone-100">
              <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('bg_color')}</span>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setBackgroundColor(color.value)}
                    title={color.name}
                    className={`
                      w-7 h-7 rounded-full border border-stone-200 ${color.class}
                      ${backgroundColor === color.value ? 'ring-2 ring-orange-400 ring-offset-2' : 'hover:ring-2 hover:ring-orange-200 hover:ring-offset-1'}
                      transition-colors duration-200
                    `}
                  >
                    {backgroundColor === color.value && (
                      <Check size={14} className="mx-auto text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
           </div>
        )}
      </div>
      </CollapsibleSection>

      {/* Sticky Bottom Generate Button */}
      <div className="sticky bottom-0 pt-4 bg-white border-t border-stone-50 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !isFormValid}
            className={`
              w-full cursor-pointer py-3.5 px-6 rounded-xl font-black text-sm text-white shadow-xl shadow-orange-200
              flex items-center justify-center space-x-2 transition-colors duration-200 active:scale-[0.98]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
              ${isGenerating || !isFormValid 
                ? 'bg-stone-300 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:to-rose-600 hover:shadow-orange-300'}
            `}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('btn_generating')}</span>
              </>
            ) : (
              <>
                <Wand2 size={18} />
                <span>{t('btn_generate')}</span>
              </>
            )}
          </button>
      </div>
    </div>
  );
};

export default ControlPanel;
