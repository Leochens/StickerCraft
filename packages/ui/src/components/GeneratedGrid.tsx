import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GeneratedImage, CropAdjustments } from '@stickercraft/core';
import StickerCard from './StickerCard';
import BeadPatternModal from './BeadPatternModal';
import {
  Archive,
  CheckSquare,
  Download,
  Grid3X3,
  Image,
  Layers3,
  LayoutPanelLeft,
  RefreshCw,
  Scissors,
  Sparkles,
  Square,
  Sticker,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import JSZip from 'jszip';
import { useLanguage } from '../contexts/LanguageContext';
import { STICKER_STYLES, PRESET_PROMPTS } from '@stickercraft/core';
import ConfirmDialog from './ConfirmDialog';
import CustomSelect from './ui/CustomSelect';
import Badge from './ui/Badge';
import IconButton from './ui/IconButton';
import { CHECKERBOARD_CLASS } from '../utils/uiClasses';
import { trackEvent } from '../services/analytics';

interface GeneratedGridProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  pendingQuantity?: number;
  onPreview: (image: GeneratedImage) => void;
  onDelete?: (id: string) => void;
  onDeleteMany?: (ids: string[]) => void;
  onRegenerate?: (image: GeneratedImage) => void;
  onRepairTransparency?: (image: GeneratedImage) => void;
  onSplitCollection?: (image: GeneratedImage) => boolean | void | Promise<boolean | void>;
  onManualSplitCollection?: (image: GeneratedImage, rows: number, columns: number) => void | Promise<void>;
  onCropCollectionItem?: (collectionId: string, itemId: string, adjustments: CropAdjustments) => void | Promise<void>;
  onDeleteCollectionItem?: (collectionId: string, itemId: string) => void;
  regeneratingIds?: Set<string>;
  transparencyRepairIds?: Set<string>;
  splittingCollectionIds?: Set<string>;
  onUploadImage?: (dataUrl: string, prompt: string, styleName: string) => void;
  onSwitchToCreate?: () => void;
}

type ImageTypeFilter = 'all' | 'single' | 'threeViews' | 'collection';

const ZERO_CROP: CropAdjustments = { top: 0, right: 0, bottom: 0, left: 0 };

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const inferGrid = (count: number) => {
  const safeCount = Math.max(2, Math.min(12, count || 6));
  const columns = Math.ceil(Math.sqrt(safeCount));
  return {
    rows: Math.ceil(safeCount / columns),
    columns,
  };
};

