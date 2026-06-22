import React from 'react';
import { Download, Maximize2, Check, RefreshCw, Scissors, Eraser, Trash2, Layers3 } from 'lucide-react';
import { GeneratedImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { CHECKERBOARD_CLASS } from '../utils/uiClasses';
import Badge from './ui/Badge';
import IconButton from './ui/IconButton';

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
  isSplittingCollection = false,
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

  return (
    <div
      className={`
        group relative isolate bg-white rounded-2xl shadow-sm transition-shadow duration-200 border cursor-pointer
        ${isCollectionStack ? 'overflow-visible' : 'overflow-hidden'}
        ${isSelected
          ? 'ring-2 ring-orange-500 border-orange-500'
          : 'border-stone-100 hover:shadow-xl hover:border-orange-200'
        }
      `}
      onClick={handleCardClick}
    >
      {isCollectionStack && (
        <>
          <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-orange-100 bg-white shadow-sm -z-10" />
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl border border-orange-50 bg-white/90 shadow-sm -z-20" />
        </>
      )}

      {isBusy && (
        <div className="absolute inset-0 z-20 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
            <span className="text-xs font-bold text-orange-600 animate-pulse">{busyLabel}</span>
          </div>
        </div>
      )}

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

      <div className={`relative aspect-square w-full overflow-hidden rounded-t-2xl ${CHECKERBOARD_CLASS} flex items-center justify-center p-4`}>
        <img
          src={image.dataUrl}
          alt={image.prompt}
          className="max-w-full max-h-full object-contain drop-shadow-xl transition-opacity duration-200 group-hover:opacity-95"
          loading="lazy"
        />
        {image.isStickerCollection && (
          <Badge
            variant="overlay"
            size="sm"
            icon={<Layers3 size={13} />}
            className="absolute top-3 right-14 max-w-[calc(100%-4.5rem)] font-black"
          >
            {splitItemCount > 0 ? `${splitItemCount} ${copy.splitReady}` : copy.splitCollection}
          </Badge>
        )}

        {!selectionMode && !isBusy && (
          <div className="absolute inset-0 bg-transparent transition-opacity duration-300 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 pointer-events-none">
            <div className="flex justify-end pointer-events-auto">
              {onDelete && (
                <IconButton
                  variant="rose"
                  size="sm"
                  icon={<Trash2 size={16} />}
                  tooltip={copy.delete}
                  tooltipClassName="-left-3 translate-x-0"
                  aria-label={copy.delete}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image.id);
                  }}
                />
              )}
            </div>

            <div className="pointer-events-auto flex justify-center">
              <div className="flex translate-y-2 scale-95 items-center justify-center gap-1.5 rounded-full border border-white/80 bg-white/95 p-1 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:scale-100">
                {onRepairTransparency && (
                  <IconButton
                    variant="emerald"
                    icon={<Eraser size={15} />}
                    tooltip={copy.repairTransparent}
                    aria-label={copy.repairTransparent}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRepairTransparency(image);
                    }}
                  />
                )}
                {image.isStickerCollection && (onOpenCollection || onSplitCollection) && (
                  <IconButton
                    variant="indigo"
                    icon={<Scissors size={15} />}
                    tooltip={splitItemCount > 0 ? copy.manageCollection : copy.splitCollection}
                    aria-label={splitItemCount > 0 ? copy.manageCollection : copy.splitCollection}
                    onClick={handleCollectionAction}
                  />
                )}
                {onRegenerate && (
                  <IconButton
                    variant="default"
                    className="hover:bg-indigo-50 hover:text-indigo-600"
                    icon={<RefreshCw size={15} />}
                    tooltip={copy.regenerate}
                    aria-label={copy.regenerate}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate(image);
                    }}
                  />
                )}
                <IconButton
                  variant="default"
                  icon={<Download size={15} />}
                  tooltip={copy.download}
                  aria-label={copy.download}
                  onClick={handleDownload}
                />
                <IconButton
                  variant="default"
                  icon={<Maximize2 size={15} />}
                  tooltip={copy.preview}
                  aria-label={copy.preview}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(image);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`rounded-b-2xl p-3 bg-white border-t border-stone-50 ${isSelected ? 'bg-orange-50/30' : ''}`}>
        <div className="flex items-center justify-between mb-1">
          <Badge variant="orange" shape="rounded" className="max-w-[70%]">
            {image.styleName}
          </Badge>
          <span className="text-[11px] text-stone-500 font-mono">
            {new Date(image.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-stone-600 font-semibold truncate" title={image.prompt}>
          {image.prompt}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {assetBadges.slice(0, 3).map((badge) => (
            <Badge key={badge} variant="neutral">
              {badge}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StickerCard;
