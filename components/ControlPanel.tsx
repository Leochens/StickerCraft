
import React, { useState, useRef } from 'react';
import { ModelType, AspectRatio, ImageResolution, StickerRequest, StickerStyle, TextConfig } from '../types';
import { STICKER_STYLES, ASPECT_RATIOS, RESOLUTIONS, AVAILABLE_FONTS, BACKGROUND_COLORS, PRESET_PROMPTS } from '../constants';
import { Wand2, Layers, Monitor, Sliders, Check, Plus, Upload, Trash2, ImagePlus, Info, Type, Palette as PaletteIcon, Sparkles, Box, LayoutPanelLeft, Sticker, ChevronDown, Smile, ChevronUp, Save, X, Lightbulb, ListPlus } from 'lucide-react';
import { analyzeStyleFromImage, generateRelatedPrompts } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface ControlPanelProps {
  onGenerate: (requests: StickerRequest[]) => void;
  isGenerating: boolean;
  customStyles: StickerStyle[];
  onAddCustomStyle: (style: StickerStyle) => void;
  onRemoveCustomStyle: (id: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  isGenerating,
  customStyles,
  onAddCustomStyle,
  onRemoveCustomStyle
}) => {
  const { t, language } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STICKER_STYLES[0].id);
  const [quantity, setQuantity] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(AspectRatio.SQUARE);
  const [model, setModel] = useState(ModelType.STANDARD);
  const [resolution, setResolution] = useState(ImageResolution.RES_1K);
  
  // Advanced Config
  const [useThreeViews, setUseThreeViews] = useState(false);
  const [useStickerBorder, setUseStickerBorder] = useState(true);
  const [useFacialFeatures, setUseFacialFeatures] = useState(true);

  // Text & Background Config
  const [textEnabled, setTextEnabled] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [selectedFont, setSelectedFont] = useState(AVAILABLE_FONTS[0].name);
  const [textBorder, setTextBorder] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('white');

  // Generation Reference Image
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (textEnabled && !textContent.trim()) return;

    const distinctPrompts = prompt.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    
    if (distinctPrompts.length === 0) return;

    const requests: StickerRequest[] = distinctPrompts.map(p => ({
      prompt: p,
      styleId: selectedStyle,
      quantity,
      model,
      aspectRatio,
      resolution: model === ModelType.PRO ? resolution : undefined,
      textConfig: {
        enabled: textEnabled,
        content: textContent,
        font: selectedFont,
        hasBorder: textBorder,
        backgroundColor: backgroundColor
      },
      useThreeViews,
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
      
      // Reset Form
      setNewStyleText('');
      setNewStyleImageFile(null);
      setNewStyleImagePreview(null);
      setIsCreatingStyle(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err) {
      console.error("Style creation failed", err);
      alert("Failed to create style. Please try again.");
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
  };

  const isFormValid = prompt.trim().length > 0 && (!textEnabled || textContent.trim().length > 0);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Prompt Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label htmlFor="prompt" className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
            {t('prompt_label')}
            </label>
            <button 
                type="button"
                onClick={() => setIsPromptGeneratorOpen(!isPromptGeneratorOpen)}
                className={`text-[10px] font-bold flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${isPromptGeneratorOpen ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-500 hover:text-stone-700'}`}
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
            <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                <Sparkles size={10} /> {t('prompt_presets')}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS[language].slice(0, 3).map((preset, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => addPreset(preset)}
                        disabled={isGenerating}
                        className="text-[10px] font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors border border-orange-100 truncate max-w-full"
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
        
        <div className="relative">
            {/* Dropdown Trigger */}
            <button
                type="button"
                onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                disabled={isGenerating}
                className="w-full p-3 bg-white border-2 border-stone-200 rounded-xl flex items-center justify-between hover:border-orange-300 transition-colors text-left group"
            >
                <div className="flex items-center gap-3">
                    {/* Active Style Icon/Preview */}
                     <div className={`
                          w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 
                          ${activeStyle?.referenceImage ? 'bg-stone-100' : `${activeStyle?.previewColor || 'bg-stone-200'} bg-opacity-20 flex items-center justify-center`}
                        `}>
                          {activeStyle?.referenceImage ? (
                            <img src={activeStyle.referenceImage} alt={activeStyle.name} className="w-full h-full object-cover" />
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

            {/* Dropdown Menu */}
            {isStyleDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                    {allStyles.map((style) => (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => {
                                setSelectedStyle(style.id);
                                setIsStyleDropdownOpen(false);
                            }}
                            className={`
                                w-full p-3 flex items-center justify-between hover:bg-orange-50 transition-colors border-b border-stone-50 last:border-0
                                ${selectedStyle === style.id ? 'bg-orange-50/50' : ''}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                  w-6 h-6 rounded-lg overflow-hidden flex-shrink-0 
                                  ${style.referenceImage ? 'bg-stone-100' : `${style.previewColor} bg-opacity-20 flex items-center justify-center`}
                                `}>
                                  {style.referenceImage ? (
                                    <img src={style.referenceImage} alt={style.name} className="w-full h-full object-cover" />
                                  ) : (
                                     <div className={`w-2 h-2 rounded-full ${style.previewColor}`}></div>
                                  )}
                                </div>
                                <span className={`text-xs font-bold ${selectedStyle === style.id ? 'text-orange-600' : 'text-stone-600'}`}>
                                    {language === 'zh' && style.label_zh ? style.label_zh : style.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
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
                       <span className="text-xs font-bold">Use Image Reference</span>
                  </div>
              )}
            </button>
        </div>
      </div>

      {/* Configuration Grid - 2 cols for sidebar */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-100">
        {/* Quantity */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('config_quantity')}</label>
          <div className="flex bg-stone-100 p-1 rounded-lg">
            {[1, 2, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuantity(num)}
                disabled={isGenerating}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                  quantity === num 
                    ? 'bg-white text-orange-600 shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('config_ratio')}</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            disabled={isGenerating}
            className="w-full p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 focus:border-orange-400 outline-none"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('config_model')}</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as ModelType)}
            disabled={isGenerating}
            className="w-full p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 focus:border-orange-400 outline-none"
          >
            <option value={ModelType.STANDARD}>Standard (Flash)</option>
            <option value={ModelType.PRO}>Pro (Gemini 3)</option>
          </select>
        </div>

        {/* Resolution */}
        <div className={`space-y-1 ${model !== ModelType.PRO ? 'opacity-50 pointer-events-none' : ''}`}>
           <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('config_resolution')}</label>
           <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as ImageResolution)}
            disabled={isGenerating || model !== ModelType.PRO}
            className="w-full p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-bold text-stone-700 focus:border-orange-400 outline-none"
          >
            {RESOLUTIONS.map((res) => (
              <option key={res.value} value={res.value}>{res.label}</option>
            ))}
          </select>
        </div>
      </div>

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
        
        <label className={`
            flex items-center justify-between cursor-pointer group p-3 rounded-xl border transition-all
            ${useThreeViews ? 'border-orange-200 bg-orange-50/50' : 'border-stone-100 hover:border-orange-100'}
          `}>
             <div className="flex items-center gap-2">
                 <LayoutPanelLeft size={16} className={useThreeViews ? 'text-orange-500' : 'text-stone-400'} />
                 <span className={`text-xs font-bold ${useThreeViews ? 'text-orange-900' : 'text-stone-600'}`}>
                    {t('config_three_views')}
                 </span>
             </div>
             <input 
                  type="checkbox" 
                  checked={useThreeViews}
                  onChange={(e) => setUseThreeViews(e.target.checked)}
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
               <div className="grid grid-cols-3 gap-1">
                 {AVAILABLE_FONTS.slice(0, 3).map((font) => (
                    <button
                        key={font.name}
                        onClick={() => setSelectedFont(font.name)}
                        className={`text-[10px] p-1 border rounded ${selectedFont === font.name ? 'bg-white border-orange-400 text-orange-600' : 'border-stone-200 text-stone-500'}`}
                        style={{fontFamily: font.family}}
                    >
                        {font.name}
                    </button>
                 ))}
               </div>
               
               {/* Color Circles */}
               <div className="flex flex-wrap gap-1.5 pt-1">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setBackgroundColor(color.value)}
                      className={`
                        w-5 h-5 rounded-full border border-stone-200 ${color.class}
                        ${backgroundColor === color.value ? 'ring-2 ring-orange-400 ring-offset-1 scale-110' : ''}
                      `}
                    />
                  ))}
               </div>
           </div>
        )}
      </div>

      {/* Sticky Bottom Generate Button */}
      <div className="sticky bottom-0 pt-4 bg-white border-t border-stone-50">
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !isFormValid}
            className={`
              w-full py-3.5 px-6 rounded-xl font-black text-sm text-white shadow-xl shadow-orange-200
              flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98]
              ${isGenerating || !isFormValid 
                ? 'bg-stone-300 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-orange-500 to-rose-500 hover:to-rose-600 hover:shadow-orange-300 hover:-translate-y-0.5'}
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
