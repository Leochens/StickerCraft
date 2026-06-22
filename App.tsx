import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import GeneratedGrid from './components/GeneratedGrid';
import GalleryHelpRail from './components/GalleryHelpRail';
import MobileTabBar, { MobileTab } from './components/MobileTabBar';
import { StickerRequest, GeneratedImage, StickerStyle, ModelType, AspectRatio, CropAdjustments } from './types';
import { generateStickers } from './services/geminiService';
import {
  recropStickerFromSource,
  repairStickerTransparency,
  splitStickerCollectionByGridDetailed,
  splitStickerCollectionDetailed,
  SplitStickerCollectionResult,
} from './services/imageProcessing';
import { loadPersistedStickerCraftData, saveCustomStyles, saveGeneratedImages } from './services/storageService';
import { STICKER_STYLES } from './constants';
import { X, Download, BadgeCheck, FileImage, Layers3, ShieldCheck } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { CHECKERBOARD_CLASS } from './utils/uiClasses';
import Badge from './components/ui/Badge';
import IconButton from './components/ui/IconButton';

const App: React.FC = () => {
  const { t } = useLanguage();
  
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [transparencyRepairIds, setTransparencyRepairIds] = useState<Set<string>>(new Set());
  const [splittingCollectionIds, setSplittingCollectionIds] = useState<Set<string>>(new Set());
  const [pendingQuantity, setPendingQuantity] = useState(0); // Track how many images are being generated
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('create');
  const [isHelpRailCollapsed, setIsHelpRailCollapsed] = useState(false);
  
  // Custom Styles State
  const [customStyles, setCustomStyles] = useState<StickerStyle[]>([]);

  // Load generated stickers and custom styles from IndexedDB on mount.
  useEffect(() => {
    let isMounted = true;

    loadPersistedStickerCraftData()
      .then(({ images: persistedImages, customStyles: persistedCustomStyles }) => {
        if (!isMounted) return;
        setImages(persistedImages);
        setCustomStyles(persistedCustomStyles);
      })
      .catch((storageError) => {
        console.error("Failed to load persisted StickerCraft data", storageError);
        if (isMounted) {
          setError("Could not load saved stickers from browser storage.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasHydratedStorage(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Save custom styles whenever they change after the initial IndexedDB hydration.
  useEffect(() => {
    if (!hasHydratedStorage) return;

    saveCustomStyles(customStyles).catch((storageError) => {
      console.error("Failed to save custom styles to IndexedDB", storageError);
      setError("Custom styles could not be saved to browser storage.");
    });
  }, [customStyles, hasHydratedStorage]);

  // Save generated images whenever they change after the initial IndexedDB hydration.
  useEffect(() => {
    if (!hasHydratedStorage) return;

    saveGeneratedImages(images).catch((storageError) => {
      console.error("Failed to save images to IndexedDB", storageError);
      setError("Generated stickers could not be saved to browser storage.");
    });
  }, [images, hasHydratedStorage]);

  useEffect(() => {
    if (!previewImage) return;

    const latestPreviewImage = images.find((image) => image.id === previewImage.id);
    if (latestPreviewImage && latestPreviewImage !== previewImage) {
      setPreviewImage(latestPreviewImage);
    } else if (hasHydratedStorage && !latestPreviewImage) {
      setPreviewImage(null);
    }
  }, [images, previewImage, hasHydratedStorage]);

  const handleAddCustomStyle = (style: StickerStyle) => {
    setCustomStyles(prev => [...prev, style]);
  };

  const handleRemoveCustomStyle = (id: string) => {
    setCustomStyles(prev => prev.filter(s => s.id !== id));
  };

  const handleGenerate = async (requests: StickerRequest[]) => {
    // Calculate total expected images
    const totalQty = requests.reduce((acc, req) => acc + req.quantity, 0);
    setPendingQuantity(totalQty);
    setIsGenerating(true);
    setError(null);
    
    try {
      const allStyles = [...STICKER_STYLES, ...customStyles];
      
      // Process requests
      const batchPromises = requests.map(request => 
        generateStickers(request, allStyles)
      );

      const batchResults = await Promise.all(batchPromises);
      
      // Flatten the array of arrays
      const newImages = batchResults.flat();
      
      // Prepend new images to the list
      setImages(prev => [...newImages, ...prev]);
    } catch (err: any) {
      setError(err.message || t('error_generic'));
    } finally {
      setIsGenerating(false);
      setPendingQuantity(0);
    }
  };

  const handleRepairTransparency = async (image: GeneratedImage) => {
    setError(null);
    setTransparencyRepairIds(prev => new Set(prev).add(image.id));

    try {
      const repairedDataUrl = await repairStickerTransparency(image.dataUrl, {
        backgroundColor: image.backgroundColor,
        hasStickerBorder: image.hasStickerBorder,
      });

      setImages(prev => prev.map(img =>
        img.id === image.id
          ? {
              ...img,
              dataUrl: repairedDataUrl,
              backgroundRemoved: true,
              backgroundColor: undefined,
              createdAt: repairedDataUrl === image.dataUrl ? img.createdAt : Date.now(),
            }
          : img
      ));
    } catch (err: any) {
      setError(`Transparency repair failed: ${err.message || 'Please try again.'}`);
    } finally {
      setTransparencyRepairIds(prev => {
        const next = new Set(prev);
        next.delete(image.id);
        return next;
      });
    }
  };

  const buildCollectionItems = (
    image: GeneratedImage,
    result: SplitStickerCollectionResult,
    method: 'auto' | 'manual',
  ): GeneratedImage[] => {
    const now = Date.now();

    return result.pieces.map((piece, index) => ({
      id: crypto.randomUUID(),
      dataUrl: piece.dataUrl,
      prompt: image.prompt,
      createdAt: now + index,
      styleName: image.styleName,
      backgroundRemoved: true,
      backgroundColor: undefined,
      hasStickerBorder: image.hasStickerBorder,
      hasText: image.hasText,
      hasReferenceImage: image.hasReferenceImage,
      isThreeViews: false,
      isStickerCollection: false,
      stickerCollectionCount: undefined,
      sourceType: image.sourceType,
      splitMethod: method,
      splitIndex: index + 1,
      splitSource: {
        box: piece.box,
        sourceWidth: piece.sourceWidth,
        sourceHeight: piece.sourceHeight,
      },
    }));
  };

  const applyCollectionSplit = (
    image: GeneratedImage,
    result: SplitStickerCollectionResult,
    method: 'auto' | 'manual',
  ) => {
    const collectionItems = buildCollectionItems(image, result, method);

    setImages(prev => prev.map(img =>
      img.id === image.id
        ? {
            ...img,
            dataUrl: result.sourceDataUrl,
            backgroundRemoved: true,
            backgroundColor: undefined,
            splitMethod: method,
            collectionItems,
          }
        : img
    ));
  };

  const handleSplitCollection = async (image: GeneratedImage) => {
    setError(null);
    setSplittingCollectionIds(prev => new Set(prev).add(image.id));

    try {
      const result = await splitStickerCollectionDetailed(image.dataUrl, {
        backgroundColor: image.backgroundColor,
        expectedCount: image.stickerCollectionCount || 6,
        hasStickerBorder: image.hasStickerBorder,
      });

      if (result.pieces.length === 0) {
        throw new Error('No separated stickers were detected.');
      }

      applyCollectionSplit(image, result, 'auto');
      return true;
    } catch (err: any) {
      setError(`Sticker split failed: ${err.message || 'Please try again.'}`);
      return false;
    } finally {
      setSplittingCollectionIds(prev => {
        const next = new Set(prev);
        next.delete(image.id);
        return next;
      });
    }
  };

  const handleManualSplitCollection = async (image: GeneratedImage, rows: number, columns: number) => {
    setError(null);
    setSplittingCollectionIds(prev => new Set(prev).add(image.id));

    try {
      const result = await splitStickerCollectionByGridDetailed(image.dataUrl, {
        backgroundColor: image.backgroundColor,
        rows,
        columns,
        hasStickerBorder: image.hasStickerBorder,
      });

      if (result.pieces.length === 0) {
        throw new Error('No stickers were detected in the selected grid.');
      }

      applyCollectionSplit(image, result, 'manual');
    } catch (err: any) {
      setError(`Manual split failed: ${err.message || 'Please try again.'}`);
    } finally {
      setSplittingCollectionIds(prev => {
        const next = new Set(prev);
        next.delete(image.id);
        return next;
      });
    }
  };

  const handleCropCollectionItem = async (
    collectionId: string,
    itemId: string,
    adjustments: CropAdjustments,
  ) => {
    const collection = images.find(image => image.id === collectionId);
    const item = collection?.collectionItems?.find(splitItem => splitItem.id === itemId);

    if (!collection || !item?.splitSource) {
      setError('Could not find the original sticker collection for recropping.');
      return;
    }

    setError(null);

    try {
      const recroppedDataUrl = await recropStickerFromSource(collection.dataUrl, item.splitSource.box, adjustments);

      setImages(prev => prev.map(image =>
        image.id === collectionId
          ? {
              ...image,
              collectionItems: image.collectionItems?.map(splitItem =>
                splitItem.id === itemId
                  ? {
                      ...splitItem,
                      dataUrl: recroppedDataUrl,
                      createdAt: Date.now(),
                      splitSource: {
                        ...splitItem.splitSource!,
                        cropAdjustments: adjustments,
                      },
                    }
                  : splitItem
              ),
            }
          : image
      ));
    } catch (err: any) {
      setError(`Recrop failed: ${err.message || 'Please try again.'}`);
    }
  };

  const handleDeleteCollectionItem = (collectionId: string, itemId: string) => {
    setImages(prev => prev.map(image =>
      image.id === collectionId
        ? {
            ...image,
            collectionItems: image.collectionItems?.filter(splitItem => splitItem.id !== itemId),
          }
        : image
    ));
  };

  // Re-generate a specific image (Remix)
  const handleRegenerate = async (image: GeneratedImage) => {
      // Find the style object to get params, or just use defaults. 
      // For simplicity in this app, we'll reconstruct a request based on the image's prompt.
      // However, we need to know the Model, etc. 
      // Since GeneratedImage doesn't store full config, we'll use sensible defaults + current image as reference.
      
      const allStyles = [...STICKER_STYLES, ...customStyles];
      // Try to find the original style ID by name match, or default
      const originalStyle = allStyles.find(s => s.name === image.styleName) || STICKER_STYLES[0];

      setRegeneratingIds(prev => new Set(prev).add(image.id));
      
      try {
          const request: StickerRequest = {
              prompt: image.prompt,
              styleId: originalStyle.id,
              quantity: 1,
              model: ModelType.NANO_BANANA_2, // Defaulting to Nano Banana 2 for quality/speed balance
              aspectRatio: AspectRatio.SQUARE, // Defaulting
              textConfig: { enabled: false, content: '', font: '', hasBorder: false }, // Reset text
              backgroundConfig: { enabled: false, color: 'white' },
              useThreeViews: Boolean(image.isThreeViews),
              useStickerCollection: Boolean(image.isStickerCollection),
              stickerCollectionCount: image.stickerCollectionCount || 6,
              useStickerBorder: true,
              useFacialFeatures: true,
              referenceImage: image.dataUrl // KEY: Pass original image as reference
          };

          const newImages = await generateStickers(request, allStyles);
          
          if (newImages.length > 0) {
              const newImage = newImages[0];
              // Keep the original creation time or update it? "Replace" usually implies update content.
              // Let's keep ID to maintain selection state if any, but update content.
              // Actually, keeping ID might cache-bust issues, so let's swap object but use same ID if we want, or new ID.
              // The requirement says "regenerated image can directly replace".
              
              setImages(prev => prev.map(img => 
                  img.id === image.id ? { ...newImage, id: image.id, createdAt: Date.now() } : img
              ));
          }

      } catch (err: any) {
          setError(`Regeneration failed: ${err.message}`);
      } finally {
          setRegeneratingIds(prev => {
              const next = new Set(prev);
              next.delete(image.id);
              return next;
          });
      }
  };

  // Handle uploading external images to gallery
  const handleImageUpload = (dataUrl: string, prompt: string, styleName: string) => {
      const newImage: GeneratedImage = {
          id: crypto.randomUUID(),
          dataUrl: dataUrl,
          prompt: prompt,
          createdAt: Date.now(),
          styleName: styleName,
          sourceType: 'uploaded'
      };
      setImages(prev => [newImage, ...prev]);
  };

  const closePreview = () => setPreviewImage(null);

  // Function to delete an image
  const handleDeleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    if (previewImage?.id === id) {
        closePreview();
    }
  };

  const handleDeleteImages = (ids: string[]) => {
    const idSet = new Set(ids);
    setImages(prev => prev.filter(img => !idSet.has(img.id)));
    if (previewImage && idSet.has(previewImage.id)) {
      closePreview();
    }
  };

  const assetCopy = {
    galleryDescription: t('gallery_description'),
    transparent: t('asset_transparent'),
    backgroundKept: t('asset_background_kept'),
    uploaded: t('asset_uploaded'),
    whiteBorder: t('asset_white_border'),
    noBorder: t('asset_no_border'),
    collection: t('asset_collection'),
    text: t('asset_text'),
    reference: t('asset_reference'),
    assetReadiness: t('asset_readiness'),
    transparentNote: t('asset_transparent_note'),
    backgroundNote: t('asset_background_note'),
    uploadedNote: t('asset_uploaded_note'),
    apiTrust: t('asset_api_trust'),
    galleryTitlePrefix: t('gallery_title_prefix'),
    galleryTitleAccent: t('gallery_title_accent'),
  };

  const getPreviewAssetNote = (image: GeneratedImage) => {
    if (image.sourceType === 'uploaded') return assetCopy.uploadedNote;
    if (image.backgroundRemoved === false) return assetCopy.backgroundNote;
    return assetCopy.transparentNote;
  };

  const getPreviewBadges = (image: GeneratedImage) => {
    const badges = [
      image.sourceType === 'uploaded'
        ? assetCopy.uploaded
        : image.backgroundRemoved === false
          ? assetCopy.backgroundKept
          : assetCopy.transparent,
    ];

    if (image.sourceType !== 'uploaded') {
      badges.push(image.hasStickerBorder ? assetCopy.whiteBorder : assetCopy.noBorder);
    }
    if (image.isStickerCollection) {
      badges.push(`${assetCopy.collection}${image.stickerCollectionCount ? ` x${image.stickerCollectionCount}` : ''}`);
    }
    if (image.hasText) badges.push(assetCopy.text);
    if (image.hasReferenceImage) badges.push(assetCopy.reference);

    return badges;
  };

  return (
    <div className="min-h-dvh h-dvh bg-stone-50 flex flex-col font-sans text-stone-900 overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        <aside className={`w-full md:w-[360px] lg:w-[400px] bg-white border-r border-orange-100 shadow-2xl shadow-orange-100/50 z-20 flex flex-col overflow-hidden flex-shrink-0 min-h-0 ${
          mobileTab === 'gallery' ? 'hidden md:flex' : 'flex flex-1 md:flex-none md:h-auto'
        }`}>
          <div className="p-5 border-b border-orange-50 bg-white sticky top-0 z-10 flex-shrink-0">
            <h3 className="text-lg font-black text-stone-800 uppercase tracking-wide flex items-center gap-2">
               <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
               {t('creation_palette')}
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 min-h-0">
            <ControlPanel 
              onGenerate={handleGenerate} 
              isGenerating={isGenerating}
              customStyles={customStyles}
              onAddCustomStyle={handleAddCustomStyle}
              onRemoveCustomStyle={handleRemoveCustomStyle}
            />
             {error && (
              <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm animate-fade-in text-center">
                <p className="font-bold">{t('error_oops')}</p>
                <p>{error}</p>
              </div>
            )}
          </div>
        </aside>

        <div className={`flex-1 bg-stone-100/50 relative overflow-y-auto custom-scrollbar p-4 md:p-8 min-h-0 ${
          mobileTab === 'create' ? 'hidden md:block' : 'block'
        }`}>
           <div className={`mx-auto min-h-full max-w-[1800px] ${
             isHelpRailCollapsed ? 'block' : 'grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'
           }`}>
             <div className="min-w-0">
               <div className="mb-6">
                 <h2 className="text-3xl font-extrabold text-stone-800 tracking-tight">
                   {assetCopy.galleryTitlePrefix} <span className="text-orange-500">{assetCopy.galleryTitleAccent}</span>
                 </h2>
                 <p className="text-stone-500 mt-1">
                   {assetCopy.galleryDescription}
                 </p>
               </div>

               <div className="flex-grow">
                 <GeneratedGrid
                   images={images}
                   isGenerating={isGenerating}
                   pendingQuantity={pendingQuantity}
                   onPreview={setPreviewImage}
                   onDelete={handleDeleteImage}
                   onDeleteMany={handleDeleteImages}
                   onRegenerate={handleRegenerate}
                   onRepairTransparency={handleRepairTransparency}
                   onSplitCollection={handleSplitCollection}
                   onManualSplitCollection={handleManualSplitCollection}
                   onCropCollectionItem={handleCropCollectionItem}
                   onDeleteCollectionItem={handleDeleteCollectionItem}
                   regeneratingIds={regeneratingIds}
                   transparencyRepairIds={transparencyRepairIds}
                   splittingCollectionIds={splittingCollectionIds}
                   onUploadImage={handleImageUpload}
                   onSwitchToCreate={() => setMobileTab('create')}
                 />
               </div>
             </div>
             {!isHelpRailCollapsed && (
               <GalleryHelpRail
                 isCollapsed={false}
                 onCollapsedChange={setIsHelpRailCollapsed}
               />
             )}
           </div>
           {isHelpRailCollapsed && (
             <GalleryHelpRail
               isCollapsed
               onCollapsedChange={setIsHelpRailCollapsed}
             />
           )}
        </div>

      </main>

      <MobileTabBar
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        galleryCount={images.length}
        isGenerating={isGenerating}
      />

      {/* Full Screen Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/90 backdrop-blur-sm p-4" onClick={closePreview}>
          <div 
            className="relative bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col md:flex-row animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Image Side */}
            <div className={`flex-1 ${CHECKERBOARD_CLASS} flex items-center justify-center p-8 min-h-[300px]`}>
              <img 
                src={previewImage.dataUrl} 
                alt={previewImage.prompt}
                className="max-w-full max-h-[70vh] object-contain drop-shadow-2xl"
              />
            </div>

            {/* Info Side */}
            <div className="w-full md:w-80 bg-white p-6 md:p-8 flex flex-col border-l border-stone-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-stone-900 mb-1">{t('sticker_details')}</h3>
                  <Badge variant="orange" size="md" className="uppercase tracking-wide">
                    {previewImage.styleName}
                  </Badge>
                </div>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X size={24} />}
                  aria-label={t('action_cancel')}
                  onClick={closePreview}
                  className="rounded-lg hover:bg-stone-100"
                />
              </div>

              <div className="flex-grow space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Prompt</label>
                  <p className="text-stone-700 leading-relaxed text-sm font-medium">
                    {previewImage.prompt}
                  </p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
                  <div className="flex items-center gap-2 text-xs font-black text-orange-800 uppercase tracking-wide mb-2">
                    <BadgeCheck size={14} />
                    {assetCopy.assetReadiness}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {getPreviewBadges(previewImage).map((badge) => (
                      <Badge key={badge} variant="orange-outline" size="sm">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-orange-800">
                    {getPreviewAssetNote(previewImage)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">{t('created')}</label>
                  <p className="text-stone-700 text-sm font-mono">
                    {new Date(previewImage.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-stone-50 border border-stone-100 p-2 text-center">
                    <FileImage size={15} className="mx-auto mb-1 text-stone-500" />
                    <p className="text-[10px] font-bold text-stone-500">PNG</p>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-100 p-2 text-center">
                    <Layers3 size={15} className="mx-auto mb-1 text-stone-500" />
                    <p className="text-[10px] font-bold text-stone-500">ZIP</p>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-100 p-2 text-center" title={assetCopy.apiTrust}>
                    <ShieldCheck size={15} className="mx-auto mb-1 text-stone-500" />
                    <p className="text-[10px] font-bold text-stone-500">BYOK</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 space-y-3">
                <a 
                  href={previewImage.dataUrl} 
                  download={`sticker-${previewImage.id}.png`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-200"
                >
                  <Download size={20} />
                  {t('download_png')}
                </a>
                
                <button
                   onClick={() => handleDeleteImage(previewImage.id)}
                   className="flex cursor-pointer items-center justify-center gap-2 w-full py-3 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-bold rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                >
                   <X size={20} />
                   {t('action_delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
