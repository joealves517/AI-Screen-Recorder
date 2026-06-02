"use client";

import { Icon } from "@iconify/react";
import { useCallback, useRef, useState, useEffect } from "react";
import type { AudioMenuProps, AudioTrack } from "@/types/audio.types";
import { AudioTrimModal } from "./AudioTrimModal";
import { Button } from "@/components/ui/button";
import { TooltipAction } from "@/components/ui/tooltip-action";
import { TrackVolumeSlider } from "@/components/ui/TrackVolumeSlider";
import { useTranslations } from "next-intl";
import { gooeyToast } from "goey-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";

interface StockAudio {
  id: string;
  name: string;
  artist: string;
  url: string;
  duration: number;
  category: "lofi" | "tech" | "epic" | "acoustic";
  tags: string[];
}

const STOCK_AUDIOS: StockAudio[] = [
  {
    id: "lofi-1",
    name: "Dreamy Lofi Chill",
    artist: "Lofi Dreamer",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 372,
    category: "lofi",
    tags: ["lofi", "chill", "relax", "dreamy", "background", "study"]
  },
  {
    id: "lofi-2",
    name: "Late Night Study Cafe",
    artist: "Chill Beats",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 423,
    category: "lofi",
    tags: ["lofi", "chill", "cafe", "night", "study", "relax"]
  },
  {
    id: "lofi-3",
    name: "Lofi Raindrops",
    artist: "Rainy Day",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    duration: 385,
    category: "lofi",
    tags: ["lofi", "chill", "rain", "soft", "study", "relax"]
  },
  {
    id: "tech-1",
    name: "Startup Corporate Upbeat",
    artist: "Modern Pulse",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    duration: 302,
    category: "tech",
    tags: ["tech", "upbeat", "corporate", "business", "modern", "energetic"]
  },
  {
    id: "tech-2",
    name: "Digital Marketing Tech",
    artist: "Groove Factory",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    duration: 341,
    category: "tech",
    tags: ["tech", "upbeat", "marketing", "digital", "modern", "groove"]
  },
  {
    id: "tech-3",
    name: "Future Innovation",
    artist: "Electro Lab",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    duration: 318,
    category: "tech",
    tags: ["tech", "electronic", "future", "innovation", "energetic", "modern"]
  },
  {
    id: "epic-1",
    name: "Epic Cinematic Inspiration",
    artist: "Orchestra Hall",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    duration: 362,
    category: "epic",
    tags: ["epic", "cinematic", "inspiration", "orchestra", "trailer", "grand"]
  },
  {
    id: "epic-2",
    name: "Cinematic Atmosphere",
    artist: "Space Voyager",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    duration: 412,
    category: "epic",
    tags: ["epic", "cinematic", "atmosphere", "space", "ambient", "drama"]
  },
  {
    id: "acoustic-1",
    name: "Sunny Morning Folk",
    artist: "Guitar Acoustic",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    duration: 310,
    category: "acoustic",
    tags: ["acoustic", "guitar", "folk", "sunny", "happy", "morning"]
  },
  {
    id: "acoustic-2",
    name: "Acoustic Sunset Road",
    artist: "Country Road",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    duration: 388,
    category: "acoustic",
    tags: ["acoustic", "guitar", "sunset", "road", "calm", "nostalgic"]
  }
];

const API_BASE = (import.meta.env?.VITE_API_BASE || "https://openvid-backend-676582412453.us-central1.run.app").replace(/\/$/, "");

