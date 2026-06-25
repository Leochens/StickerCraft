import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Grid3X3, Hash, Palette, RefreshCw, Ruler, X } from 'lucide-react';
import { BeadPaletteBrand, BeadPattern, BeadPatternOptions, GeneratedImage } from '../types';
import {
  BEAD_PALETTES,
  beadPatternToCsv,
  generateBeadPatternFromImage,
  renderBeadPatternPreviewToCanvas,
  renderBeadPatternToCanvas,
} from '../services/beadPatternService';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../services/analytics';

interface BeadPatternModalProps {
  image: GeneratedImage;
  onClose: () => void;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const BeadPatternModal: React.FC<BeadPatternModalProps> = ({ image, onClose }) => {
  const { language } = useLanguage();
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [options, setOptions] = useState<BeadPatternOptions>({
    paletteBrand: 'artkal',
    width: 24,
    maxColors: 16,
    ignoreTransparent: true,
  });
  const [showCodes, setShowCodes] = useState(true);
  const [pattern, setPattern] = useState<BeadPattern | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const copy = language === 'zh'
    ? {
        title: '拼豆图纸',
        subtitle: '把当前贴纸转换成带编号网格和材料清单的拼豆图纸。',
        source: '源图片',
        settings: '转换设置',
        palette: '珠子色板',
        width: '图纸宽度',
        maxColors: '最多颜色',
        ignoreTransparent: '忽略透明背景',
        showCodes: '显示珠子编号',
        beads: '颗',
        colors: '色',
        materials: '材料清单',
        hex: '参考色值',
        exportPng: '导出 PNG',
        exportCsv: '导出 CSV',
        generating: '正在生成图纸...',
        empty: '无法生成图纸，请换一张更清晰的图片。',
        note: '品牌色板为常用色近似值，正式制作前建议核对实物珠子颜色。',
        total: '总数',
      }
    : {
        title: 'Bead pattern',
        subtitle: 'Convert this sticker into a coded bead grid and material list.',
        source: 'Source image',
        settings: 'Conversion settings',
        palette: 'Bead palette',
        width: 'Pattern width',
        maxColors: 'Max colors',
        ignoreTransparent: 'Ignore transparent background',
        showCodes: 'Show bead codes',
        beads: 'beads',
        colors: 'colors',
        materials: 'Materials',
        hex: 'Reference hex',
        exportPng: 'Export PNG',
        exportCsv: 'Export CSV',
        generating: 'Generating pattern...',
        empty: 'Could not create a pattern. Try a clearer image.',
        note: 'Palettes are practical approximations; verify real bead colors before making.',
        total: 'Total',
      };

  const paletteOptions = useMemo(() => BEAD_PALETTES, []);

  useEffect(() => {
    let cancelled = false;
    const generationTimer = window.setTimeout(() => {
      generateBeadPatternFromImage(image.dataUrl, options)
        .then((nextPattern) => {
          if (!cancelled) setPattern(nextPattern);
        })
        .catch((patternError) => {
          console.error('Failed to create bead pattern', patternError);
          if (!cancelled) {
            setPattern(null);
            setError(patternError instanceof Error ? patternError.message : copy.empty);
          }
        })
        .finally(() => {
          if (!cancelled) setIsGenerating(false);
        });
    }, 120);

    setIsGenerating(true);
    setError(null);

    return () => {
      cancelled = true;
      window.clearTimeout(generationTimer);
    };
  }, [image.dataUrl, options, copy.empty]);

  useEffect(() => {
    if (!pattern || isGenerating || !previewCanvasRef.current) return;
    renderBeadPatternPreviewToCanvas(previewCanvasRef.current, pattern, { showCodes });
  }, [pattern, showCodes, isGenerating]);

  const updateOption = <K extends keyof BeadPatternOptions>(key: K, value: BeadPatternOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const exportPng = () => {
    if (!pattern) return;
    const canvas = renderBeadPatternToCanvas(pattern, {
      title: image.prompt || copy.title,
      showCodes,
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, `bead-pattern-${image.id}.png`);
      trackEvent('bead_pattern_exported', {
        format: 'png',
        palette: pattern.palette.brand,
        width: pattern.width,
        height: pattern.height,
        color_count: pattern.materialList.length,
        total_beads: pattern.totalBeads,
      });
    }, 'image/png');
  };

  const exportCsv = () => {
    if (!pattern) return;
    downloadBlob(
      new Blob([beadPatternToCsv(pattern)], { type: 'text/csv;charset=utf-8' }),
      `bead-pattern-${image.id}.csv`,
    );
    trackEvent('bead_pattern_exported', {
      format: 'csv',
      palette: pattern.palette.brand,
      width: pattern.width,
      height: pattern.height,
      color_count: pattern.materialList.length,
      total_beads: pattern.totalBeads,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/65 p-4 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-[min(96vw,1680px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in">
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 p-5">
          <div>
            <div className="flex items-center gap-2 text-stone-900">
              <Grid3X3 size={22} className="text-orange-500" />
              <h3 className="text-xl font-black">{copy.title}</h3>
            </div>
            <p className="mt-1 text-sm font-semibold text-stone-500">{copy.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-800"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[290px_minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <div className="mb-2 text-xs font-black uppercase tracking-wide text-stone-500">{copy.source}</div>
              <div className="aspect-square rounded-xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-white p-3 flex items-center justify-center">
                <img src={image.dataUrl} alt={image.prompt} className="max-h-full max-w-full object-contain drop-shadow-lg" />
              </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-orange-900">
                <Palette size={16} />
                {copy.settings}
              </div>
              <div className="space-y-4">
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wide text-stone-500">{copy.palette}</span>
                  <select
                    value={options.paletteBrand}
                    onChange={(event) => updateOption('paletteBrand', event.target.value as BeadPaletteBrand)}
                    className="w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-bold text-stone-700 outline-none focus:border-orange-400"
                  >
                    {paletteOptions.map((palette) => (
                      <option key={palette.brand} value={palette.brand}>{palette.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-stone-500">
                    <span className="inline-flex items-center gap-1"><Ruler size={12} />{copy.width}</span>
                    <span>{options.width} {copy.beads}</span>
                  </span>
                  <input
                    type="range"
                    min={8}
                    max={64}
                    step={1}
                    value={options.width}
                    onChange={(event) => updateOption('width', Number(event.target.value))}
                    className="w-full accent-orange-500"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-stone-500">
                    <span className="inline-flex items-center gap-1"><Hash size={12} />{copy.maxColors}</span>
                    <span>{options.maxColors} {copy.colors}</span>
                  </span>
                  <input
                    type="range"
                    min={2}
                    max={24}
                    step={1}
                    value={options.maxColors}
                    onChange={(event) => updateOption('maxColors', Number(event.target.value))}
                    className="w-full accent-orange-500"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-white bg-white/80 px-3 py-2 text-sm font-bold text-stone-700">
                  <span>{copy.ignoreTransparent}</span>
                  <input
                    type="checkbox"
                    checked={options.ignoreTransparent}
                    onChange={(event) => updateOption('ignoreTransparent', event.target.checked)}
                    className="h-4 w-4 accent-orange-500"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-white bg-white/80 px-3 py-2 text-sm font-bold text-stone-700">
                  <span>{copy.showCodes}</span>
                  <input
                    type="checkbox"
                    checked={showCodes}
                    onChange={(event) => setShowCodes(event.target.checked)}
                    className="h-4 w-4 accent-orange-500"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-stone-100 bg-stone-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wide text-stone-700">{copy.title}</h4>
                {pattern && (
                  <p className="text-xs font-bold text-stone-400">
                    {pattern.width} x {pattern.height} · {pattern.totalBeads} {copy.beads}
                  </p>
                )}
              </div>
              {isGenerating && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-black text-orange-600">
                  <RefreshCw size={13} className="animate-spin" />
                  {copy.generating}
                </span>
              )}
            </div>

            <div className="min-h-[420px] overflow-auto rounded-2xl bg-white p-4 shadow-inner">
              {pattern && !isGenerating ? (
                <canvas
                  ref={previewCanvasRef}
                  aria-label={`${copy.title} ${pattern.width} x ${pattern.height}`}
                  className="mx-auto block max-w-none rounded-xl border border-stone-300 bg-white shadow-sm"
                />
              ) : (
                <div className="flex min-h-[380px] flex-col items-center justify-center text-center text-stone-400">
                  {isGenerating ? <RefreshCw size={34} className="mb-3 animate-spin" /> : <Grid3X3 size={34} className="mb-3" />}
                  <p className="max-w-sm text-sm font-bold">{error || copy.generating}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-sm font-black uppercase tracking-wide text-stone-700">{copy.materials}</h4>
                {pattern && (
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700">
                    {copy.total}: {pattern.totalBeads}
                  </span>
                )}
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {pattern?.materialList.map((item) => (
                  <div
                    key={item.color.id}
                    className="grid grid-cols-[22px_1fr_auto] items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-2.5 py-2"
                    title={`${copy.hex}: ${item.color.hex}`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-stone-200"
                      style={{ backgroundColor: item.color.hex }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-stone-700">{item.color.id}</p>
                      <p className="truncate text-[10px] font-semibold text-stone-400">{item.color.name}</p>
                      <code className="mt-1 inline-flex rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-black uppercase text-stone-500">
                        {item.color.hex}
                      </code>
                    </div>
                    <span className="text-xs font-black text-stone-700">{item.count}</span>
                  </div>
                ))}
              </div>

              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800">
                {copy.note}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportPng}
                disabled={!pattern || isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-200 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                {copy.exportPng}
              </button>
              <button
                onClick={exportCsv}
                disabled={!pattern || isGenerating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileSpreadsheet size={16} />
                {copy.exportCsv}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeadPatternModal;
