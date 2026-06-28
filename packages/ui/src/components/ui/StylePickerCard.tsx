import React from 'react';
import { Check } from 'lucide-react';
import { StickerStyle } from '@stickercraft/core';
import { getStylePreviewImage } from '../../utils/stylePreview';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

interface StylePickerCardProps {
  style: StickerStyle;
  selected: boolean;
  displayName: string;
  showEnglishName: boolean;
  onSelect: () => void;
}

const StylePickerCard: React.FC<StylePickerCardProps> = ({
  style,
  selected,
  displayName,
  showEnglishName,
  onSelect,
}) => {
  const previewImage = getStylePreviewImage(style);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`
        group flex min-h-[136px] flex-col rounded-2xl border p-2.5 text-left transition-all duration-200
        hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md hover:shadow-orange-100/50
        ${FOCUS_RING_CLASS}
        ${selected
        ? 'border-orange-400 bg-gradient-to-b from-orange-50 to-white shadow-md shadow-orange-100/60 ring-2 ring-orange-200/70'
        : 'border-stone-100/80 bg-white/90 hover:bg-orange-50/40'
      }
    `}
  >
    <div
      className={`
        relative mb-2.5 aspect-[3/2] w-full overflow-hidden rounded-xl ring-1 ring-black/5
        ${previewImage ? 'bg-stone-100' : `${style.previewColor} shadow-inner`}
      `}
    >
      {previewImage ? (
        <>
          <img
            src={previewImage}
            alt={style.name}
            className="h-full w-full object-contain object-center"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10" />
        </>
      ) : (
        <>
          <div className={`absolute inset-0 ${style.previewColor}`} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/10" />
          <div className="absolute inset-x-2 bottom-1.5 h-1 rounded-full bg-white/25 blur-[1px]" />
        </>
      )}
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm ring-2 ring-white">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </div>

    <span
      className={`block truncate text-[11px] font-black leading-tight ${
        selected ? 'text-orange-700' : 'text-stone-800 group-hover:text-orange-700'
      }`}
    >
      {displayName}
    </span>
    {showEnglishName && (
      <span className="mt-0.5 block truncate text-[10px] font-semibold text-stone-400">
        {style.name}
      </span>
    )}
  </button>
  );
};

export default StylePickerCard;
