export interface UnifiedPhoto {
    id: string;
    urls: {
        regular: string;
        small: string;
    };
    alt: string;
    photographer: string;
    color: string;
    width: number;
    height: number;
}

// Retrived Pexels API Key from Geo Trivia X project to enable client-side offline querying
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || "";

// Map Pexels raw photo format to VidFlow's UnifiedPhoto format
const mapPexelsPhoto = (photo: any): UnifiedPhoto => ({
    id: `pexels-${photo.id}`,
    urls: {
        regular: photo.src.large2x || photo.src.large || photo.src.original,
        small: photo.src.small || photo.src.tiny
    },
    alt: photo.alt || "Pexels Photo",
    photographer: photo.photographer || "Anonymous",
    color: photo.avg_color || "#000000",
    width: photo.width,
    height: photo.height
});

export async function fetchPhotos(
    query: string,
    page = 1,
    perPage = 20
): Promise<UnifiedPhoto[]> {
    try {
        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const photos = data.photos || [];
        return photos.map(mapPexelsPhoto);
    } catch (e) {
        console.error("Error fetching photos from Pexels client-side:", e);
        return [];
    }
}

export async function fetchDiscoveryPhotos(): Promise<UnifiedPhoto[]> {
    try {
        const res = await fetch(`https://api.pexels.com/v1/curated?page=1&per_page=20`, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const photos = data.photos || [];
        return photos.map(mapPexelsPhoto);
    } catch (e) {
        console.error("Error fetching curated photos from Pexels client-side:", e);
        return [];
    }
}

const searchCache = new Map<string, { photos: UnifiedPhoto[]; timestamp: number }>();
const SEARCH_TTL = 10 * 60 * 1000;

export async function fetchPhotosWithCache(
    query: string,
    page = 1,
    perPage = 20
): Promise<UnifiedPhoto[]> {
    const cacheKey = `${query}::${page}::${perPage}`;
    const cached = searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < SEARCH_TTL) {
        return cached.photos;
    }

    const photos = await fetchPhotos(query, page, perPage);
    searchCache.set(cacheKey, { photos, timestamp: Date.now() });

    return photos;
}

