import type { CropAdjustments, ImageCropBox } from '../types';

type RGB = { r: number; g: number; b: number };

interface BackgroundCandidate {
  color: RGB;
  tolerance: number;
}

export interface TransparencyRepairOptions {
  backgroundColor?: string;
  hasStickerBorder?: boolean;
  tolerance?: number;
}

export interface SplitStickerCollectionOptions extends TransparencyRepairOptions {
  expectedCount?: number;
}

export interface GridSplitStickerCollectionOptions extends TransparencyRepairOptions {
  rows: number;
  columns: number;
}

export interface SplitStickerPiece {
  dataUrl: string;
  box: ImageCropBox;
  sourceWidth: number;
  sourceHeight: number;
}

export interface SplitStickerCollectionResult {
  sourceDataUrl: string;
  pieces: SplitStickerPiece[];
}

interface CanvasSnapshot {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  imageData: ImageData;
  width: number;
  height: number;
}

interface ComponentBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  area: number;
}

interface ComponentCluster extends ComponentBox {
  pixels: number[];
}

const NAMED_COLORS: Record<string, RGB> = {
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  red: { r: 239, g: 68, b: 68 },
  orange: { r: 249, g: 115, b: 22 },
  yellow: { r: 234, g: 179, b: 8 },
  green: { r: 34, g: 197, b: 94 },
  blue: { r: 59, g: 130, b: 246 },
  purple: { r: 168, g: 85, b: 247 },
  pink: { r: 236, g: 72, b: 153 },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const sameColor = (a: RGB, b: RGB) => (
  Math.abs(a.r - b.r) <= 2 &&
  Math.abs(a.g - b.g) <= 2 &&
  Math.abs(a.b - b.b) <= 2
);

const addCandidate = (candidates: BackgroundCandidate[], color: RGB | undefined, tolerance: number) => {
  if (!color) return;
  if (candidates.some(candidate => sameColor(candidate.color, color))) return;
  candidates.push({ color, tolerance });
};

const parseCssColor = (value?: string): RGB | undefined => {
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (NAMED_COLORS[normalized]) return NAMED_COLORS[normalized];

  const hex = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3
      ? hex[1].split('').map(char => `${char}${char}`).join('')
      : hex[1];
    return {
      r: parseInt(raw.slice(0, 2), 16),
      g: parseInt(raw.slice(2, 4), 16),
      b: parseInt(raw.slice(4, 6), 16),
    };
  }

  const rgb = normalized.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) {
    return {
      r: clamp(Number(rgb[1]), 0, 255),
      g: clamp(Number(rgb[2]), 0, 255),
      b: clamp(Number(rgb[3]), 0, 255),
    };
  }

  return undefined;
};

const loadImageSnapshot = (dataUrl: string): Promise<CanvasSnapshot> => (
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("Could not create a canvas context."));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ canvas, ctx, imageData, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => reject(new Error("Could not load image for processing."));
    img.src = dataUrl;
  })
);

const colorMatches = (data: Uint8ClampedArray, pixelIndex: number, candidate: BackgroundCandidate) => {
  const r = data[pixelIndex];
  const g = data[pixelIndex + 1];
  const b = data[pixelIndex + 2];
  const { color, tolerance } = candidate;

  return (
    Math.abs(r - color.r) <= tolerance &&
    Math.abs(g - color.g) <= tolerance &&
    Math.abs(b - color.b) <= tolerance
  );
};