// Helper to download external files via our robust Cloud Run CORS Proxy
const fetchExternalResource = async (url: string): Promise<Blob> => {
  try {
    const proxyUrl = `${API_BASE}/api/proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`Proxy fetch failed (HTTP ${res.status})`);
    return await res.blob();
  } catch (error) {
    console.warn("Proxy download failed, trying native fetch fallback:", error);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.blob();
  }
};

export function AudioMenu({
    audioTracks,
    uploadedAudios,
    videoDuration,
    onAudioUpload,
    onUpdateAudioTrack,
    onDeleteAudioTrack,
}: AudioMenuProps) {
    const t = useTranslations("audioMenu");
    const { user } = useAuth();
    const { credits } = useCredits();
    const isPremium = credits?.tier === "premium";
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [trimModalOpen, setTrimModalOpen] = useState(false);
    const [trimModalTrack, setTrimModalTrack] = useState<AudioTrack | null>(null);

    // Curated Stock Music integration states
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const [downloadingAudioId, setDownloadingAudioId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [musicSearchQuery, setMusicSearchQuery] = useState("");
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize a single reusable Audio instance in the browser
        if (typeof window !== "undefined") {
            audioPlayerRef.current = new Audio();
        }
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.src = "";
                audioPlayerRef.current = null;
            }
        };
    }, []);

    const handlePlayPause = (track: StockAudio) => {
        const player = audioPlayerRef.current;
        if (!player) return;

        if (playingAudioId === track.id) {
            // Instant UI feedback: stop loading/playing immediately
            setPlayingAudioId(null);
            player.pause();
            player.src = ""; // Abort current network buffer immediately
        } else {
            // Instant UI feedback: show pause icon immediately so user knows it's loading/playing
            setPlayingAudioId(track.id);
            player.pause();
            
            // Direct playback from URL for maximum speed
            player.src = track.url;
            player.load();
            
            player.play()
                .catch(e => {
                    console.warn("Direct playback failed, trying secure proxy fallback:", e);
                    // Fallback only if the user hasn't toggled playback off in the meantime
                    try {
                        const proxyPlayUrl = `${API_BASE}/api/proxy?url=${encodeURIComponent(track.url)}`;
                        player.src = proxyPlayUrl;
                        player.load();
                        player.play().catch(err => console.error("Proxy playback failed:", err));
                    } catch (proxyError) {
                        console.error("Proxy fallback failed:", proxyError);
                    }
                });

            player.onended = () => {
                setPlayingAudioId(null);
                player.src = "";
            };
        }
    };

    const handleAddStockAudio = async (track: StockAudio) => {
        if (!user) {
            gooeyToast.error("Authentication Required", {
                description: "Please sign in to add stock media to the editor.",
                duration: 10000,
                showProgress: true,
                action: {
                    label: "Sign In",
                    onClick: () => {
                        window.location.href = window.location.pathname === '/' ? '/index.html?page=login' : window.location.pathname + '?page=login';
                    }
                }
            });
            return;
        }

        if (!isPremium) {
            gooeyToast.error("Premium Feature", {
                description: "Pexels stock media is only available for Pro members. Please upgrade to continue.",
                duration: 10000,
                showProgress: true,
                action: {
                    label: "Upgrade Now",
                    onClick: () => {
                        window.open("https://graphosai.lemonsqueezy.com/checkout/buy/2a8c453e-7b12-4743-bf50-8571c9cfae30?embed=1", "_blank");
                    }
                }
            });
            return;
        }

        if (downloadingAudioId) return;
        setDownloadingAudioId(track.id);
        
        // Stop playing if it's currently playing
        if (playingAudioId === track.id && audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            setPlayingAudioId(null);
        }

        try {
            const blob = await fetchExternalResource(track.url);
            const file = new File([blob], `${track.name}.mp3`, { type: "audio/mpeg" });
            onAudioUpload(file);
        } catch (error) {
            console.error("Error adding stock audio:", error);
            gooeyToast.error("Failed to download stock music", { description: "Cannot load this audio file from external source due to CORS error. Tested background proxy but failed." });
        } finally {
            setDownloadingAudioId(null);
        }
    };

    const filteredStockAudios = STOCK_AUDIOS.filter(audio => {
        const matchesCategory = selectedCategory === "all" || audio.category === selectedCategory;
        
        const query = musicSearchQuery.toLowerCase().trim();
        const matchesSearch = !query || 
            audio.name.toLowerCase().includes(query) ||
            audio.artist.toLowerCase().includes(query) ||
            audio.tags.some(tag => tag.toLowerCase().includes(query));

        return matchesCategory && matchesSearch;
    });

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const SUPPORTED_AUDIO_FORMATS = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
            'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'
        ];

        if (!SUPPORTED_AUDIO_FORMATS.includes(file.type) &&
            !['.mp3', '.wav', '.ogg', '.aac', '.m4a'].some(ext => file.name.toLowerCase().endsWith(ext))) {
            gooeyToast.error("Audio format not supported", { description: "Please use MP3, WAV, OGG, AAC or M4A." });
            return;
        }

        const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_AUDIO_FILE_SIZE) {
            gooeyToast.error("File is too large", { description: "The maximum allowed size is 10MB." });
            return;
        }

        onAudioUpload(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, [onAudioUpload]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const SUPPORTED_AUDIO_FORMATS = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
            'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'
        ];
        if (!SUPPORTED_AUDIO_FORMATS.includes(file.type) &&
            !['.mp3', '.wav', '.ogg', '.aac', '.m4a'].some(ext => file.name.toLowerCase().endsWith(ext))) {
            gooeyToast.error("Audio format not supported", { description: "Please use MP3, WAV, OGG, AAC or M4A." });
            return;
        }
        const MAX_AUDIO_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_AUDIO_FILE_SIZE) {
            gooeyToast.error("File is too large", { description: "The maximum allowed size is 10MB." });
            return;
        }
        onAudioUpload(file);
    }, [onAudioUpload]);

    return (
        <div className="p-4 flex flex-col gap-4 h-full overflow-hidden">
            <div className="flex items-center gap-2 text-white font-medium shrink-0">
                <Icon icon="mdi:volume-high" width="20" aria-hidden="true" />
                <span>{t("title")}</span>
            </div>

            <div
                className={`flex flex-col items-center justify-center w-full rounded-lg transition-colors shrink-0 ${isDragOver ? "bg-blue-500/10 ring-1 ring-blue-500/40" : ""
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.ogg,.aac,.m4a,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label={t("uploadButton")}
                />
                <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t("uploadButton")}
                >
                    <Icon icon="mdi:upload" width="14" />
                    <span>{t("uploadButton")}</span>
                </Button>
                <p className="text-xs text-white/40 mt-2 text-center">
                    {t("uploadHint")}
                </p>
            </div>

            {/* Timeline Tracks Group - Independent Scrollable Area */}
            <div className="shrink-0 max-h-[160px] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                {audioTracks.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        <div className="text-xs font-medium text-white/60 flex items-center gap-2">
                            <Icon icon="mdi:timeline-clock" width="14" />
                            <span>{t("timelineTracks", { count: audioTracks.length })}</span>
                        </div>
                        <div className="flex flex-col gap-2 animate-fade-in">
                            {audioTracks.map((track) => {
                                const isSelected = selectedTrackId === track.id;
                                const exceedsVideoDuration = (track.startTime + track.duration) > videoDuration;

                                return (
                                    <div
                                        key={track.id}
                                        className={`bg-[#09090B] border squircle-element p-3 transition-all cursor-pointer ${isSelected
                                            ? "border-blue-500/50 bg-blue-500/5"
                                            : "border-white/5 hover:border-white/10"
                                            }`}
                                        onClick={() => setSelectedTrackId(isSelected ? null : track.id)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-white font-medium truncate">
                                                    {track.name}
                                                </div>
                                                <div className="text-xs text-white/40 mt-0.5">
                                                    {t("start")}: {formatDuration(track.startTime)} • {t("duration")}: {formatDuration(track.duration)}
                                                </div>
                                                {exceedsVideoDuration && (
                                                    <div className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                                                        <Icon icon="mdi:alert" width="12" />
                                                        {t("exceedsDuration")}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TooltipAction label={t("trimAction")}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setTrimModalTrack(track);
                                                            setTrimModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                                    >
                                                        <Icon icon="mdi:content-cut" width="16" />
                                                    </button>
                                                </TooltipAction>
                                                <TooltipAction label={t("deleteAction")}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteAudioTrack(track.id);
                                                            if (selectedTrackId === track.id) {
                                                                setSelectedTrackId(null);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <Icon icon="material-symbols:delete-outline-rounded" width="16" />
                                                    </button>
                                                </TooltipAction>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="flex flex-col gap-3 pt-2 border-t border-white/5 animate-in fade-in duration-150">
                                                <TrackVolumeSlider
                                                    track={track}
                                                    onUpdateAudioTrack={onUpdateAudioTrack}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 px-4 text-white/40" role="status">
                        <Icon icon="mdi:music-note-off" width="30" className="mx-auto mb-2 opacity-30" aria-hidden="true" />
                        <p className="text-xs font-medium">{t("noTracks")}</p>
                        <p className="text-[9px] mt-0.5">{t("noTracksHint")}</p>
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="h-px bg-white/10 shrink-0" />

            {/* Curated Stock Music Library - Independent Scrollable Area */}
            <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-fade-in">
                <div className="flex items-center gap-2 text-white/80 font-medium text-xs uppercase tracking-wider shrink-0">
                    <Icon icon="mdi:music-box-multiple-outline" width="16" className="text-white/50" />
                    <span>{t("stockMusic.title")}</span>
                </div>

                {/* Search Input */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#09090B] border border-white/10 focus-within:border-white/20 transition-colors shrink-0">
                    <Icon icon="ph:magnifying-glass-bold" width="13" className="text-white/30 shrink-0" aria-hidden="true" />
                    <input
                        type="text"
                        value={musicSearchQuery}
                        onChange={(e) => setMusicSearchQuery(e.target.value)}
                        placeholder={t("stockMusic.searchPlaceholder")}
                        className="flex-1 bg-transparent text-[12px] text-white/80 placeholder:text-white/30 outline-none"
                        aria-label={t("stockMusic.searchPlaceholder")}
                    />
                    {musicSearchQuery && (
                        <button 
                            onClick={() => setMusicSearchQuery("")} 
                            className="text-white/30 hover:text-white/60 transition-colors" 
                            aria-label="Clear search"
                        >
                            <Icon icon="mdi:close" width="13" aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/* Categories badges */}
                <div className="flex flex-wrap gap-1.5 shrink-0">
                    {["all", "lofi", "tech", "epic", "acoustic"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all border ${
                                selectedCategory === cat
                                    ? "bg-white/15 border-white/30 text-white/90"
                                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
                            }`}
                        >
                            {t(`stockMusic.categories.${cat}`)}
                        </button>
                    ))}
                </div>

                {/* Audio Tracks List - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                    {filteredStockAudios.map((track) => {
                        const isPlaying = playingAudioId === track.id;
                        const isDownloading = downloadingAudioId === track.id;
                        return (
                            <div
                                key={track.id}
                                className="group flex items-center justify-between gap-3 bg-[#09090B] border border-white/5 hover:border-white/10 squircle-element p-2.5 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Play/Pause Button */}
                                    <button
                                        onClick={() => handlePlayPause(track)}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                                            isPlaying 
                                                ? "bg-blue-500/20 border-blue-500/40 text-blue-400 scale-105" 
                                                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                                        }`}
                                    >
                                        <Icon 
                                            icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"} 
                                            width="16" 
                                            className={isPlaying ? "animate-pulse" : ""}
                                        />
                                    </button>

                                    {/* Title and artist */}
                                    <div className="min-w-0">
                                        <p className="text-xs text-white/80 font-medium truncate">
                                            {track.name}
                                        </p>
                                        <p className="text-[10px] text-white/40 truncate mt-0.5">
                                            {track.artist}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] font-mono text-white/30">
                                        {formatDuration(track.duration)}
                                    </span>
                                    
                                    {isDownloading ? (
                                        <div className="w-16 flex justify-center items-center">
                                            <Icon icon="svg-spinners:ring-resize" width="16" className="text-blue-400" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleAddStockAudio(track)}
                                            className="h-7 px-2.5 text-[10px] font-bold tracking-wider uppercase bg-white/5 border border-white/10 text-white/70 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer"
                                        >
                                            <Icon icon="material-symbols:add-rounded" width="12" className="mr-0.5" />
                                            {t("stockMusic.addButton")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {trimModalOpen && trimModalTrack && (() => {
                const originalAudio = uploadedAudios.find(a => a.id === trimModalTrack.audioId);
                if (!originalAudio) return null;

                return (
                    <AudioTrimModal
                        key={trimModalTrack.id}
                        isOpen={trimModalOpen}
                        audioName={trimModalTrack.name}
                        audioUrl={originalAudio.url}
                        audioDuration={originalAudio.duration}
                        initialTrimStart={trimModalTrack.trimStart ?? 0}
                        initialTrimEnd={(trimModalTrack.trimStart ?? 0) + trimModalTrack.duration}
                        onConfirm={(trimStart, trimEnd) => {
                            onUpdateAudioTrack(trimModalTrack.id, {
                                duration: trimEnd - trimStart,
                                trimStart: trimStart,
                            });
                            setTrimModalOpen(false);
                            setTrimModalTrack(null);
                        }}
                        onCancel={() => {
                            setTrimModalOpen(false);
                            setTrimModalTrack(null);
                        }}
                    />
                );
            })()}
        </div>
    );
}