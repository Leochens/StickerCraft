import React, { useState } from 'react';
import { ChevronDown, Eraser, Grid3X3, HelpCircle, Layers3, PackageCheck, Sparkles, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type HelpItem = {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  body: string;
  tag: string;
};

type HelpGroup = {
  id: string;
  title: string;
  items: HelpItem[];
};

interface GalleryHelpRailProps {
  isCollapsed: boolean;
  onCollapsedChange: (isCollapsed: boolean) => void;
}

const GalleryHelpRail: React.FC<GalleryHelpRailProps> = ({ isCollapsed, onCollapsedChange }) => {
  const { language } = useLanguage();
  const [activeItemByGroup, setActiveItemByGroup] = useState<Record<string, string>>({
    beads: 'beads-upload',
    export: 'bead-export',
  });

  const copy = language === 'zh'
      ? {
        title: '使用帮助',
        subtitle: '一些容易忽略但很实用的工作流提示。',
        collapseLabel: '收起使用帮助',
        expandLabel: '展开使用帮助',
        groups: [
          {
            id: 'beads',
            title: '拼豆',
            items: [
              {
                id: 'beads-upload',
                icon: Upload,
                title: '上传图片也能做拼豆吗？',
                body: '可以。先点图库里的上传按钮，把已有 PNG/JPG 放进图库；上传完成后，在这张图的卡片上点网格图标，就能生成拼豆图纸。透明 PNG 会更适合，因为系统能忽略透明背景，只保留主体。',
                tag: '上传',
              },
              {
                id: 'beads',
                icon: Grid3X3,
                title: '拼豆图纸怎么用？',
                body: '在贴纸卡片上点网格图标，选择 Artkal、Hama、Perler 等色板，再调图纸宽度和最大颜色数。图纸主显示品牌色号，因为真正制作时要按色号买豆、摆豆；Hex 只是参考色值。',
                tag: '拼豆',
              },
              {
                id: 'prompt',
                icon: Sparkles,
                title: '什么图片更适合转拼豆？',
                body: '拼豆更适合主体清晰、正面、边缘干净、颜色块明确的图片。复杂发光、玻璃、烟雾和毛发会让透明处理与拼豆色彩映射更难。',
                tag: '素材',
              },
            ],
          },
          {
            id: 'export',
            title: '导出',
            items: [
              {
                id: 'bead-export',
                icon: PackageCheck,
                title: '拼豆导出看什么？',
                body: 'PNG 适合直接照着摆，CSV 适合整理采购清单。CSV 里会包含色号、颜色名、参考 Hex 和数量，但正式购买前建议核对实物色卡。',
                tag: '拼豆',
              },
              {
                id: 'zip-export',
                icon: PackageCheck,
                title: '什么时候用 ZIP？',
                body: '多张贴纸或拆分后的贴纸集合适合打包 ZIP。单张素材可以直接下载 PNG；需要采购统计时，再用拼豆图纸里的 CSV。',
                tag: '批量',
              },
            ],
          },
          {
            id: 'other',
            title: '其他',
            items: [
              {
                id: 'transparent',
                icon: Eraser,
                title: '透明背景不干净怎么办？',
                body: '卡片上的橡皮图标会重新尝试透明修复。它会从画布边缘识别并移除连通背景，最适合轮廓清晰的贴纸、图标和拼豆前置素材。',
                tag: '透明',
              },
              {
                id: 'collection',
                icon: Layers3,
                title: '一张图里有多个贴纸？',
                body: '生成贴纸集合后，先点剪刀切分。自动切分适合透明间隔明显的图，手动切分适合规则宫格；拆出来的小图也能继续生成拼豆图纸。',
                tag: '集合',
              },
            ],
          },
        ] satisfies HelpGroup[],
      }
    : {
        title: 'Help',
        subtitle: 'Useful workflow notes that are easy to miss.',
        collapseLabel: 'Collapse help',
        expandLabel: 'Expand help',
        groups: [
          {
            id: 'beads',
            title: 'Beads',
            items: [
              {
                id: 'beads-upload',
                icon: Upload,
                title: 'Can uploaded images become bead patterns?',
                body: 'Yes. Use the gallery upload button to add an existing PNG/JPG, then click the grid icon on that uploaded image card. Transparent PNGs work especially well because the converter can ignore transparent background and keep the subject.',
                tag: 'Upload',
              },
              {
                id: 'beads',
                icon: Grid3X3,
                title: 'How do bead patterns work?',
                body: 'Click the grid icon on a sticker card, choose an Artkal, Hama, Perler, or similar palette, then adjust width and max colors. The pattern emphasizes bead codes because makers buy and place real beads by brand code; Hex is only a reference.',
                tag: 'Beads',
              },
              {
                id: 'prompt',
                icon: Sparkles,
                title: 'What images convert best?',
                body: 'Bead workflows prefer a clear subject, front view, clean silhouette, and simple color blocks. Glow, glass, smoke, and hair make transparency and bead color mapping harder.',
                tag: 'Source',
              },
            ],
          },
          {
            id: 'export',
            title: 'Export',
            items: [
              {
                id: 'bead-export',
                icon: PackageCheck,
                title: 'What should I export?',
                body: 'PNG is best for following the pattern visually. CSV is best for shopping and inventory. It includes bead code, color name, reference Hex, and count, but real bead colors should still be checked against a physical chart.',
                tag: 'Beads',
              },
              {
                id: 'zip-export',
                icon: PackageCheck,
                title: 'When should I use ZIP?',
                body: 'Use ZIP for multiple stickers or split sticker collections. Download a single PNG for one asset; use bead CSV when you need a shopping or inventory list.',
                tag: 'Batch',
              },
            ],
          },
          {
            id: 'other',
            title: 'Other',
            items: [
              {
                id: 'transparent',
                icon: Eraser,
                title: 'Need cleaner transparency?',
                body: 'Use the eraser action on a card to retry transparency cleanup. It removes edge-connected background pixels, which works best for clear sticker, icon, and bead-pattern source art.',
                tag: 'Alpha',
              },
              {
                id: 'collection',
                icon: Layers3,
                title: 'Multiple stickers in one image?',
                body: 'Use the scissors action on sticker collections. Auto split works for clear transparent gaps; manual split works for regular grids. Split pieces can also become bead patterns.',
                tag: 'Sets',
              },
            ],
          },
        ] satisfies HelpGroup[],
      };

  const toggleItem = (groupId: string, itemId: string) => {
    setActiveItemByGroup(prev => ({
      ...prev,
      [groupId]: prev[groupId] === itemId ? '' : itemId,
    }));
  };

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => onCollapsedChange(false)}
        className="hidden xl:fixed xl:right-6 xl:top-24 xl:z-30 xl:inline-flex xl:h-11 xl:w-11 xl:items-center xl:justify-center xl:rounded-full xl:border xl:border-orange-100 xl:bg-white xl:text-orange-600 xl:shadow-lg xl:shadow-orange-100/60 xl:transition-colors xl:hover:bg-orange-50 xl:focus-visible:outline-none xl:focus-visible:ring-2 xl:focus-visible:ring-orange-400 xl:focus-visible:ring-offset-2"
        aria-label={copy.expandLabel}
        title={copy.expandLabel}
      >
        <HelpCircle size={22} />
      </button>
    );
  }

  return (
    <aside className="hidden xl:sticky xl:top-0 xl:flex xl:max-h-[calc(100vh-6rem)] xl:self-start xl:flex-col xl:overflow-hidden xl:border-l xl:border-orange-100 xl:pl-5">
      <div className="mb-2 flex items-start gap-3">
        <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <HelpCircle size={19} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-wide text-stone-800">{copy.title}</h3>
          <p className="mt-0.5 text-xs font-semibold leading-relaxed text-stone-500">{copy.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => onCollapsedChange(true)}
          className="ml-auto inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          aria-label={copy.collapseLabel}
          title={copy.collapseLabel}
        >
          <ChevronDown size={17} className="-rotate-90" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {copy.groups.map((group) => (
          <section key={group.id} className="rounded-2xl border border-orange-100/70 bg-orange-50/30 p-2">
            <div className="mb-2 px-1 text-[11px] font-black uppercase tracking-wide text-orange-700">
              {group.title}
            </div>
            <div className="space-y-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isOpen = activeItemByGroup[group.id] === item.id;

                return (
                  <article
                    key={item.id}
                    className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
                      isOpen ? 'border-orange-100' : 'border-stone-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(group.id, item.id)}
                      className="flex w-full items-start gap-2.5 p-3 text-left transition-colors hover:bg-orange-50/50"
                      aria-expanded={isOpen}
                    >
                      <span className={`mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                        isOpen ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-500'
                      }`}>
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-black text-stone-500">
                          {item.tag}
                        </span>
                        <span className="block text-sm font-black leading-snug text-stone-800">{item.title}</span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`mt-1 flex-shrink-0 text-stone-400 transition-transform ${
                          isOpen ? 'rotate-180 text-orange-500' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-orange-50 bg-orange-50/30 px-3 pb-3 pt-2">
                        <p className="text-xs font-semibold leading-relaxed text-stone-600">{item.body}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
};

export default GalleryHelpRail;