const getEdgePixelPositions = (width: number, height: number) => {
  const positions: number[] = [];

  for (let x = 0; x < width; x += 1) {
    positions.push(x);
    positions.push((height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    positions.push(y * width);
    positions.push(y * width + width - 1);
  }

  return positions;
};

const getDominantEdgeColors = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
): RGB[] => {
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  const edgePositions = getEdgePixelPositions(width, height);

  edgePositions.forEach((position) => {
    const idx = position * 4;
    if (data[idx + 3] <= 20) return;

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };

    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  });

  const minCount = Math.max(2, Math.floor(edgePositions.length * 0.025));

  return [...buckets.values()]
    .filter(bucket => bucket.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(bucket => ({
      r: Math.round(bucket.r / bucket.count),
      g: Math.round(bucket.g / bucket.count),
      b: Math.round(bucket.b / bucket.count),
    }));
};

const hasUsableAlphaBackground = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => {
  const totalPixels = width * height;
  const edgePositions = getEdgePixelPositions(width, height);
  let transparentPixels = 0;
  let softAlphaPixels = 0;
  let transparentEdgePixels = 0;
  let transparentCorners = 0;

  for (let position = 0; position < totalPixels; position += 1) {
    const alpha = data[position * 4 + 3];
    if (alpha <= 12) transparentPixels += 1;
    if (alpha < 250) softAlphaPixels += 1;
  }

  edgePositions.forEach((position) => {
    if (data[position * 4 + 3] <= 12) transparentEdgePixels += 1;
  });

  [
    0,
    width - 1,
    (height - 1) * width,
    height * width - 1,
  ].forEach((position) => {
    if (data[position * 4 + 3] <= 12) transparentCorners += 1;
  });

  const transparentRatio = transparentPixels / totalPixels;
  const softAlphaRatio = softAlphaPixels / totalPixels;
  const edgeTransparentRatio = transparentEdgePixels / edgePositions.length;

  return (
    edgeTransparentRatio >= 0.12 ||
    (transparentCorners >= 2 && transparentRatio >= 0.01) ||
    (edgeTransparentRatio >= 0.04 && softAlphaRatio >= 0.08)
  );
};

const getBackgroundCandidates = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: TransparencyRepairOptions = {},
) => {
  const candidates: BackgroundCandidate[] = [];
  const baseTolerance = options.tolerance ?? 44;

  addCandidate(candidates, parseCssColor(options.backgroundColor), baseTolerance + 8);
  addCandidate(
    candidates,
    options.hasStickerBorder ? NAMED_COLORS.black : NAMED_COLORS.white,
    baseTolerance,
  );

  getDominantEdgeColors(data, width, height).forEach((color) => {
    addCandidate(candidates, color, baseTolerance);
  });

  return candidates;
};