const GeneratedGrid: React.FC<GeneratedGridProps> = ({
  images,
  isGenerating,
  pendingQuantity = 1,
  onPreview,
  onDelete,
  onDeleteMany,
  onRegenerate,
  onRepairTransparency,
  onSplitCollection,
  onManualSplitCollection,
  onCropCollectionItem,
  onDeleteCollectionItem,
  regeneratingIds = new Set(),
  transparencyRepairIds = new Set(),
  splittingCollectionIds = new Set(),
  onUploadImage,
  onSwitchToCreate,
}) => {
  const { t, language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ImageTypeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<'auto' | 'manual'>('auto');
  const [manualRows, setManualRows] = useState(3);
  const [manualColumns, setManualColumns] = useState(3);
  const [cropTargetId, setCropTargetId] = useState<string | null>(null);
  const [cropAdjustments, setCropAdjustments] = useState<CropAdjustments>(ZERO_CROP);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isCollectionZipping, setIsCollectionZipping] = useState(false);
  const [beadPatternImage, setBeadPatternImage] = useState<GeneratedImage | null>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [uploadPrompt, setUploadPrompt] = useState('');
  const [uploadStyle, setUploadStyle] = useState(STICKER_STYLES[0].name);
  const [isCustomStyleInput, setIsCustomStyleInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageMatchesType = (image: GeneratedImage, type: ImageTypeFilter) => {
    if (type === 'all') return true;
    if (type === 'collection') return Boolean(image.isStickerCollection);
    if (type === 'threeViews') return Boolean(image.isThreeViews);
    return !image.isStickerCollection && !image.isThreeViews;
  };

  const typeFilteredImages = useMemo(() => (
    images.filter(image => imageMatchesType(image, selectedType))
  ), [images, selectedType]);

  const categories = useMemo(() => {
    const styles = new Set(typeFilteredImages.map(img => img.styleName));
    return ['All', ...Array.from(styles)];
  }, [typeFilteredImages]);

  const filteredImages = useMemo(() => {
    if (selectedCategory === 'All') return typeFilteredImages;
    return typeFilteredImages.filter(img => img.styleName === selectedCategory);
  }, [typeFilteredImages, selectedCategory]);

  const visibleIds = useMemo(() => filteredImages.map(image => image.id), [filteredImages]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const activeCollection = useMemo(
    () => images.find(image => image.id === activeCollectionId) || null,
    [images, activeCollectionId],
  );
  const collectionItems = activeCollection?.collectionItems || [];
  const cropTarget = collectionItems.find(item => item.id === cropTargetId) || null;
  const isCollectionBusy = Boolean(activeCollection && splittingCollectionIds.has(activeCollection.id));

  const copy = language === 'zh'
    ? {
        selectedReady: '已选择',
        visibleReady: '当前可见',
        deleteSelected: '删除',
        confirmDelete: (count: number) => `确定删除选中的 ${count} 张贴纸吗？`,
        noCategoryItems: '这个分类里还没有贴纸。',
        collectionTitle: '贴纸集合',
        splitOptions: '切分方式',
        autoSplit: '一键切分',
        autoSplitHint: '按透明像素和内容边界自动识别。',
        manualSplit: '手动切分',
        manualSplitHint: '设置宫格后，再按每格里的透明像素裁出贴纸。',
        rows: '行数',
        columns: '列数',
        splitResult: '拆分结果',
        downloadAll: '一键下载全部',
        zippingAll: '打包中...',
        splitEmpty: '还没有拆分结果。可以先选择一键切分，或设置宫格后手动切分。',
        manageCrop: '重裁切',
        applyCrop: '应用裁切',
        applyingCrop: '裁切中...',
        resetCrop: '重置',
        cropHint: '负数扩大边界，正数收紧边界。',
        cropEmpty: '选择一张拆分结果，右侧会显示重裁切预览和边界调整。',
        typeAll: '全部类型',
        typeSingle: '普通贴纸',
        typeThreeViews: '三视图',
        typeCollection: '贴纸集合',
        top: '上',
        right: '右',
        bottom: '下',
        left: '左',
        sourcePreview: '集合原图',
        pieces: '张',
      }
    : {
        selectedReady: 'selected',
        visibleReady: 'visible',
        deleteSelected: 'Delete',
        confirmDelete: (count: number) => `Delete ${count} selected stickers?`,
        noCategoryItems: 'No stickers found in this category.',
        collectionTitle: 'Sticker collection',
        splitOptions: 'Split mode',
        autoSplit: 'Auto split',
        autoSplitHint: 'Detects stickers from transparent pixels and content bounds.',
        manualSplit: 'Manual split',
        manualSplitHint: 'Set a grid, then crop each cell by its transparent pixels.',
        rows: 'Rows',
        columns: 'Columns',
        splitResult: 'Split results',
        downloadAll: 'Download all',
        zippingAll: 'Zipping...',
        splitEmpty: 'No split results yet. Use auto split, or set a grid and split manually.',
        manageCrop: 'Recrop',
        applyCrop: 'Apply crop',
        applyingCrop: 'Cropping...',
        resetCrop: 'Reset',
        cropHint: 'Negative expands the edge; positive trims it inward.',
        cropEmpty: 'Select a split result to show the recrop preview and edge controls here.',
        typeAll: 'All types',
        typeSingle: 'Single sticker',
        typeThreeViews: 'Three views',
        typeCollection: 'Sticker sets',
        top: 'Top',
        right: 'Right',
        bottom: 'Bottom',
        left: 'Left',
        sourcePreview: 'Source sheet',
        pieces: 'items',
      };

  const typeOptions: Array<{ value: ImageTypeFilter; label: string; icon: typeof Sticker }> = [
    { value: 'all', label: copy.typeAll, icon: Image },
    { value: 'single', label: copy.typeSingle, icon: Sticker },
    { value: 'threeViews', label: copy.typeThreeViews, icon: LayoutPanelLeft },
    { value: 'collection', label: copy.typeCollection, icon: Layers3 },
  ];

  const typeCounts = useMemo<Record<ImageTypeFilter, number>>(() => ({
    all: images.length,
    single: images.filter(image => imageMatchesType(image, 'single')).length,
    threeViews: images.filter(image => imageMatchesType(image, 'threeViews')).length,
    collection: images.filter(image => imageMatchesType(image, 'collection')).length,
  }), [images]);

  useEffect(() => {
    const imageIds = new Set(images.map(image => image.id));
    setSelectedIds(prev => {
      const next = new Set([...prev].filter(id => imageIds.has(id)));
      return next.size === prev.size ? prev : next;
    });

    if (activeCollectionId && !imageIds.has(activeCollectionId)) {
      setActiveCollectionId(null);
    }

    const beadPatternImageExists = beadPatternImage && images.some(image => (
      image.id === beadPatternImage.id ||
      image.collectionItems?.some(item => item.id === beadPatternImage.id)
    ));

    if (beadPatternImage && !beadPatternImageExists) {
      setBeadPatternImage(null);
    }
  }, [images, activeCollectionId, beadPatternImage]);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!activeCollection) return;

    const { rows, columns } = inferGrid(activeCollection.stickerCollectionCount || collectionItems.length || 6);
    setManualRows(rows);
    setManualColumns(columns);
    setSplitMode('auto');
    setCropTargetId(null);
    setCropAdjustments(ZERO_CROP);
  }, [activeCollectionId]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("stickers");
      const selectedImages = images.filter(img => selectedIds.has(img.id));
      const exportItems = selectedImages.flatMap((image, imageIndex) => {
        if (!image.collectionItems?.length) {
          return [{ image, filenamePrefix: `sticker_${imageIndex + 1}` }];
        }

        return image.collectionItems.map((item, itemIndex) => ({
          image: item,
          filenamePrefix: `collection_${imageIndex + 1}_sticker_${itemIndex + 1}`,
        }));
      });

      exportItems.forEach(({ image, filenamePrefix }) => {
        const base64Data = image.dataUrl.split(',')[1];
        const filename = `${filenamePrefix}_${image.styleName.replace(/\s+/g, '-').toLowerCase()}.png`;
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
      setSelectedIds(new Set());
      trackEvent('sticker_batch_downloaded', {
        selected_count: selectedImages.length,
        exported_count: exportItems.length,
      });
    } catch (error) {
      console.error("Failed to zip images", error);
      setZipError(t('zip_failed'));
    } finally {
      setIsZipping(false);
    }
  };

  const handleBatchDelete = () => {
    if (!onDeleteMany || selectedIds.size === 0) return;
    setConfirmDeleteOpen(true);
  };

  const executeBatchDelete = () => {
    if (!onDeleteMany) return;
    const ids = [...selectedIds];
    onDeleteMany(ids);
    setSelectedIds(new Set());
    setConfirmDeleteOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadFile(reader.result as string);
        setIsUploadModalOpen(true);
        setUploadPrompt(file.name.split('.')[0]);
      };
      reader.readAsDataURL(file);
    }

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

  const openCollection = (image: GeneratedImage) => {
    trackEvent('sticker_collection_opened', {
      split_count: image.collectionItems?.length || 0,
      expected_count: image.stickerCollectionCount || null,
    });
    setActiveCollectionId(image.id);
  };

  const openBeadPattern = (image: GeneratedImage, source: 'gallery_card' | 'collection_item') => {
    trackEvent('bead_pattern_opened', {
      source,
      image_type: image.sourceType === 'uploaded'
        ? 'uploaded'
        : image.isStickerCollection
          ? 'collection'
          : image.isThreeViews
            ? 'three_views'
            : 'single',
    });
    setBeadPatternImage(image);
  };

  const runAutoSplit = async () => {
    if (!activeCollection || !onSplitCollection) return;
    await onSplitCollection(activeCollection);
  };

  const runManualSplit = async () => {
    if (!activeCollection || !onManualSplitCollection) return;
    await onManualSplitCollection(activeCollection, manualRows, manualColumns);
  };

  const openCropEditor = (item: GeneratedImage) => {
    setCropTargetId(item.id);
    setCropAdjustments(item.splitSource?.cropAdjustments || ZERO_CROP);
  };

  const updateCropAdjustment = (key: keyof CropAdjustments, value: number) => {
    setCropAdjustments(prev => ({ ...prev, [key]: value }));
  };

  const applyCrop = async () => {
    if (!activeCollection || !cropTarget || !onCropCollectionItem) return;
    setIsApplyingCrop(true);

    try {
      await onCropCollectionItem(activeCollection.id, cropTarget.id, cropAdjustments);
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleDownloadCollectionItems = async () => {
    if (!activeCollection || collectionItems.length === 0) return;
    setIsCollectionZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("stickers");

      collectionItems.forEach((item, index) => {
        const base64Data = item.dataUrl.split(',')[1];
        const filename = `sticker_${index + 1}_${item.styleName.replace(/\s+/g, '-').toLowerCase()}.png`;
        folder?.file(filename, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sticker_collection_${activeCollection.id}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      trackEvent('sticker_collection_items_downloaded', {
        count: collectionItems.length,
        method: activeCollection.splitMethod || 'unknown',
      });
    } catch (error) {
      console.error("Failed to zip collection stickers", error);
      setZipError(t('zip_failed'));
    } finally {
      setIsCollectionZipping(false);
    }
  };

  const cropFrameStyle = useMemo(() => {
    const toInset = (value: number) => `${Math.max(0, Math.min(48, 14 + value))}%`;

    return {
      top: toInset(cropAdjustments.top),
      right: toInset(cropAdjustments.right),
      bottom: toInset(cropAdjustments.bottom),
      left: toInset(cropAdjustments.left),
    };
  }, [cropAdjustments]);

  const uploadStyleOptions = useMemo(() => {
    const styleNames = STICKER_STYLES.map((style) => style.name);
    const extraCategories = categories.filter(
      (category) => category !== 'All' && !styleNames.includes(category),
    );

    return [
      ...STICKER_STYLES.map((style) => ({ value: style.name, label: style.name })),
      ...extraCategories.map((category) => ({ value: category, label: category })),
    ];
  }, [categories]);

  const uploadModal = isUploadModalOpen && (
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
                {isCustomStyleInput ? t('pick_existing') : t('type_new')}
              </button>
            </div>

            {isCustomStyleInput ? (
              <input
                type="text"
                value={uploadStyle}
                onChange={(e) => setUploadStyle(e.target.value)}
                placeholder={t('upload_style_placeholder')}
                className="w-full p-2 border border-stone-200 rounded-lg focus:border-orange-400 outline-none text-sm"
              />
            ) : (
              <CustomSelect
                value={uploadStyle}
                onChange={setUploadStyle}
                options={uploadStyleOptions}
                ariaLabel={t('upload_image_classification')}
              />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="flex-1 cursor-pointer py-2 text-stone-500 font-bold hover:bg-stone-50 rounded-lg transition-colors duration-200"
            >
              {t('action_cancel')}
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
  );

  const collectionModal = activeCollection && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[min(96vw,1760px)] max-h-[94vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 p-5">
          <div>
            <div className="flex items-center gap-2 text-stone-900">
              <Layers3 size={22} className="text-orange-500" />
              <h3 className="text-xl font-black">{copy.collectionTitle}</h3>
            </div>
            <p className="mt-1 text-sm font-semibold text-stone-500 line-clamp-1">{activeCollection.prompt}</p>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            icon={<X size={22} />}
            aria-label={t('action_cancel')}
            onClick={() => setActiveCollectionId(null)}
            className="rounded-full"
          />
        </div>

        <div className={`grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[300px_minmax(0,1fr)] ${
          cropTarget
            ? '2xl:grid-cols-[300px_minmax(540px,1fr)_420px]'
            : '2xl:grid-cols-[320px_minmax(0,1fr)]'
        }`}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wide text-stone-500">{copy.sourcePreview}</span>
                <Badge variant="orange-outline" size="sm" className="font-black">
                  {collectionItems.length} {copy.pieces}
                </Badge>
              </div>
              <div className={`aspect-square rounded-xl ${CHECKERBOARD_CLASS} flex items-center justify-center p-3 overflow-hidden`}>
                <img src={activeCollection.dataUrl} alt={activeCollection.prompt} className="max-h-full max-w-full object-contain drop-shadow-xl" />
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-orange-800">
                <Scissors size={16} />
                {copy.splitOptions}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-orange-100 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMode('auto');
                      runAutoSplit();
                    }}
                    disabled={!onSplitCollection || isCollectionBusy}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      splitMode === 'auto'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-stone-500 hover:bg-orange-50 hover:text-orange-700'
                    }`}
                  >
                    {isCollectionBusy && splitMode === 'auto' ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {copy.autoSplit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('manual')}
                    disabled={isCollectionBusy}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      splitMode === 'manual'
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                    }`}
                  >
                    <Scissors size={15} />
                    {copy.manualSplit}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-orange-800/80">
                  {splitMode === 'auto' ? copy.autoSplitHint : copy.manualSplitHint}
                </p>

                {splitMode === 'manual' && (
                  <div className="rounded-xl border border-white bg-white/80 p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-stone-500">{copy.rows}</span>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={manualRows}
                          onChange={(event) => setManualRows(Math.max(1, Math.min(6, Number(event.target.value) || 1)))}
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700 outline-none focus:border-orange-400"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wide text-stone-500">{copy.columns}</span>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={manualColumns}
                          onChange={(event) => setManualColumns(Math.max(1, Math.min(6, Number(event.target.value) || 1)))}
                          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold text-stone-700 outline-none focus:border-orange-400"
                        />
                      </label>
                    </div>
                    <button
                      onClick={runManualSplit}
                      disabled={!onManualSplitCollection || isCollectionBusy}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCollectionBusy ? <RefreshCw size={16} className="animate-spin" /> : <Scissors size={16} />}
                      {copy.manualSplit}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wide text-stone-700">{copy.splitResult}</h4>
                <p className="text-xs font-semibold text-stone-400">{collectionItems.length} {copy.pieces}</p>
              </div>
              {collectionItems.length > 0 && (
                <button
                  onClick={handleDownloadCollectionItems}
                  disabled={isCollectionZipping}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCollectionZipping ? <RefreshCw size={14} className="animate-spin" /> : <Archive size={14} />}
                  {isCollectionZipping ? copy.zippingAll : copy.downloadAll}
                </button>
              )}
            </div>

            {collectionItems.length > 0 ? (
              <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${
                cropTarget ? 'xl:grid-cols-3 2xl:grid-cols-4' : 'xl:grid-cols-4 2xl:grid-cols-5'
              }`}>
                {collectionItems.map((item, index) => (
                  <div key={item.id} className="group overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-shadow hover:shadow-lg">
                    <button
                      onClick={() => openCropEditor(item)}
                      className={`aspect-square w-full ${CHECKERBOARD_CLASS} flex items-center justify-center p-3`}
                    >
                      <img src={item.dataUrl} alt={`${item.prompt} ${index + 1}`} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                    </button>
                    <div className="flex items-center justify-between gap-2 border-t border-stone-50 p-2">
                      <Badge variant="neutral" size="sm" className="font-black">
                        #{item.splitIndex || index + 1}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <IconButton
                          variant="default"
                          size="sm"
                          icon={<Scissors size={14} />}
                          aria-label={copy.manageCrop}
                          title={copy.manageCrop}
                          onClick={() => openCropEditor(item)}
                          className="p-1.5"
                        />
                        <IconButton
                          variant="default"
                          size="sm"
                          icon={<Download size={14} />}
                          aria-label={t('download_png')}
                          title={t('download_png')}
                          onClick={() => {
                            downloadDataUrl(item.dataUrl, `sticker-${item.id}.png`);
                            trackEvent('sticker_collection_item_downloaded', {
                              method: activeCollection.splitMethod || 'unknown',
                              item_index: item.splitIndex || index + 1,
                            });
                          }}
                          className="p-1.5"
                        />
                        <IconButton
                          variant="default"
                          size="sm"
                          icon={<Grid3X3 size={14} />}
                          aria-label={language === 'zh' ? '拼豆图纸' : 'Bead pattern'}
                          title={language === 'zh' ? '拼豆图纸' : 'Bead pattern'}
                          onClick={() => openBeadPattern(item, 'collection_item')}
                          className="p-1.5 hover:bg-cyan-50 hover:text-cyan-700"
                        />
                        {onDeleteCollectionItem && (
                          <IconButton
                            variant="rose"
                            size="sm"
                            icon={<Trash2 size={14} />}
                            aria-label={t('action_delete')}
                            title={t('action_delete')}
                            onClick={() => onDeleteCollectionItem(activeCollection.id, item.id)}
                            className="p-1.5 bg-transparent shadow-none scale-100 hover:scale-100"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/70 p-8 text-center">
                <Layers3 size={40} className="mb-3 text-stone-300" />
                <p className="max-w-sm text-sm font-semibold leading-relaxed text-stone-500">{copy.splitEmpty}</p>
              </div>
            )}
          </div>

          {cropTarget && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 2xl:self-start">
              <>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-orange-900">{copy.manageCrop} #{cropTarget.splitIndex || collectionItems.indexOf(cropTarget) + 1}</h4>
                    <p className="text-xs font-semibold text-orange-800/70">{copy.cropHint}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCropAdjustments(ZERO_CROP);
                    }}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-stone-500 border border-stone-200 hover:text-orange-600"
                  >
                    {copy.resetCrop}
                  </button>
                </div>

                <div className={`relative aspect-square overflow-hidden rounded-2xl ${CHECKERBOARD_CLASS} flex items-center justify-center p-4`}>
                  <img src={cropTarget.dataUrl} alt={cropTarget.prompt} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                  <div className="pointer-events-none absolute inset-0 bg-stone-900/5"></div>
                  <div
                    className="pointer-events-none absolute rounded-xl border-2 border-dashed border-orange-500 bg-orange-500/10 shadow-[0_0_0_999px_rgba(28,25,23,0.14)] transition-all duration-150"
                    style={cropFrameStyle}
                  ></div>
                </div>

                <div className="mt-4 space-y-3">
                  {([
                    ['top', copy.top],
                    ['right', copy.right],
                    ['bottom', copy.bottom],
                    ['left', copy.left],
                  ] as Array<[keyof CropAdjustments, string]>).map(([key, label]) => (
                    <label key={key} className="grid grid-cols-[32px_1fr_48px] items-center gap-3 text-xs font-black text-stone-600">
                      <span>{label}</span>
                      <input
                        type="range"
                        min={-35}
                        max={35}
                        step={1}
                        value={cropAdjustments[key]}
                        onChange={(event) => updateCropAdjustment(key, Number(event.target.value))}
                        className="accent-orange-500"
                      />
                      <span className="text-right font-mono text-stone-500">{cropAdjustments[key]}%</span>
                    </label>
                  ))}
                  <button
                    onClick={applyCrop}
                    disabled={!onCropCollectionItem || isApplyingCrop}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApplyingCrop ? <RefreshCw size={16} className="animate-spin" /> : <Scissors size={16} />}
                    {isApplyingCrop ? copy.applyingCrop : copy.applyCrop}
                  </button>
                </div>
              </>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (images.length === 0 && !isGenerating && !isUploadModalOpen) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-3xl border-2 border-dashed border-stone-200 bg-white/50 min-h-[400px]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-50 text-orange-300 mb-6">
          <Image size={40} />
        </div>
        <h3 className="text-2xl font-black text-stone-700 mb-3">{t('empty_gallery_title')}</h3>
        <p className="text-stone-600 max-w-sm mx-auto leading-relaxed mb-6">
          {t('empty_gallery_desc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            type="button"
            onClick={() => {
              const preset = PRESET_PROMPTS[language]?.[0] ?? PRESET_PROMPTS.en[0];
              window.dispatchEvent(new CustomEvent('stickerCraft:fill-preset', { detail: preset }));
              trackEvent('prompt_preset_used', {
                language,
                source: 'empty_gallery',
              });
              onSwitchToCreate?.();
            }}
            className="cursor-pointer bg-orange-500 text-white font-bold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            <Sparkles size={16} />
            {t('empty_try_preset')}
          </button>
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
              className="cursor-pointer bg-white border border-stone-200 text-stone-600 font-bold px-4 py-2 rounded-xl hover:bg-stone-50 transition-colors duration-200 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
            >
              <Upload size={16} />
              {t('upload_image_title')}
            </button>
          </div>
        )}
        </div>
        {uploadModal}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20">
      {zipError && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between gap-3 animate-fade-in">
          <span>{zipError}</span>
          <button
            type="button"
            onClick={() => setZipError(null)}
            className="cursor-pointer rounded-lg p-1 text-rose-500 hover:bg-rose-100 transition-colors duration-200"
            aria-label={t('action_cancel')}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-1 shadow-sm lg:w-auto">
          {typeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = selectedType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedType(option.value)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-black transition-all lg:flex-none ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-500 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <Icon size={14} />
                <span className="truncate">{option.label}</span>
                <Badge variant={isActive ? 'count-active' : 'count'} size="xs" className="font-black">
                  {typeCounts[option.value]}
                </Badge>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                  {typeFilteredImages.filter(i => i.styleName === cat).length}
                </span>
              )}
            </button>
          ))}

          {onUploadImage && (
            <div className="relative ml-1">
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

          {filteredImages.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allVisibleSelected ? t('deselect_all') : t('select_all')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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

        {filteredImages.map((img) => (
          <StickerCard
            key={img.id}
            image={img}
            onPreview={onPreview}
            onDelete={onDelete}
            onRegenerate={onRegenerate}
            onRepairTransparency={onRepairTransparency}
            onSplitCollection={onSplitCollection}
            onOpenCollection={openCollection}
            onOpenBeadPattern={(image) => openBeadPattern(image, 'gallery_card')}
            isSelected={selectedIds.has(img.id)}
            onToggleSelection={toggleSelection}
            selectionMode={selectedIds.size > 0}
            isRegenerating={regeneratingIds.has(img.id)}
            isRepairingTransparency={transparencyRepairIds.has(img.id)}
            isSplittingCollection={splittingCollectionIds.has(img.id)}
          />
        ))}

        {filteredImages.length === 0 && !isGenerating && (
          <div className="col-span-full py-12 text-center text-stone-400 font-medium">
            {copy.noCategoryItems}
          </div>
        )}
      </div>

      <div className={`
        fixed bottom-6 left-1/2 md:left-[calc(50%-200px)] transform -translate-x-1/2 z-30
        transition-all duration-300 ease-in-out
        ${selectedIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}
      `}>
        <div className="bg-stone-900 text-white rounded-full shadow-2xl px-4 py-3 flex items-center gap-3 border border-stone-700">
          <span className="font-bold text-sm whitespace-nowrap">
            {selectedIds.size} {t('selected')}
          </span>
          <div className="h-6 w-px bg-stone-700"></div>
          {onDeleteMany && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-2 font-bold text-sm bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-full transition-all"
            >
              <Trash2 size={16} />
              {copy.deleteSelected}
            </button>
          )}
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

      {uploadModal}
      {collectionModal}
      {beadPatternImage && (
        <BeadPatternModal
          image={beadPatternImage}
          onClose={() => setBeadPatternImage(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title={t('confirm_delete_title')}
        message={t('confirm_delete_body').replace('{count}', String(selectedIds.size))}
        confirmLabel={t('action_delete')}
        variant="danger"
        onConfirm={executeBatchDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default GeneratedGrid;
