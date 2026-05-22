import React from 'react';
import { Download, Maximize2, Check, RefreshCw, Scissors, Sparkles, Trash2 } from 'lucide-react';
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
  onSplitCollection?: (image: GeneratedImage) => void;
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
  onDelete,
  isRegenerating = false,
  isRepairingTransparency = false,
  isSplittingCollection = false
}) => {
  const { t, language } = useLanguage();
  const isBusy = isRegenerating || isRepairingTransparency || isSplittingCollection;

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
    if (onToggleSelection) {
      onToggleSelection(image.id);
    } else {
      onPreview(image);
    }
  };

  return (
    <div 
      className={`
        group relative bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-300 border cursor-pointer
        ${isSelected 
          ? 'ring-2 ring-orange-500 border-orange-500 transform scale-[0.98]' 
          : 'border-stone-100 hover:shadow-xl hover:-translate-y-1'
        }
      `}
      onClick={handleCardClick}
    >
      {/* Loading Overlay for Regeneration */}
      {isBusy && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
             <div className="flex flex-col items-center gap-2">
                 <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                 <span className="text-xs font-bold text-orange-600 animate-pulse">{busyLabel}</span>
             </div>
        </div>
      )}

      {/* Selection Checkbox */}
      {onToggleSelection && (
        <div 
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
      <div className="relative aspect-square w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-stone-50 flex items-center justify-center p-4">
        <img 
          src={image.dataUrl} 
          alt={image.prompt} 
          className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay Actions */}
        {!selectionMode && !isBusy && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 pointer-events-none">
             {/* Top Right Actions: Delete */}
             <div className="flex justify-end pointer-events-auto">
                 {onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
                        className="bg-white text-stone-400 hover:text-rose-500 p-2 rounded-full shadow-sm hover:shadow-md transition-all scale-90 hover:scale-100"
                        title={t('action_delete')}
                    >
                        <Trash2 size={16} />
                    </button>
                 )}
             </div>

             {/* Bottom Actions: Repair/Split plus compact utility buttons */}
             <div className="pointer-events-auto scale-90 translate-y-2 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 space-y-2">
               <div className="flex flex-wrap justify-end gap-2">
                 {onRepairTransparency && (
                   <button
                     onClick={(e) => { e.stopPropagation(); onRepairTransparency(image); }}
                     className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-black text-emerald-700 shadow-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                     title={copy.repairTransparent}
                   >
                     <Sparkles size={14} />
                     {copy.repairTransparent}
                   </button>
                 )}
                 {image.isStickerCollection && onSplitCollection && (
                   <button
                     onClick={(e) => { e.stopPropagation(); onSplitCollection(image); }}
                     className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[11px] font-black text-indigo-700 shadow-lg hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
                     title={copy.splitCollection}
                   >
                     <Scissors size={14} />
                     {copy.splitCollection}
                   </button>
                 )}
               </div>
               <div className="flex gap-2 justify-end">
                 {onRegenerate && (
                     <button
                       onClick={(e) => { e.stopPropagation(); onRegenerate(image); }}
                       className="bg-white text-stone-700 p-2 rounded-full shadow-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                       title={t('action_regenerate')}
                     >
                       <RefreshCw size={16} />
                     </button>
                 )}
                 <button
                   onClick={handleDownload}
                   className="bg-white text-stone-700 p-2 rounded-full shadow-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                   title="Download"
                 >
                   <Download size={16} />
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     onPreview(image);
                   }}
                   className="bg-white text-stone-700 p-2 rounded-full shadow-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                   title="Expand"
                 >
                   <Maximize2 size={16} />
                 </button>
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className={`p-3 bg-white border-t border-stone-50 ${isSelected ? 'bg-orange-50/30' : ''}`}>
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
