import { BeadPattern, BeadPatternCell, BeadPatternOptions, BeadPalette, BeadPaletteColor } from '../types';

type RGB = { r: number; g: number; b: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string): RGB => {
  const raw = hex.replace('#', '');
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16),
  };
};

const createColor = (id: string, name: string, hex: string): BeadPaletteColor => ({
  id,
  name,
  hex,
  rgb: hexToRgb(hex),
});

const BASE_COLORS: Array<[string, string, string]> = [
  ['BLK', 'Black', '#171717'],
  ['WHT', 'White', '#f8f7ef'],
  ['CRM', 'Cream', '#f0e9ca'],
  ['GRY', 'Light Gray', '#c8c8c3'],
  ['DGY', 'Dark Gray', '#5f6368'],
  ['RED', 'Red', '#d6242f'],
  ['PNK', 'Pink', '#f29ab7'],
  ['MAG', 'Magenta', '#cc2e86'],
  ['ORG', 'Orange', '#f26d21'],
  ['YEL', 'Yellow', '#ffe153'],
  ['LYL', 'Light Yellow', '#fff3a3'],
  ['BRN', 'Brown', '#6f4328'],
  ['TAN', 'Tan', '#c49768'],
  ['GRN', 'Green', '#2e9c57'],
  ['LGN', 'Light Green', '#93d666'],
  ['DGN', 'Dark Green', '#245d43'],
  ['CYN', 'Cyan', '#40bdd5'],
  ['LBL', 'Light Blue', '#83c8e8'],
  ['BLU', 'Blue', '#2366b8'],
  ['NVY', 'Navy', '#20385f'],
  ['PUR', 'Purple', '#7752a9'],
  ['LAV', 'Lavender', '#b9a2d8'],
  ['PEA', 'Peach', '#f5b48f'],
  ['ROS', 'Rose', '#e85f73'],
];

const createPalette = (brand: BeadPalette['brand'], label: string, prefix: string): BeadPalette => ({
  brand,
  label,
  colors: BASE_COLORS.map(([id, name, hex], index) => (
    createColor(`${prefix}${String(index + 1).padStart(2, '0')}`, `${prefix} ${name}`, hex)
  )),
});

export const BEAD_PALETTES: BeadPalette[] = [
  createPalette('perler', 'Perler starter palette', 'P'),
  createPalette('hama', 'Hama starter palette', 'H'),
  createPalette('artkal', 'Artkal starter palette', 'A'),
  createPalette('mard', 'Mard starter palette', 'M'),
];

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => (
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image for bead pattern conversion.'));
    image.src = dataUrl;
  })
);

const getTrimBox = (imageData: ImageData, alphaThreshold: number) => {
  const { data, width, height } = imageData;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= alphaThreshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: Math.max(0, minX - 1),
    y: Math.max(0, minY - 1),
    width: Math.min(width, maxX - minX + 3),
    height: Math.min(height, maxY - minY + 3),
  };
};

const colorDistance = (a: RGB, b: RGB) => {
  const r = a.r - b.r;
  const g = a.g - b.g;
  const bl = a.b - b.b;
  return r * r * 0.3 + g * g * 0.59 + bl * bl * 0.11;
};

const getReadableTextColor = (hex?: string) => {
  if (!hex) return '#111827';
  const rgb = hexToRgb(hex);
  const luminance = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  return luminance > 0.54 ? '#111827' : '#ffffff';
};

const nearestColor = (rgb: RGB, colors: BeadPaletteColor[]) => {
  let best = colors[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  colors.forEach((color) => {
    const distance = colorDistance(rgb, color.rgb);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  });

  return best;
};

const remapToLimitedPalette = (
  cells: BeadPatternCell[],
  usage: Map<string, number>,
  paletteColors: BeadPaletteColor[],
  maxColors: number,
) => {
  const usedColorIds = [...usage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([id]) => id);
  const keptColors = paletteColors.filter(color => usedColorIds.includes(color.id));
  const paletteById = new Map(paletteColors.map(color => [color.id, color]));
  const remapCache = new Map<string, BeadPaletteColor>();

  return cells.map((cell) => {
    if (!cell.colorId || usedColorIds.includes(cell.colorId)) return cell;

    const source = paletteById.get(cell.colorId);
    if (!source) return cell;
    const cached = remapCache.get(source.id);
    const replacement = cached || nearestColor(source.rgb, keptColors);
    remapCache.set(source.id, replacement);

    return {
      ...cell,
      colorId: replacement.id,
      hex: replacement.hex,
    };
  });
};

const summarizeUsage = (cells: BeadPatternCell[], paletteColors: BeadPaletteColor[]) => {
  const colorMap = new Map(paletteColors.map(color => [color.id, color]));
  const totals = new Map<string, number>();

  cells.forEach((cell) => {
    if (!cell.colorId) return;
    totals.set(cell.colorId, (totals.get(cell.colorId) || 0) + 1);
  });

  return [...totals.entries()]
    .map(([colorId, count]) => {
      const color = colorMap.get(colorId);
      if (!color) return null;
      return { color, count };
    })
    .filter((item): item is { color: BeadPaletteColor; count: number } => Boolean(item))
    .sort((a, b) => b.count - a.count);
};

export const generateBeadPatternFromImage = async (
  dataUrl: string,
  options: BeadPatternOptions,
): Promise<BeadPattern> => {
  const image = await loadImage(dataUrl);
  const palette = BEAD_PALETTES.find(item => item.brand === options.paletteBrand) || BEAD_PALETTES[0];
  const alphaThreshold = 24;

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.naturalWidth || image.width;
  sourceCanvas.height = image.naturalHeight || image.height;
  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceCtx) throw new Error('Could not create source canvas.');

  sourceCtx.drawImage(image, 0, 0);
  const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const trimBox = options.ignoreTransparent
    ? getTrimBox(sourceImageData, alphaThreshold)
    : { x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height };

  const width = clamp(Math.round(options.width || 24), 8, 96);
  const height = clamp(Math.round((trimBox.height / trimBox.width) * width), 8, 128);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = width;
  sampleCanvas.height = height;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!sampleCtx) throw new Error('Could not create pattern canvas.');

  sampleCtx.imageSmoothingEnabled = true;
  sampleCtx.imageSmoothingQuality = 'high';
  sampleCtx.clearRect(0, 0, width, height);
  sampleCtx.drawImage(
    sourceCanvas,
    trimBox.x,
    trimBox.y,
    trimBox.width,
    trimBox.height,
    0,
    0,
    width,
    height,
  );

  const sampleData = sampleCtx.getImageData(0, 0, width, height).data;
  const usage = new Map<string, number>();
  const cells: BeadPatternCell[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = sampleData[index + 3];

      if (options.ignoreTransparent && alpha <= alphaThreshold) {
        cells.push({ x, y, transparent: true });
        continue;
      }

      const color = nearestColor({
        r: sampleData[index],
        g: sampleData[index + 1],
        b: sampleData[index + 2],
      }, palette.colors);

      usage.set(color.id, (usage.get(color.id) || 0) + 1);
      cells.push({
        x,
        y,
        colorId: color.id,
        hex: color.hex,
      });
    }
  }

  const limitedCells = remapToLimitedPalette(
    cells,
    usage,
    palette.colors,
    clamp(Math.round(options.maxColors || 16), 2, palette.colors.length),
  );
  const materialList = summarizeUsage(limitedCells, palette.colors);

  return {
    width,
    height,
    palette,
    cells: limitedCells,
    materialList,
    totalBeads: materialList.reduce((sum, item) => sum + item.count, 0),
    createdAt: Date.now(),
  };
};

