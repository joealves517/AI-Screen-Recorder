export interface UnifiedVideo {
    id: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    photographer: string;
    width: number;
    height: number;
}

const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || "";

// Map Pexels raw video format to VidFlow's UnifiedVideo format
const mapPexelsVideo = (video: any): UnifiedVideo => {
    // Find HD quality video file if available, otherwise fallback to the first available file
    const file = video.video_files.find((f: any) => f.quality === "hd") || video.video_files[0];
    return {
        id: `pexels-${video.id}`,
        videoUrl: file ? file.link : "",
        thumbnailUrl: video.image || (video.video_pictures && video.video_pictures[0]?.picture) || "",
        duration: video.duration || 0,
        photographer: video.user?.name || "Anonymous",
        width: video.width,
        height: video.height
    };
};

export async function fetchVideos(
    query: string,
    page = 1,
    perPage = 20
): Promise<UnifiedVideo[]> {
    try {
        const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const videos = data.videos || [];
        return videos.map(mapPexelsVideo);
    } catch (e) {
        console.error("Error fetching videos from Pexels client-side:", e);
        return [];
    }
}

export async function fetchPopularVideos(page = 1, perPage = 20): Promise<UnifiedVideo[]> {
    try {
        const res = await fetch(`https://api.pexels.com/videos/popular?page=${page}&per_page=${perPage}`, {
            headers: { Authorization: PEXELS_API_KEY }
        });
        if (!res.ok) return [];
        const data = await res.json();
        const videos = data.videos || [];
        return videos.map(mapPexelsVideo);
    } catch (e) {
        console.error("Error fetching popular videos from Pexels client-side:", e);
        return [];
    }
}

const searchCache = new Map<string, { videos: UnifiedVideo[]; timestamp: number }>();
const SEARCH_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

export async function fetchVideosWithCache(
    query: string,
    page = 1,
    perPage = 20
): Promise<UnifiedVideo[]> {
    const cacheKey = `${query}::${page}::${perPage}`;
    const cached = searchCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < SEARCH_TTL) {
        return cached.videos;
    }

    const videos = await fetchVideos(query, page, perPage);
    searchCache.set(cacheKey, { videos, timestamp: Date.now() });

    return videos;
}
