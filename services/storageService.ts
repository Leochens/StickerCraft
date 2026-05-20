import { GeneratedImage, StickerStyle } from "../types";

const DB_NAME = "StickerCraftDB";
const DB_VERSION = 1;
const GENERATED_IMAGES_STORE = "generatedImages";
const CUSTOM_STYLES_STORE = "customStyles";

const LEGACY_IMAGES_KEY = "stickerCraft_generatedImages";
const LEGACY_CUSTOM_STYLES_KEY = "stickerCraft_customStyles";

let generatedImagesSaveQueue = Promise.resolve();
let customStylesSaveQueue = Promise.resolve();

interface PersistedStickerCraftData {
  images: GeneratedImage[];
  customStyles: StickerStyle[];
}

const openStickerCraftDb = (): Promise<IDBDatabase> => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(GENERATED_IMAGES_STORE)) {
        db.createObjectStore(GENERATED_IMAGES_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(CUSTOM_STYLES_STORE)) {
        db.createObjectStore(CUSTOM_STYLES_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open StickerCraft database."));
  });
};

const getRequestResult = <T>(request: IDBRequest<T>): Promise<T> => (
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  })
);

const waitForTransaction = (transaction: IDBTransaction): Promise<void> => (
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  })
);

const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  const db = await openStickerCraftDb();

  try {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    return await getRequestResult<T[]>(store.getAll());
  } finally {
    db.close();
  }
};

const replaceStoreItems = async <T extends { id: string }>(storeName: string, items: T[]) => {
  const db = await openStickerCraftDb();

  try {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);

    store.clear();
    items.forEach((item) => store.put(item));

    await waitForTransaction(transaction);
  } finally {
    db.close();
  }
};

const readLegacyCollection = <T>(key: string): T[] => {
  if (typeof localStorage === "undefined") return [];

  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Failed to read legacy ${key} data.`, error);
    return [];
  }
};

const removeLegacyKey = (key: string) => {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(key);
};

const mergeById = <T extends { id: string }>(primary: T[], secondary: T[]) => {
  const knownIds = new Set(primary.map((item) => item.id));
  const merged = [...primary];

  secondary.forEach((item) => {
    if (!knownIds.has(item.id)) {
      knownIds.add(item.id);
      merged.push(item);
    }
  });

  return merged;
};

const sortImagesNewestFirst = (images: GeneratedImage[]) => (
  [...images].sort((a, b) => b.createdAt - a.createdAt)
);

const loadLegacyData = (): PersistedStickerCraftData => ({
  images: sortImagesNewestFirst(readLegacyCollection<GeneratedImage>(LEGACY_IMAGES_KEY)),
  customStyles: readLegacyCollection<StickerStyle>(LEGACY_CUSTOM_STYLES_KEY),
});

export const loadPersistedStickerCraftData = async (): Promise<PersistedStickerCraftData> => {
  const legacyData = loadLegacyData();

  try {
    let images = sortImagesNewestFirst(await getAllFromStore<GeneratedImage>(GENERATED_IMAGES_STORE));
    let customStyles = await getAllFromStore<StickerStyle>(CUSTOM_STYLES_STORE);

    if (legacyData.images.length > 0) {
      images = sortImagesNewestFirst(mergeById(images, legacyData.images));
      await replaceStoreItems(GENERATED_IMAGES_STORE, images);
      removeLegacyKey(LEGACY_IMAGES_KEY);
    }

    if (legacyData.customStyles.length > 0) {
      customStyles = mergeById(customStyles, legacyData.customStyles);
      await replaceStoreItems(CUSTOM_STYLES_STORE, customStyles);
      removeLegacyKey(LEGACY_CUSTOM_STYLES_KEY);
    }

    return { images, customStyles };
  } catch (error) {
    console.warn("IndexedDB load failed. Falling back to legacy localStorage data.", error);
    return legacyData;
  }
};

export const saveGeneratedImages = async (images: GeneratedImage[]) => {
  const nextImages = sortImagesNewestFirst(images);
  generatedImagesSaveQueue = generatedImagesSaveQueue
    .catch(() => undefined)
    .then(() => replaceStoreItems(GENERATED_IMAGES_STORE, nextImages));

  await generatedImagesSaveQueue;
};

export const saveCustomStyles = async (customStyles: StickerStyle[]) => {
  const nextCustomStyles = [...customStyles];
  customStylesSaveQueue = customStylesSaveQueue
    .catch(() => undefined)
    .then(() => replaceStoreItems(CUSTOM_STYLES_STORE, nextCustomStyles));

  await customStylesSaveQueue;
};