export const repairStickerTransparency = async (
  dataUrl: string,
  options: TransparencyRepairOptions = {},
): Promise<string> => {
  const { canvas, ctx, imageData, width, height } = await loadImageSnapshot(dataUrl);
  const { data } = imageData;

  if (hasUsableAlphaBackground(data, width, height)) {
    return dataUrl;
  }

  const candidates = getBackgroundCandidates(data, width, height, options);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const edgePositions = getEdgePixelPositions(width, height);
  let head = 0;
  let tail = 0;

  const matchesBackground = (position: number) => {
    const idx = position * 4;
    if (data[idx + 3] <= 10) return true;
    return candidates.some(candidate => colorMatches(data, idx, candidate));
  };

  const enqueue = (position: number) => {
    if (visited[position] || !matchesBackground(position)) return;
    visited[position] = 1;
    queue[tail] = position;
    tail += 1;
  };

  edgePositions.forEach(enqueue);

  while (head < tail) {
    const position = queue[head];
    head += 1;
    const idx = position * 4;

    data[idx + 3] = 0;

    const x = position % width;
    const y = Math.floor(position / width);

    if (x > 0) enqueue(position - 1);
    if (x < width - 1) enqueue(position + 1);
    if (y > 0) enqueue(position - width);
    if (y < height - 1) enqueue(position + width);
  }

  // Remove a one-pixel halo of near-background matte connected to the cleared area.
  for (let pass = 0; pass < 2; pass += 1) {
    const toClear: number[] = [];
    for (let position = 0; position < width * height; position += 1) {
      const idx = position * 4;
      if (data[idx + 3] <= 10) continue;
      if (!candidates.some(candidate => colorMatches(data, idx, { ...candidate, tolerance: Math.max(12, candidate.tolerance - 18) }))) continue;

      const x = position % width;
      const y = Math.floor(position / width);
      const touchesTransparent =
        (x > 0 && data[(position - 1) * 4 + 3] <= 10) ||
        (x < width - 1 && data[(position + 1) * 4 + 3] <= 10) ||
        (y > 0 && data[(position - width) * 4 + 3] <= 10) ||
        (y < height - 1 && data[(position + width) * 4 + 3] <= 10);

      if (touchesTransparent) toClear.push(idx);
    }

    toClear.forEach((idx) => {
      data[idx + 3] = 0;
    });
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

const findOpaqueComponents = (snapshot: CanvasSnapshot): ComponentBox[] => {
  const { imageData, width, height } = snapshot;
  const { data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const minArea = Math.max(48, Math.floor(width * height * 0.0002));
  const components: ComponentBox[] = [];

  const isOpaque = (position: number) => data[position * 4 + 3] > 24;

  for (let position = 0; position < width * height; position += 1) {
    if (visited[position] || !isOpaque(position)) continue;

    let head = 0;
    let tail = 0;
    let area = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    visited[position] = 1;
    queue[tail] = position;
    tail += 1;

    while (head < tail) {
      const current = queue[head];
      head += 1;

      const x = current % width;
      const y = Math.floor(current / width);
      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);

      const neighbors = [
        current - 1,
        current + 1,
        current - width,
        current + width,
        current - width - 1,
        current - width + 1,
        current + width - 1,
        current + width + 1,
      ];

      neighbors.forEach((neighbor) => {
        if (neighbor < 0 || neighbor >= width * height || visited[neighbor] || !isOpaque(neighbor)) return;

        const nx = neighbor % width;
        const ny = Math.floor(neighbor / width);
        if (Math.abs(nx - x) > 1 || Math.abs(ny - y) > 1) return;

        visited[neighbor] = 1;
        queue[tail] = neighbor;
        tail += 1;
      });
    }

    if (area >= minArea) {
      components.push({ minX, minY, maxX, maxY, area });
    }
  }

  return components;
};

const findOpaqueComponentsInRegion = (
  snapshot: CanvasSnapshot,
  region: Pick<ComponentBox, "minX" | "minY" | "maxX" | "maxY">,
): ComponentCluster[] => {
  const { imageData, width, height } = snapshot;
  const { data } = imageData;
  const minXBound = clamp(Math.round(region.minX), 0, width - 1);
  const maxXBound = clamp(Math.round(region.maxX), minXBound, width - 1);
  const minYBound = clamp(Math.round(region.minY), 0, height - 1);
  const maxYBound = clamp(Math.round(region.maxY), minYBound, height - 1);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const minArea = Math.max(24, Math.floor((maxXBound - minXBound + 1) * (maxYBound - minYBound + 1) * 0.0003));
  const components: ComponentCluster[] = [];
  const isOpaque = (position: number) => data[position * 4 + 3] > 24;
  const isInsideRegion = (position: number) => {
    const x = position % width;
    const y = Math.floor(position / width);
    return x >= minXBound && x <= maxXBound && y >= minYBound && y <= maxYBound;
  };

  for (let y = minYBound; y <= maxYBound; y += 1) {
    for (let x = minXBound; x <= maxXBound; x += 1) {
      const position = y * width + x;
      if (visited[position] || !isOpaque(position)) continue;

      let head = 0;
      let tail = 0;
      let area = 0;
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      const pixels: number[] = [];

      visited[position] = 1;
      queue[tail] = position;
      tail += 1;

      while (head < tail) {
        const current = queue[head];
        head += 1;

        const currentX = current % width;
        const currentY = Math.floor(current / width);
        area += 1;
        pixels.push(current);
        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);

        const neighbors = [
          current - 1,
          current + 1,
          current - width,
          current + width,
          current - width - 1,
          current - width + 1,
          current + width - 1,
          current + width + 1,
        ];

        neighbors.forEach((neighbor) => {
          if (
            neighbor < 0 ||
            neighbor >= width * height ||
            visited[neighbor] ||
            !isInsideRegion(neighbor) ||
            !isOpaque(neighbor)
          ) {
            return;
          }

          const nextX = neighbor % width;
          const nextY = Math.floor(neighbor / width);
          if (Math.abs(nextX - currentX) > 1 || Math.abs(nextY - currentY) > 1) return;

          visited[neighbor] = 1;
          queue[tail] = neighbor;
          tail += 1;
        });
      }

      if (area >= minArea) {
        components.push({ minX, minY, maxX, maxY, area, pixels });
      }
    }
  }

  return components;
};

const getDominantComponentInRegion = (
  snapshot: CanvasSnapshot,
  region: Pick<ComponentBox, "minX" | "minY" | "maxX" | "maxY">,
) => {
  const components = findOpaqueComponentsInRegion(snapshot, region);
  if (components.length === 0) return undefined;
  return components.sort((a, b) => b.area - a.area)[0];
};

const boxesOverlapWithGap = (a: ComponentBox, b: ComponentBox, gap: number) => (
  a.minX - gap <= b.maxX &&
  a.maxX + gap >= b.minX &&
  a.minY - gap <= b.maxY &&
  a.maxY + gap >= b.minY
);

const mergeBoxes = (boxes: ComponentBox[], gap: number) => {
  const merged = [...boxes];
  let changed = true;

  while (changed) {
    changed = false;

    for (let i = 0; i < merged.length; i += 1) {
      for (let j = i + 1; j < merged.length; j += 1) {
        if (!boxesOverlapWithGap(merged[i], merged[j], gap)) continue;

        merged[i] = {
          minX: Math.min(merged[i].minX, merged[j].minX),
          minY: Math.min(merged[i].minY, merged[j].minY),
          maxX: Math.max(merged[i].maxX, merged[j].maxX),
          maxY: Math.max(merged[i].maxY, merged[j].maxY),
          area: merged[i].area + merged[j].area,
        };
        merged.splice(j, 1);
        changed = true;
        break;
      }

      if (changed) break;
    }
  }

  return merged;
};

const sortBoxesReadingOrder = (boxes: ComponentBox[]) => {
  const medianHeight = [...boxes]
    .map(box => box.maxY - box.minY + 1)
    .sort((a, b) => a - b)[Math.floor(boxes.length / 2)] || 1;
  const rowTolerance = Math.max(24, medianHeight * 0.45);

  return [...boxes].sort((a, b) => {
    const ay = (a.minY + a.maxY) / 2;
    const by = (b.minY + b.maxY) / 2;
    if (Math.abs(ay - by) <= rowTolerance) return a.minX - b.minX;
    return ay - by;
  });
};

const cropBox = (snapshot: CanvasSnapshot, box: ComponentBox, padding: number) => {
  const normalizedBox = normalizeCropBox(snapshot, box, padding);
  return cropSnapshotToDataUrl(snapshot, normalizedBox);
};

const normalizeCropBox = (
  snapshot: CanvasSnapshot,
  box: Pick<ComponentBox, "minX" | "minY" | "maxX" | "maxY">,
  padding = 0,
): ImageCropBox => ({
  minX: Math.round(clamp(box.minX - padding, 0, snapshot.width - 1)),
  minY: Math.round(clamp(box.minY - padding, 0, snapshot.height - 1)),
  maxX: Math.round(clamp(box.maxX + padding, 0, snapshot.width - 1)),
  maxY: Math.round(clamp(box.maxY + padding, 0, snapshot.height - 1)),
});

const cropSnapshotToDataUrl = (snapshot: CanvasSnapshot, box: ImageCropBox) => {
  const x = clamp(Math.min(box.minX, box.maxX), 0, snapshot.width - 1);
  const y = clamp(Math.min(box.minY, box.maxY), 0, snapshot.height - 1);
  const right = clamp(Math.max(box.minX, box.maxX), x, snapshot.width - 1);
  const bottom = clamp(Math.max(box.minY, box.maxY), y, snapshot.height - 1);
  const width = Math.max(1, right - x + 1);
  const height = Math.max(1, bottom - y + 1);
  const output = document.createElement("canvas");
  const outputCtx = output.getContext("2d");

  output.width = width;
  output.height = height;

  if (!outputCtx) return snapshot.canvas.toDataURL("image/png");
  outputCtx.drawImage(snapshot.canvas, x, y, width, height, 0, 0, width, height);

  return output.toDataURL("image/png");
};

const cropSnapshotComponentToDataUrl = (
  snapshot: CanvasSnapshot,
  box: ImageCropBox,
  componentPixels: number[],
) => {
  const x = clamp(Math.min(box.minX, box.maxX), 0, snapshot.width - 1);
  const y = clamp(Math.min(box.minY, box.maxY), 0, snapshot.height - 1);
  const right = clamp(Math.max(box.minX, box.maxX), x, snapshot.width - 1);
  const bottom = clamp(Math.max(box.minY, box.maxY), y, snapshot.height - 1);
  const width = Math.max(1, right - x + 1);
  const height = Math.max(1, bottom - y + 1);
  const output = document.createElement("canvas");
  const outputCtx = output.getContext("2d", { willReadFrequently: true });

  output.width = width;
  output.height = height;

  if (!outputCtx) return cropSnapshotToDataUrl(snapshot, box);
  outputCtx.drawImage(snapshot.canvas, x, y, width, height, 0, 0, width, height);

  const outputImageData = outputCtx.getImageData(0, 0, width, height);
  const allowedPixels = new Uint8Array(width * height);

  componentPixels.forEach((position) => {
    const sourceX = position % snapshot.width;
    const sourceY = Math.floor(position / snapshot.width);
    if (sourceX < x || sourceX > right || sourceY < y || sourceY > bottom) return;
    allowedPixels[(sourceY - y) * width + (sourceX - x)] = 1;
  });

  for (let position = 0; position < width * height; position += 1) {
    if (allowedPixels[position]) continue;
    outputImageData.data[position * 4 + 3] = 0;
  }

  outputCtx.putImageData(outputImageData, 0, 0);
  return output.toDataURL("image/png");
};

const createSplitPiece = (snapshot: CanvasSnapshot, box: ComponentBox): SplitStickerPiece => {
  const dominantComponent = getDominantComponentInRegion(snapshot, box);
  const dominantBox = dominantComponent || box;
  const boxWidth = dominantBox.maxX - dominantBox.minX + 1;
  const boxHeight = dominantBox.maxY - dominantBox.minY + 1;
  const padding = Math.max(10, Math.round(Math.max(boxWidth, boxHeight) * 0.1));
  const cropBox = normalizeCropBox(snapshot, dominantBox, padding);

  return {
    dataUrl: dominantComponent
      ? cropSnapshotComponentToDataUrl(snapshot, cropBox, dominantComponent.pixels)
      : cropSnapshotToDataUrl(snapshot, cropBox),
    box: cropBox,
    sourceWidth: snapshot.width,
    sourceHeight: snapshot.height,
  };
};

const boxGap = (a: ComponentBox, b: ComponentBox) => {
  const horizontalGap = Math.max(0, Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX));
  const verticalGap = Math.max(0, Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY));
  return Math.hypot(horizontalGap, verticalGap);
};

