import React from 'react';
import { Download, Maximize2, Check, RefreshCw, Scissors, Eraser, Trash2, Layers3 } from 'lucide-react';
import { GeneratedImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface StickerCardProps {
  image: GeneratedImage;
  onPreview: (image: GeneratedImage) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
  selectionMode?: boolean;
  onRegenerate?: (image: GeneratedImage) => void;
  onRepairTransparency?: (image: GeneratedImage) => void;
  onSplitCollection?: (image: GeneratedImage) => boolean | void | Promise<boolean | void>;
  onOpenCollection?: (image: GeneratedImage) => void;
  onDelete?: (id: string) => void;
  isRegenerating?: boolean;
  isRepairingTransparency?: boolean;
  isSplittingCollection?: boolean;
}

const StickerCard: React.FC<StickerCardProps> = ({ 
  image, 
  onPreview, 
  isSelected = false, 
  onToggleSelection,
  selectionMode = false,
  onRegenerate,
  onRepairTransparency,
  onSplitCollection,
  onOpenCollection,
  onDelete,
  isRegenerating = false,
  isRepairingTransparency = false,
  isSplittingCollection = false
}) => {
  const { language } = useLanguage();
  const isBusy = isRegenerating || isRepairingTransparency || isSplittingCollection;
  const splitItemCount = image.collectionItems?.length || 0;
  const isCollectionStack = Boolean(image.isStickerCollection && splitItemCount > 0);

  const copy = language === 'zh'
    ? {
        transparent: '透明 PNG',
        backgroundKept: '保留背景',
        uploaded: '上传素材',
        whiteBorder: '白边',
        noBorder: '无白边',
        text: '文字',
        reference: '参考图',
        repairTransparent: '修复透明',
        splitCollection: '一键切分',
        manageCollection: '切分管理',
        splitReady: '已切分',
        regenerate: '重新生成',
        download: '下载 PNG',
        preview: '预览大图',
        delete: '删除',
        regenerating: '重绘中...',
        repairing: '修复中...',
        splitting: '切分中...',
      }
    : {
        transparent: 'Transparent PNG',
        backgroundKept: 'Background kept',
        uploaded: 'Uploaded asset',
        whiteBorder: 'White border',
        noBorder: 'No border',
        text: 'Text',
        reference: 'Reference',
        repairTransparent: 'Fix transparency',
        splitCollection: 'Split stickers',
        manageCollection: 'Manage split',
        splitReady: 'split',
        regenerate: 'Regenerate',
        download: 'Download PNG',
        preview: 'Preview',
        delete: 'Delete',
        regenerating: 'Remixing...',
        repairing: 'Repairing...',
        splitting: 'Splitting...',
      };

  const busyLabel = isSplittingCollection
    ? copy.splitting
    : isRepairingTransparency
      ? copy.repairing
      : copy.regenerating;

  const assetBadges = [
    image.sourceType === 'uploaded'
      ? copy.uploaded
      : image.backgroundRemoved === false
        ? copy.backgroundKept
        : copy.transparent,
  ];

  if (image.sourceType !== 'uploaded') {
    assetBadges.push(image.hasStickerBorder ? copy.whiteBorder : copy.noBorder);
  }
  if (image.hasText) assetBadges.push(copy.text);
  if (image.hasReferenceImage) assetBadges.push(copy.reference);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `sticker-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCardClick = () => {
    if (selectionMode && onToggleSelection) {
      onToggleSelection(image.id);
    } else if (image.isStickerCollection && onOpenCollection) {
      onOpenCollection(image);
    } else {
      onPreview(image);
    }
  };

  const handleCollectionAction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (splitItemCount > 0) {
      onOpenCollection?.(image);
      return;
    }

    if (onSplitCollection) {
      const didSplit = await onSplitCollection(image);
      if (didSplit !== false) {
        onOpenCollection?.(image);
      }
      return;
    }

    onOpenCollection?.(image);
  };

  const tooltipClass = "pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-black text-white opacity-0 shadow-lg transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100";

  return (
    <div 
      className={`
        group relative isolate bg-white rounded-2xl shadow-sm transition-all duration-300 border cursor-pointer
        ${isCollectionStack ? 'overflow-visible' : 'overflow-hidden'}
        ${isSelected 
          ? 'ring-2 ring-orange-500 border-orange-500 transform scale-[0.98]' 
          : 'border-stone-100 hover:shadow-xl hover:-translate-y-1'
        }
      `}
      onClick={handleCardClick}
    >
      {isCollectionStack && (
        <>
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-orange-100 bg-white shadow-sm -z-10"></div>
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl border border-orange-50 bg-white/90 shadow-sm -z-20"></div>
        </>
      )}

      {/* Loading Overlay for Regeneration */}
      {isBusy && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center">
             <div className="flex flex-col items-center gap-2">
                 <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                 <span className="text-xs font-bold text-orange-600 animate-pulse">{busyLabel}</span>
             </div>
        </div>
      )}

      {/* Selection Checkbox */}
      {onToggleSelection && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection(image.id);
          }}
          className={`
            absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
            ${isSelected 
              ? 'bg-orange-500 border-orange-500 scale-100' 
              : 'bg-white/90 border-stone-300 group-hover:border-orange-400 opacity-0 group-hover:opacity-100 scale-90' 
            }
            ${selectionMode ? 'opacity-100 scale-100' : ''} 
          `}
        >
          {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-stone-50 flex items-center justify-center p-4">
        <img 
          src={image.dataUrl} 
          alt={image.prompt} 
          className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {image.isStickerCollection && (
          <div className="absolute top-3 right-14 inline-flex max-w-[calc(100%-4.5rem)] items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black text-orange-700 shadow-sm border border-orange-100">
            <Layers3 size={13} />
            <span className="truncate">{splitItemCount > 0 ? `${splitItemCount} ${copy.splitReady}` : copy.splitCollection}</span>
          </div>
        )}
        
        {/* Overlay Actions */}
        {!selectionMode && !isBusy && (
          <div className="absolute inset-0 bg-transparent transition-opacity duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 pointer-events-none">
             {/* Top Right Actions: Delete */}
             <div className="flex justify-end pointer-events-auto">
                 {onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
                        className="group/tooltip relative rounded-full bg-white p-2 text-stone-400 shadow-sm transition-all scale-90 hover:scale-100 hover:bg-rose-50 hover:text-rose-500 hover:shadow-md"
                        aria-label={copy.delete}
                        title={copy.delete}
                    >
                        <Trash2 size={16} />
                        <span className={`${tooltipClass} -left-3 translate-x-0`}>{copy.delete}</span>
                    </button>
                 )}
             </div>

             {/* Bottom Actions */}
             <div className="pointer-events-auto flex justify-center">
               <div className="flex translate-y-2 scale-95 items-center justify-center gap-1.5 rounded-full border border-white/80 bg-white/95 p-1 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100">
                 {onRepairTransparency && (
                   <button
                     onClick={(e) => { e.stopPropagation(); onRepairTransparency(image); }}
                     className="group/tooltip relative inline-flex h-8 w-8 items-center justify-center rounded-full text-emerald-700 transition-all hover:bg-emerald-50 hover:text-emerald-900"
                     aria-label={copy.repairTransparent}
                     title={copy.repairTransparent}
                   >
                     <Eraser size={15} />
                     <span className={tooltipClass}>{copy.repairTransparent}</span>
                   </button>
                 )}
                 {image.isStickerCollection && (onOpenCollection || onSplitCollection) && (
                   <button
                     onClick={handleCollectionAction}
                     className="group/tooltip relative inline-flex h-8 w-8 items-center justify-center rounded-full text-indigo-700 transition-all hover:bg-indigo-50 hover:text-indigo-900"
                     aria-label={splitItemCount > 0 ? copy.manageCollection : copy.splitCollection}
                     title={splitItemCount > 0 ? copy.manageCollection : copy.splitCollection}
                   >
                     <Scissors size={15} />
                     <span className={tooltipClass}>{splitItemCount > 0 ? copy.manageCollection : copy.splitCollection}</span>
                   </button>
                 )}
                 {onRegenerate && (
                   <button
                     onClick={(e) => { e.stopPropagation(); onRegenerate(image); }}
                     className="group/tooltip relative inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                     aria-label={copy.regenerate}
                     title={copy.regenerate}
                   >
                     <RefreshCw size={15} />
                     <span className={tooltipClass}>{copy.regenerate}</span>
                   </button>
                 )}
                 <button
                   onClick={handleDownload}
                   className="group/tooltip relative inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                   aria-label={copy.download}
                   title={copy.download}
                 >
                   <Download size={15} />
                   <span className={tooltipClass}>{copy.download}</span>
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     onPreview(image);
                   }}
                   className="group/tooltip relative inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                   aria-label={copy.preview}
                   title={copy.preview}
                 >
                   <Maximize2 size={15} />
                   <span className={tooltipClass}>{copy.preview}</span>
                 </button>
             </div>
             </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className={`rounded-b-2xl p-3 bg-white border-t border-stone-50 ${isSelected ? 'bg-orange-50/30' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 truncate max-w-[70%]">
            {image.styleName}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">
            {new Date(image.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-stone-600 font-semibold truncate" title={image.prompt}>
          {image.prompt}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {assetBadges.slice(0, 3).map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[9px] font-bold text-stone-500"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StickerCard;
