const DB_NAME = "VidFlow-uploaded-audios";
const DB_VERSION = 1;
const STORE_NAME = "audios";

export interface CachedUploadedAudio {
    id: string; // Unique audio identifier (e.g. audio-1779...)
    blob: Blob;
    fileName: string;
    fileSize: number;
    mimeType: string;
    duration: number;
    uploadedAt: number;
}

let dbInstance: IDBDatabase | null = null;

/**
 * Opens IndexedDB connection for caching uploaded or generated audios
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
 * Save an uploaded or generated audio file to IndexedDB cache
 */
export async function saveCachedAudio(id: string, file: Blob | File, duration: number): Promise<CachedUploadedAudio> {
    try {
        const db = await openDB();
        
        const data: CachedUploadedAudio = {
            id,
            blob: file,
            fileName: file instanceof File ? file.name : `${id}.mp3`,
            fileSize: file.size,
            mimeType: file.type || "audio/mpeg",
            duration,
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
        console.error("[audio-cache] Error saving audio to IndexedDB:", error);
        throw error;
    }
}

/**
 * Get an audio file from IndexedDB cache by ID
 */
export async function getCachedAudio(id: string): Promise<CachedUploadedAudio | null> {
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
        console.error("[audio-cache] Error getting audio from IndexedDB:", error);
        return null;
    }
}

/**
 * Delete cached audio file by ID
 */
export async function deleteCachedAudio(id: string): Promise<void> {
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
        console.error("[audio-cache] Error deleting audio from IndexedDB:", error);
        throw error;
    }
}

/**
 * Clear all cached audio files
 */
export async function clearCachedAudios(): Promise<void> {
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
        console.error("[audio-cache] Error clearing audio cache from IndexedDB:", error);
        throw error;
    }
}