const mergeClosestBoxesUntilCount = (boxes: ComponentBox[], targetCount: number) => {
  const merged = [...boxes];

  while (merged.length > targetCount) {
    let bestA = 0;
    let bestB = 1;
    let bestGap = Number.POSITIVE_INFINITY;

    for (let i = 0; i < merged.length; i += 1) {
      for (let j = i + 1; j < merged.length; j += 1) {
        const gap = boxGap(merged[i], merged[j]);
        if (gap < bestGap) {
          bestGap = gap;
          bestA = i;
          bestB = j;
        }
      }
    }

    merged[bestA] = {
      minX: Math.min(merged[bestA].minX, merged[bestB].minX),
      minY: Math.min(merged[bestA].minY, merged[bestB].minY),
      maxX: Math.max(merged[bestA].maxX, merged[bestB].maxX),
      maxY: Math.max(merged[bestA].maxY, merged[bestB].maxY),
      area: merged[bestA].area + merged[bestB].area,
    };
    merged.splice(bestB, 1);
  }

  return merged;
};

const getOpaqueBoundsInRegion = (
  snapshot: CanvasSnapshot,
  region: Pick<ComponentBox, "minX" | "minY" | "maxX" | "maxY">,
): ComponentBox | undefined => {
  const { data } = snapshot.imageData;
  let minX = snapshot.width;
  let minY = snapshot.height;
  let maxX = 0;
  let maxY = 0;
  let area = 0;

  for (let y = region.minY; y <= region.maxY; y += 1) {
    for (let x = region.minX; x <= region.maxX; x += 1) {
      const idx = (y * snapshot.width + x) * 4;
      if (data[idx + 3] <= 24) continue;

      area += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (area === 0) return undefined;
  return { minX, minY, maxX, maxY, area };
};

const getAlphaProjections = (snapshot: CanvasSnapshot) => {
  const { data } = snapshot.imageData;
  const columns = new Uint32Array(snapshot.width);
  const rows = new Uint32Array(snapshot.height);

  for (let y = 0; y < snapshot.height; y += 1) {
    for (let x = 0; x < snapshot.width; x += 1) {
      const alpha = data[(y * snapshot.width + x) * 4 + 3];
      if (alpha <= 24) continue;
      columns[x] += 1;
      rows[y] += 1;
    }
  }

  return { columns, rows };
};

const findTransparentValley = (
  projection: Uint32Array,
  approximateBoundary: number,
  searchRadius: number,
) => {
  const start = clamp(Math.round(approximateBoundary - searchRadius), 1, projection.length - 2);
  const end = clamp(Math.round(approximateBoundary + searchRadius), start, projection.length - 2);
  const windowRadius = Math.max(2, Math.round(projection.length * 0.004));
  let bestIndex = start;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = start; index <= end; index += 1) {
    let score = 0;
    for (
      let sample = Math.max(0, index - windowRadius);
      sample <= Math.min(projection.length - 1, index + windowRadius);
      sample += 1
    ) {
      score += projection[sample];
    }

    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
};

const splitByTransparentGutters = (snapshot: CanvasSnapshot, expectedCount: number) => {
  const count = Math.max(2, Math.min(12, expectedCount));
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const { columns: columnProjection, rows: rowProjection } = getAlphaProjections(snapshot);
  const xBoundaries = [0];
  const yBoundaries = [0];

  for (let column = 1; column < columns; column += 1) {
    const approximate = (snapshot.width * column) / columns;
    xBoundaries.push(findTransparentValley(columnProjection, approximate, snapshot.width / columns * 0.42));
  }
  xBoundaries.push(snapshot.width - 1);

  for (let row = 1; row < rows; row += 1) {
    const approximate = (snapshot.height * row) / rows;
    yBoundaries.push(findTransparentValley(rowProjection, approximate, snapshot.height / rows * 0.42));
  }
  yBoundaries.push(snapshot.height - 1);

  const minArea = Math.max(256, snapshot.width * snapshot.height * 0.001);
  const boxes: ComponentBox[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (boxes.length >= count) break;

      const region = {
        minX: xBoundaries[column],
        maxX: xBoundaries[column + 1],
        minY: yBoundaries[row],
        maxY: yBoundaries[row + 1],
      };
      const box = getOpaqueBoundsInRegion(snapshot, region);

      if (box && box.area >= minArea) {
        boxes.push(box);
      }
    }
  }

  return boxes;
};

export const splitStickerCollectionDetailed = async (
  dataUrl: string,
  options: SplitStickerCollectionOptions = {},
): Promise<SplitStickerCollectionResult> => {
  const repairedDataUrl = await repairStickerTransparency(dataUrl, options);
  const snapshot = await loadImageSnapshot(repairedDataUrl);
  const expectedCount = options.expectedCount ? Math.max(2, Math.min(12, options.expectedCount)) : undefined;
  const imageArea = snapshot.width * snapshot.height;
  const mergeGap = Math.max(18, Math.round(Math.min(snapshot.width, snapshot.height) * 0.045));
  const minBoxArea = Math.max(256, imageArea * 0.0012);
  const componentBoxes = mergeBoxes(findOpaqueComponents(snapshot), mergeGap)
    .filter(box => (box.maxX - box.minX + 1) * (box.maxY - box.minY + 1) >= minBoxArea);
  let boxes = expectedCount ? splitByTransparentGutters(snapshot, expectedCount) : componentBoxes;

  if (expectedCount && boxes.length === 0) {
    boxes = componentBoxes;
  }

  if (expectedCount && boxes.length > expectedCount) {
    boxes = mergeClosestBoxesUntilCount(boxes, expectedCount);
  }

  if (!expectedCount && boxes.length <= 1) {
    const gutterBoxes = splitByTransparentGutters(snapshot, 6);
    if (gutterBoxes.length > boxes.length) boxes = gutterBoxes;
  }

  return {
    sourceDataUrl: repairedDataUrl,
    pieces: sortBoxesReadingOrder(boxes).map((box) => createSplitPiece(snapshot, box)),
  };
};

export const splitStickerCollectionByGridDetailed = async (
  dataUrl: string,
  options: GridSplitStickerCollectionOptions,
): Promise<SplitStickerCollectionResult> => {
  const repairedDataUrl = await repairStickerTransparency(dataUrl, options);
  const snapshot = await loadImageSnapshot(repairedDataUrl);
  const rows = Math.max(1, Math.min(6, Math.round(options.rows || 1)));
  const columns = Math.max(1, Math.min(6, Math.round(options.columns || 1)));
  const minArea = Math.max(96, (snapshot.width * snapshot.height) / (rows * columns) * 0.004);
  const boxes: ComponentBox[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const minX = Math.round((snapshot.width * column) / columns);
      const maxX = Math.round((snapshot.width * (column + 1)) / columns) - 1;
      const minY = Math.round((snapshot.height * row) / rows);
      const maxY = Math.round((snapshot.height * (row + 1)) / rows) - 1;
      const box = getOpaqueBoundsInRegion(snapshot, {
        minX: clamp(minX, 0, snapshot.width - 1),
        minY: clamp(minY, 0, snapshot.height - 1),
        maxX: clamp(maxX, 0, snapshot.width - 1),
        maxY: clamp(maxY, 0, snapshot.height - 1),
      });

      if (box && box.area >= minArea) {
        boxes.push(box);
      }
    }
  }

  return {
    sourceDataUrl: repairedDataUrl,
    pieces: boxes.map((box) => createSplitPiece(snapshot, box)),
  };
};

