import JSZip from 'jszip';
import { GeneratedImage } from './types';

const dataUrlToBase64 = (dataUrl: string): string => dataUrl.split(',')[1] || '';

export const exportStickerZip = async (
  images: GeneratedImage[],
  folderName = 'stickers',
): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder(folderName) || zip;

  images.forEach((image, index) => {
    const fileIndex = String(index + 1).padStart(2, '0');
    folder.file(`sticker-${fileIndex}-${image.id}.png`, dataUrlToBase64(image.dataUrl), { base64: true });
  });

  return zip.generateAsync({ type: 'blob' });
};
