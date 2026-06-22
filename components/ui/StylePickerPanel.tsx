import React, { RefObject } from 'react';
import { Palette } from 'lucide-react';
import { StickerStyle } from '../../types';
import Badge from './Badge';
import DropdownPortal from './DropdownPortal';
import StylePickerCard from './StylePickerCard';

interface StylePickerPanelProps {
  isOpen: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  styles: StickerStyle[];
  selectedStyleId: string;
  onSelect: (styleId: string) => void;
  language: string;
  title: string;
  customCountLabel?: string;
}

const StylePickerPanel: React.FC<StylePickerPanelProps> = ({
  isOpen,
  anchorRef,
  onClose,
  styles,
  selectedStyleId,
  onSelect,
  language,
  title,
  customCountLabel,
}) => (
  <DropdownPortal
    isOpen={isOpen}
    anchorRef={anchorRef}
    onClose={onClose}
    maxHeight={360}
    elevated
    className="
      flex flex-col overflow-hidden rounded-2xl
      border border-white/90 bg-gradient-to-b from-white via-white to-orange-50/40
      shadow-[0_4px_6px_rgba(0,0,0,0.04),0_12px_28px_rgba(0,0,0,0.10),0_0_0_1px_rgba(249,115,22,0.06)]
      ring-1 ring-stone-200/50 backdrop-blur-xl animate-fade-in
    "
  >
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-orange-100/70 bg-white/85 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
          <Palette size={13} strokeWidth={2.5} />
        </span>
        <span className="truncate text-[11px] font-black uppercase tracking-wider text-stone-600">
          {title}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {customCountLabel && (
          <Badge variant="orange-outline" size="xs" className="font-semibold">
            {customCountLabel}
          </Badge>
        )}
        <Badge variant="count" size="xs" className="font-black tabular-nums">
          {styles.length}
        </Badge>
      </div>
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-3">
      <div className="grid grid-cols-2 gap-2.5">
        {styles.map((style) => {
          const displayName = language === 'zh' && style.label_zh ? style.label_zh : style.name;
          const showEnglishName = Boolean(language === 'zh' && style.label_zh && style.label_zh !== style.name);

          return (
            <StylePickerCard
              key={style.id}
              style={style}
              selected={selectedStyleId === style.id}
              displayName={displayName}
              showEnglishName={showEnglishName}
              onSelect={() => onSelect(style.id)}
            />
          );
        })}
      </div>
    </div>
  </DropdownPortal>
);

export default StylePickerPanel;