export const recropStickerFromSource = async (
  sourceDataUrl: string,
  baseBox: ImageCropBox,
  adjustments: CropAdjustments,
): Promise<string> => {
  const snapshot = await loadImageSnapshot(sourceDataUrl);
  const boxWidth = Math.max(1, baseBox.maxX - baseBox.minX + 1);
  const boxHeight = Math.max(1, baseBox.maxY - baseBox.minY + 1);
  const nextBox: ImageCropBox = {
    minX: Math.round(baseBox.minX + boxWidth * (adjustments.left / 100)),
    maxX: Math.round(baseBox.maxX - boxWidth * (adjustments.right / 100)),
    minY: Math.round(baseBox.minY + boxHeight * (adjustments.top / 100)),
    maxY: Math.round(baseBox.maxY - boxHeight * (adjustments.bottom / 100)),
  };

  const minDimension = 8;
  if (nextBox.maxX - nextBox.minX + 1 < minDimension) {
    const centerX = Math.round((nextBox.minX + nextBox.maxX) / 2);
    nextBox.minX = centerX - Math.floor(minDimension / 2);
    nextBox.maxX = nextBox.minX + minDimension - 1;
  }
  if (nextBox.maxY - nextBox.minY + 1 < minDimension) {
    const centerY = Math.round((nextBox.minY + nextBox.maxY) / 2);
    nextBox.minY = centerY - Math.floor(minDimension / 2);
    nextBox.maxY = nextBox.minY + minDimension - 1;
  }

  return cropSnapshotToDataUrl(snapshot, normalizeCropBox(snapshot, nextBox));
};

export const splitStickerCollection = async (
  dataUrl: string,
  options: SplitStickerCollectionOptions = {},
): Promise<string[]> => {
  const result = await splitStickerCollectionDetailed(dataUrl, options);
  return result.pieces.map((piece) => piece.dataUrl);
};