export const renderBeadPatternToCanvas = (
  pattern: BeadPattern,
  options: { title: string; showCodes: boolean },
) => {
  const cellSize = pattern.width > 48 ? 16 : pattern.width > 32 ? 20 : 26;
  const margin = 42;
  const legendWidth = 360;
  const headerHeight = 80;
  const footerHeight = 34;
  const canvas = document.createElement('canvas');
  canvas.width = margin * 2 + pattern.width * cellSize + legendWidth;
  canvas.height = Math.max(
    headerHeight + margin + pattern.height * cellSize + footerHeight,
    headerHeight + pattern.materialList.length * 34 + 80,
  );

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create export canvas.');

  ctx.fillStyle = '#fffaf3';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1c1917';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.fillText(options.title || 'Bead pattern', margin, 48);
  ctx.font = '600 13px Arial, sans-serif';
  ctx.fillStyle = '#78716c';
  ctx.fillText(`${pattern.width} x ${pattern.height} beads · ${pattern.totalBeads} beads · ${pattern.palette.label}`, margin, 70);

  const gridX = margin;
  const gridY = headerHeight + 18;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gridX - 10, gridY - 10, pattern.width * cellSize + 20, pattern.height * cellSize + 20);

  pattern.cells.forEach((cell) => {
    const x = gridX + cell.x * cellSize;
    const y = gridY + cell.y * cellSize;
    ctx.fillStyle = cell.transparent ? '#ffffff' : cell.hex || '#ffffff';
    ctx.fillRect(x, y, cellSize, cellSize);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellSize, cellSize);

    if (options.showCodes && cell.colorId && cellSize >= 16) {
      ctx.fillStyle = getReadableTextColor(cell.hex);
      ctx.font = `${cellSize >= 22 ? 9 : 7}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cell.colorId, x + cellSize / 2, y + cellSize / 2);
    }
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const legendX = gridX + pattern.width * cellSize + 48;
  let legendY = headerHeight + 18;
  ctx.fillStyle = '#1c1917';
  ctx.font = '800 16px Arial, sans-serif';
  ctx.fillText('Materials', legendX, legendY);
  legendY += 28;

  ctx.font = '700 12px Arial, sans-serif';
  pattern.materialList.forEach((item) => {
    ctx.fillStyle = item.color.hex;
    ctx.fillRect(legendX, legendY - 15, 18, 18);
    ctx.strokeStyle = '#d6d3d1';
    ctx.strokeRect(legendX, legendY - 15, 18, 18);
    ctx.fillStyle = '#292524';
    ctx.fillText(`${item.color.id} · ${item.color.name}`, legendX + 28, legendY);
    ctx.fillStyle = '#78716c';
    ctx.fillText(item.color.hex.toUpperCase(), legendX + 28, legendY + 14);
    ctx.fillStyle = '#292524';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.count}`, legendX + 270, legendY);
    ctx.textAlign = 'left';
    legendY += 34;
  });

  ctx.fillStyle = '#a8a29e';
  ctx.font = '600 11px Arial, sans-serif';
  ctx.fillText('Generated by StickerCraft AI. Check real bead colors before making.', margin, canvas.height - 18);

  return canvas;
};

export const beadPatternToCsv = (pattern: BeadPattern) => {
  const lines = [
    ['Code', 'Name', 'Hex', 'Count'].join(','),
    ...pattern.materialList.map(item => [
      item.color.id,
      `"${item.color.name.replace(/"/g, '""')}"`,
      item.color.hex,
      item.count,
    ].join(',')),
    '',
    ['Pattern'].join(','),
    ...Array.from({ length: pattern.height }, (_, y) => (
      Array.from({ length: pattern.width }, (_, x) => {
        const cell = pattern.cells[y * pattern.width + x];
        return cell?.colorId || '';
      }).join(',')
    )),
  ];

  return lines.join('\n');
};
