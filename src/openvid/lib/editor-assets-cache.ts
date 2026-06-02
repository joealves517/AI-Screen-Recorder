const DB_NAME = "VidFlow-editor-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

export interface CachedAsset {
    id: string; // Unique identifier (e.g. background ID or canvas element ID)
    blob: Blob;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Opens IndexedDB connection for caching editor binary assets (images, canvas stickers, etc.)
 */
async function openDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
    });
}

/**
 * Save an editor asset (image background, canvas sticker) to IndexedDB cache
 */
export async function saveCachedAsset(id: string, file: Blob | File): Promise<CachedAsset> {
    try {
        const db = await openDB();
        
        const data: CachedAsset = {
            id,
            blob: file,
            fileName: file instanceof File ? file.name : `${id}.png`,
            fileSize: file.size,
            mimeType: file.type || "image/png",
            uploadedAt: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("[editor-assets-cache] Error saving asset to IndexedDB:", error);
        throw error;
    }
}

/**
 * Get an editor asset from IndexedDB cache by ID
 */
export async function getCachedAsset(id: string): Promise<CachedAsset | null> {
    try {
        const db = await openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("[editor-assets-cache] Error getting asset from IndexedDB:", error);
        return null;
    }
}

/**
 * Delete cached asset by ID
 */
export async function deleteCachedAsset(id: string): Promise<void> {
    try {
        const db = await openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("[editor-assets-cache] Error deleting asset from IndexedDB:", error);
        throw error;
    }
}

/**
 * Clear all cached assets
 */
export async function clearCachedAssets(): Promise<void> {
    try {
        const db = await openDB();
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error("[editor-assets-cache] Error clearing asset cache from IndexedDB:", error);
        throw error;
    }
}
