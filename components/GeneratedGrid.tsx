import React, { useState, useMemo, useRef } from 'react';
import { GeneratedImage } from '../types';
import StickerCard from './StickerCard';
import { Image, Archive, CheckSquare, Square, X, Upload, BadgeCheck, FileCheck2, Layers3 } from 'lucide-react';
import JSZip from 'jszip';
import { useLanguage } from '../contexts/LanguageContext';
import { STICKER_STYLES } from '../constants';

interface GeneratedGridProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  pendingQuantity?: number;
  onPreview: (image: GeneratedImage) => void;
  onDelete?: (id: string) => void;
  onRegenerate?: (image: GeneratedImage) => void;
  regeneratingIds?: Set<string>;
  onUploadImage?: (dataUrl: string, prompt: string, styleName: string) => void;
}

const GeneratedGrid: React.FC<GeneratedGridProps> = ({ 
  images, 
  isGenerating, 
  pendingQuantity = 1, 
  onPreview,
  onDelete,
  onRegenerate,
  regeneratingIds = new Set(),
  onUploadImage
}) => {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [uploadStyle, setUploadStyle] = useState(STICKER_STYLES[0].name);
  const [isCustomStyleInput, setIsCustomStyleInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive unique categories from images
  const categories = useMemo(() => {
    const styles = new Set(images.map(img => img.styleName));
    return ['All', ...Array.from(styles)];
  }, [images]);

  // Filter images based on selected category
  const filteredImages = useMemo(() => {
    if (selectedCategory === 'All') return images;
    return images.filter(img => img.styleName === selectedCategory);
  }, [images, selectedCategory]);

  const copy = language === 'zh'
    ? {
        transparentPng: '透明 PNG',
        backgroundKept: '保留背景',
        zipReady: '可打包导出',
        transparentHelp: '适合 sticker、icon、贴纸包等需要透明素材的场景。',
        backgroundHelp: '适合海报、卡片、场景图或需要背景的素材。',
        zipHelp: '选择图片后可一次下载 ZIP。',
        selectedReady: '已选择',
        visibleReady: '当前可见',
      }
    : {
        transparentPng: 'Transparent PNG',
        backgroundKept: 'Background kept',
        zipReady: 'ZIP-ready',
        transparentHelp: 'For stickers, icons, and packs that need transparent assets.',
        backgroundHelp: 'For posters, cards, scenes, or assets that should keep a background.',
        zipHelp: 'Select images to export them together.',
        selectedReady: 'selected',
        visibleReady: 'visible',
      };

  const transparentCount = images.filter(image => image.backgroundRemoved === true).length;
  const backgroundKeptCount = images.filter(image => image.backgroundRemoved === false).length;
  const zipReadyCount = selectedIds.size || filteredImages.length;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("stickers");
      
      const selectedImages = images.filter(img => selectedIds.has(img.id));
      
      selectedImages.forEach((img, index) => {
        // Remove data URL prefix to get just base64 data
        const base64Data = img.dataUrl.split(',')[1];
        const filename = `sticker_${index + 1}_${img.styleName.replace(/\s+/g, '-').toLowerCase()}.png`;
        folder?.file(filename, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = "stickercraft_bundle.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Clear selection after download
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to zip images", error);
      alert("Failed to create zip file.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setUploadFile(reader.result as string);
              setIsUploadModalOpen(true);
              setUploadPrompt(file.name.split('.')[0]); // Default prompt to filename
          };
          reader.readAsDataURL(file);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUpload = () => {
      if (onUploadImage && uploadFile && uploadPrompt.trim()) {
          onUploadImage(uploadFile, uploadPrompt, uploadStyle);
          setIsUploadModalOpen(false);
          setUploadFile(null);
          setUploadPrompt('');
      }
  };

  if (images.length === 0 && !isGenerating && !isUploadModalOpen) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-3xl border-2 border-dashed border-stone-200 bg-white/50 min-h-[400px]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 text-orange-300 mb-6">
          <Image size={40} />
        </div>
        <h3 className="text-2xl font-black text-stone-700 mb-3">{t('empty_gallery_title')}</h3>
        <p className="text-stone-500 max-w-sm mx-auto leading-relaxed mb-6">
          {t('empty_gallery_desc')}
        </p>
         {/* Upload Button for Empty State */}
         {onUploadImage && (
             <div className="relative">
                 <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={handleFileSelect} 
                     accept="image/*"
                 />
                 <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="bg-white border border-stone-200 text-stone-600 font-bold px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2"
                 >
                     <Upload size={16} />
                     {t('upload_image_title')}
                 </button>
             </div>
         )}
         
         {/* Re-render modal in empty state if needed */}
         {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                     <h3 className="text-lg font-bold text-stone-800 mb-4">{t('upload_image_title')}</h3>
                     
                     <div className="flex justify-center mb-4 bg-stone-100 rounded-lg p-4">
                         {uploadFile && <img src={uploadFile} alt="Preview" className="max-h-48 object-contain" />}
                     </div>
                     
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-stone-400 uppercase mb-1">{t('upload_image_prompt')}</label>
                             <input 
                                 type="text" 
                                 value={uploadPrompt} 
                                 onChange={(e) => setUploadPrompt(e.target.value)}
                                 className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm"
                             />
                         </div>
                         
                         <div>
                             <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-stone-400 uppercase">{t('upload_image_classification')}</label>
                                <button 
                                    onClick={() => setIsCustomStyleInput(!isCustomStyleInput)}
                                    className="text-[10px] text-orange-500 font-bold hover:underline"
                                >
                                    {isCustomStyleInput ? "Pick existing" : "Type new"}
                                </button>
                             </div>
                             
                             {isCustomStyleInput ? (
                                 <input 
                                     type="text"
                                     value={uploadStyle}
                                     onChange={(e) => setUploadStyle(e.target.value)}
                                     placeholder="e.g. My Custom Style"
                                     className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm"
                                 />
                             ) : (
                                 <select 
                                     value={uploadStyle}
                                     onChange={(e) => setUploadStyle(e.target.value)}
                                     className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm bg-white"
                                 >
                                     {STICKER_STYLES.map(s => (
                                         <option key={s.id} value={s.name}>{s.name}</option>
                                     ))}
                                      {/* Add unique styles already in gallery if not in default */}
                                      {categories.filter(c => c !== 'All' && !STICKER_STYLES.some(s => s.name === c)).map(c => (
                                          <option key={c} value={c}>{c}</option>
                                      ))}
                                 </select>
                             )}
                         </div>

                         <div className="flex gap-2 pt-2">
                             <button 
                                 onClick={() => setIsUploadModalOpen(false)}
                                 className="flex-1 py-2 text-stone-500 font-bold hover:bg-stone-50 rounded-lg"
                             >
                                 Cancel
                             </button>
                             <button 
                                 onClick={confirmUpload}
                                 className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600"
                             >
                                 {t('btn_upload')}
                             </button>
                         </div>
                     </div>
                 </div>
            </div>
         )}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         {/* Category Tabs */}
         <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  px-3 py-1 rounded-full text-xs font-bold transition-all border
                  ${selectedCategory === cat
                    ? 'bg-stone-800 text-white border-stone-800 shadow-md' 
                    : 'bg-white text-stone-500 border-stone-200 hover:border-orange-200 hover:text-orange-500'}
                `}
              >
                {cat === 'All' ? t('gallery_category_all') : cat}
                {cat !== 'All' && (
                  <span className={`ml-1.5 text-[10px] opacity-70 ${selectedCategory === cat ? 'text-white' : 'text-stone-400'}`}>
                    {images.filter(i => i.styleName === cat).length}
                  </span>
                )}
              </button>
            ))}
            
            {/* Upload Button */}
            {onUploadImage && (
             <div className="relative ml-2">
                 <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     onChange={handleFileSelect} 
                     accept="image/*"
                 />
                 <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="bg-white border border-stone-200 text-stone-500 font-bold p-1.5 rounded-full hover:bg-stone-50 hover:text-orange-500 transition-colors"
                     title={t('upload_image_title')}
                 >
                     <Upload size={16} />
                 </button>
             </div>
            )}
         </div>

         {filteredImages.length > 0 && (
          <button 
            onClick={selectAll}
            className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors self-start md:self-auto"
          >
            {selectedIds.size === filteredImages.length && filteredImages.length > 0 ? <CheckSquare size={14} /> : <Square size={14} />}
            {selectedIds.size === filteredImages.length && filteredImages.length > 0 ? t('deselect_all') : t('select_all')}
          </button>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-wide">
                <BadgeCheck size={15} />
                {copy.transparentPng}
              </div>
              <span className="text-lg font-black text-stone-900">{transparentCount}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{copy.transparentHelp}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-stone-600 uppercase tracking-wide">
                <Layers3 size={15} />
                {copy.backgroundKept}
              </div>
              <span className="text-lg font-black text-stone-900">{backgroundKeptCount}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">{copy.backgroundHelp}</p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-orange-700 uppercase tracking-wide">
                <FileCheck2 size={15} />
                {copy.zipReady}
              </div>
              <span className="text-lg font-black text-stone-900">{zipReadyCount}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-stone-500">
              {selectedIds.size > 0 ? `${selectedIds.size} ${copy.selectedReady}` : `${filteredImages.length} ${copy.visibleReady}`} · {copy.zipHelp}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Placeholder skeletons while generating */}
        {isGenerating && (
           Array.from({ length: pendingQuantity }).map((_, i) => (
             <div key={`loading-${i}`} className="animate-pulse bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 aspect-[1/1] flex flex-col">
               <div className="bg-stone-200 h-full w-full relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
               </div>
               <div className="h-12 bg-stone-50 border-t border-stone-100 p-3 space-y-2">
                  <div className="h-2 bg-stone-200 rounded w-1/3"></div>
                  <div className="h-2 bg-stone-200 rounded w-3/4"></div>
               </div>
             </div>
           ))
        )}

        {/* Actual Images */}
        {filteredImages.map((img) => (
          <StickerCard 
            key={img.id} 
            image={img} 
            onPreview={onPreview}
            onDelete={onDelete}
            onRegenerate={onRegenerate}
            isSelected={selectedIds.has(img.id)}
            onToggleSelection={toggleSelection}
            selectionMode={selectedIds.size > 0}
            isRegenerating={regeneratingIds.has(img.id)}
          />
        ))}
        
        {filteredImages.length === 0 && !isGenerating && (
            <div className="col-span-full py-12 text-center text-stone-400 font-medium">
                No stickers found in this category.
            </div>
        )}
      </div>

      {/* Floating Action Bar for Batch Operations */}
      <div className={`
        fixed bottom-6 left-1/2 md:left-[calc(50%-200px)] transform -translate-x-1/2 z-30
        transition-all duration-300 ease-in-out
        ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'}
      `}>
        <div className="bg-stone-900 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 border border-stone-700">
          <span className="font-bold text-sm whitespace-nowrap">
            {selectedIds.size} {t('selected')}
          </span>
          <div className="h-6 w-px bg-stone-700"></div>
          <button 
            onClick={handleBatchDownload}
            disabled={isZipping}
            className="flex items-center gap-2 font-bold text-sm bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isZipping ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t('zipping')}
              </>
            ) : (
              <>
                <Archive size={16} />
                {t('download_zip')}
              </>
            )}
          </button>
          <button 
            onClick={() => setSelectedIds(new Set())}
            className="text-stone-400 hover:text-white transition-colors p-1"
          >
            <span className="sr-only">Cancel</span>
            <X size={20} />
          </button>
        </div>
      </div>
      
       {/* Upload Modal (Duplicate logic to ensure it renders if invoked from header button) */}
       {isUploadModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-in">
                     <h3 className="text-lg font-bold text-stone-800 mb-4">{t('upload_image_title')}</h3>
                     
                     <div className="flex justify-center mb-4 bg-stone-100 rounded-lg p-4">
                         {uploadFile && <img src={uploadFile} alt="Preview" className="max-h-48 object-contain" />}
                     </div>
                     
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-stone-400 uppercase mb-1">{t('upload_image_prompt')}</label>
                             <input 
                                 type="text" 
                                 value={uploadPrompt} 
                                 onChange={(e) => setUploadPrompt(e.target.value)}
                                 className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm"
                             />
                         </div>
                         
                         <div>
                             <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-stone-400 uppercase">{t('upload_image_classification')}</label>
                                <button 
                                    onClick={() => setIsCustomStyleInput(!isCustomStyleInput)}
                                    className="text-[10px] text-orange-500 font-bold hover:underline"
                                >
                                    {isCustomStyleInput ? "Pick existing" : "Type new"}
                                </button>
                             </div>
                             
                             {isCustomStyleInput ? (
                                 <input 
                                     type="text"
                                     value={uploadStyle}
                                     onChange={(e) => setUploadStyle(e.target.value)}
                                     placeholder="e.g. My Custom Style"
                                     className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm"
                                 />
                             ) : (
                                 <select 
                                     value={uploadStyle}
                                     onChange={(e) => setUploadStyle(e.target.value)}
                                     className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm bg-white"
                                 >
                                     {STICKER_STYLES.map(s => (
                                         <option key={s.id} value={s.name}>{s.name}</option>
                                     ))}
                                      {/* Add unique styles already in gallery if not in default */}
                                      {categories.filter(c => c !== 'All' && !STICKER_STYLES.some(s => s.name === c)).map(c => (
                                          <option key={c} value={c}>{c}</option>
                                      ))}
                                 </select>
                             )}
                         </div>

                         <div className="flex gap-2 pt-2">
                             <button 
                                 onClick={() => setIsUploadModalOpen(false)}
                                 className="flex-1 py-2 text-stone-500 font-bold hover:bg-stone-50 rounded-lg"
                             >
                                 Cancel
                             </button>
                             <button 
                                 onClick={confirmUpload}
                                 className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600"
                             >
                                 {t('btn_upload')}
                             </button>
                         </div>
                     </div>
                 </div>
            </div>
         )}
    </div>
  );
};

export default GeneratedGrid;
