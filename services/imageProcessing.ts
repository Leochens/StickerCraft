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
  const x = clamp(box.minX - padding, 0, snapshot.width - 1);
  const y = clamp(box.minY - padding, 0, snapshot.height - 1);
  const right = clamp(box.maxX + padding, 0, snapshot.width - 1);
  const bottom = clamp(box.maxY + padding, 0, snapshot.height - 1);
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

const splitByGrid = (snapshot: CanvasSnapshot, expectedCount: number) => {
  const count = Math.max(2, Math.min(12, expectedCount));
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const cellWidth = snapshot.width / columns;
  const cellHeight = snapshot.height / rows;
  const inset = Math.round(Math.min(cellWidth, cellHeight) * 0.08);
  const boxes: ComponentBox[] = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    boxes.push({
      minX: Math.round(column * cellWidth) + inset,
      minY: Math.round(row * cellHeight) + inset,
      maxX: Math.round((column + 1) * cellWidth) - inset,
      maxY: Math.round((row + 1) * cellHeight) - inset,
      area: cellWidth * cellHeight,
    });
  }

  return boxes.map(box => cropBox(snapshot, box, 0));
};

export const splitStickerCollection = async (
  dataUrl: string,
  options: SplitStickerCollectionOptions = {},
): Promise<string[]> => {
  const repairedDataUrl = await repairStickerTransparency(dataUrl, options);
  const snapshot = await loadImageSnapshot(repairedDataUrl);
  const expectedCount = options.expectedCount ? Math.max(2, Math.min(12, options.expectedCount)) : undefined;
  const imageArea = snapshot.width * snapshot.height;
  const mergeGap = Math.max(18, Math.round(Math.min(snapshot.width, snapshot.height) * 0.045));
  const minBoxArea = Math.max(256, imageArea * 0.0012);
  let boxes = mergeBoxes(findOpaqueComponents(snapshot), mergeGap)
    .filter(box => (box.maxX - box.minX + 1) * (box.maxY - box.minY + 1) >= minBoxArea);

  if (expectedCount && boxes.length > expectedCount) {
    boxes = [...boxes]
      .sort((a, b) => b.area - a.area)
      .slice(0, expectedCount);
  }

  if (boxes.length <= 1 && expectedCount) {
    return splitByGrid(snapshot, expectedCount);
  }

  return sortBoxesReadingOrder(boxes).map((box) => {
    const boxWidth = box.maxX - box.minX + 1;
    const boxHeight = box.maxY - box.minY + 1;
    const padding = Math.max(10, Math.round(Math.max(boxWidth, boxHeight) * 0.1));
    return cropBox(snapshot, box, padding);
  });
};
