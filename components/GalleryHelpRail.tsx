import React from 'react';
import { Eraser, Grid3X3, HelpCircle, Layers3, PackageCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type HelpItem = {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  body: string;
  tag: string;
};

const GalleryHelpRail: React.FC = () => {
  const { language } = useLanguage();

  const copy = language === 'zh'
    ? {
        title: '使用帮助',
        subtitle: '一些容易忽略但很实用的工作流提示。',
        items: [
          {
            id: 'beads',
            icon: Grid3X3,
            title: '拼豆图纸怎么用？',
            body: '在贴纸卡片上点网格图标，选择 Artkal、Hama、Perler 等色板，再调图纸宽度和最大颜色数。图纸主显示品牌色号，因为真正制作时要按色号买豆、摆豆；Hex 只是参考色值。',
            tag: '拼豆',
          },
          {
            id: 'bead-export',
            icon: PackageCheck,
            title: '拼豆导出看什么？',
            body: 'PNG 适合直接照着摆，CSV 适合整理采购清单。CSV 里会包含色号、颜色名、参考 Hex 和数量，但正式购买前建议核对实物色卡。',
            tag: '导出',
          },
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
          {
            id: 'prompt',
            icon: Sparkles,
            title: '提示词怎么写更稳？',
            body: '拼豆、贴纸、图标类素材都更适合“主体清晰、正面、边缘干净、少阴影”的提示词。复杂发光、玻璃、烟雾和毛发会让透明处理与拼豆色彩映射更难。',
            tag: '生成',
          },
        ] satisfies HelpItem[],
      }
    : {
        title: 'Help',
        subtitle: 'Useful workflow notes that are easy to miss.',
        items: [
          {
            id: 'beads',
            icon: Grid3X3,
            title: 'How do bead patterns work?',
            body: 'Click the grid icon on a sticker card, choose an Artkal, Hama, Perler, or similar palette, then adjust width and max colors. The pattern emphasizes bead codes because makers buy and place real beads by brand code; Hex is only a reference.',
            tag: 'Beads',
          },
          {
            id: 'bead-export',
            icon: PackageCheck,
            title: 'What should I export?',
            body: 'PNG is best for following the pattern visually. CSV is best for shopping and inventory. It includes bead code, color name, reference Hex, and count, but real bead colors should still be checked against a physical chart.',
            tag: 'Export',
          },
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
          {
            id: 'prompt',
            icon: Sparkles,
            title: 'Prompt for cleaner assets',
            body: 'Sticker, icon, and bead workflows all prefer a clear subject, front view, clean silhouette, and limited shadows. Glow, glass, smoke, and hair make transparency and bead color mapping harder.',
            tag: 'Prompt',
          },
        ] satisfies HelpItem[],
      };

  return (
    <aside className="hidden xl:flex xl:max-h-[calc(100vh-9rem)] xl:min-h-[520px] xl:flex-col xl:overflow-hidden xl:border-l xl:border-orange-100 xl:pl-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <HelpCircle size={19} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-wide text-stone-800">{copy.title}</h3>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-stone-500">{copy.subtitle}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {copy.items.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.id} className="rounded-2xl border border-stone-100 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-1 text-[10px] font-black text-stone-500">
                  <Icon size={12} />
                  {item.tag}
                </span>
              </div>
              <h4 className="text-sm font-black leading-snug text-stone-800">{item.title}</h4>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-stone-500">{item.body}</p>
            </article>
          );
        })}
      </div>
    </aside>
  );
};

export default GalleryHelpRail;
