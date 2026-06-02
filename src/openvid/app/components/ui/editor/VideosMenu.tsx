"use client";
import { Icon } from "@iconify/react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { gooeyToast } from "goey-toast";
import { TooltipAction } from "@/components/ui/tooltip-action";
import {
  deleteLibraryVideo,
  getLibraryVideo,
  updateVideoAudioState,
  formatFileSize,
  formatVideoDuration,
  getLibraryVideoInfoList,
  addVideoToLibraryWithMetadata,
} from "@/lib/videos-library";
import { LibraryVideoInfo } from "@/types";
import { fetchPopularVideos, fetchVideosWithCache, type UnifiedVideo } from "@/lib/video-providers";

const PEXELS_VIDEO_BADGES = [
  { id: "nature", key: "nature_landscape" },
  { id: "neon city", key: "neon_city" },
  { id: "minimal abstract", key: "minimal_abstract" },
  { id: "gradient", key: "gradient_wallpaper" },
  { id: "dark wallpaper", key: "dark_wallpaper" }
];

interface VideosMenuProps {
  onAddToTrack?: (videoId: string, blob: Blob, duration: number) => void;
  onRemoveFromTrack?: (videoId: string) => void;
  onVideoUpload?: (file: File) => void;
  onVideoDeleteFromTrack?: (videoId: string) => void;
  videosInTrackIds?: string[];
  refreshTrigger?: number;
  isUploading?: boolean;
  onVideoAudioToggle?: (videoId: string, hasAudio: boolean) => void;
}

export function VideosMenu({
  onAddToTrack,
  onRemoveFromTrack,
  onVideoUpload,
  onVideoDeleteFromTrack,
  videosInTrackIds = [],
  refreshTrigger,
  isUploading = false,
  onVideoAudioToggle,
}: VideosMenuProps) {
  const t = useTranslations("videosMenu");
  const { user } = useAuth();
  const { credits } = useCredits();
  const isPremium = credits?.tier === "premium";

  const [videos, setVideos] = useState<LibraryVideoInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pexels Videos integration states
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [activePexelsQuery, setActivePexelsQuery] = useState("");
  const [pexelsVideos, setPexelsVideos] = useState<UnifiedVideo[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsPage, setPexelsPage] = useState(1);
  const [pexelsHasMore, setPexelsHasMore] = useState(true);
  const [isPexelsSearchMode, setIsPexelsSearchMode] = useState(false);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(null);

  const debouncePexelsRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPopularVideos = useCallback(async () => {
    setPexelsLoading(true);
    try {
      const results = await fetchPopularVideos(1, 12);
      setPexelsVideos(results);
      setPexelsHasMore(results.length === 12);
      setPexelsPage(1);
    } catch (e) {
      console.error("Error loading popular videos:", e);
    } finally {
      setPexelsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPopularVideos();
  }, [loadPopularVideos]);

  useEffect(() => {
    if (!activePexelsQuery) {
      setIsPexelsSearchMode(false);
      loadPopularVideos();
      return;
    }

    setIsPexelsSearchMode(true);
    setPexelsPage(1);
    setPexelsLoading(true);

    fetchVideosWithCache(activePexelsQuery, 1, 12).then((results) => {
      setPexelsVideos(results);
      setPexelsHasMore(results.length === 12);
      setPexelsLoading(false);
    });
  }, [activePexelsQuery, loadPopularVideos]);

  const handlePexelsLoadMore = async () => {
    if (pexelsLoading || !pexelsHasMore) return;
    const nextPage = pexelsPage + 1;
    setPexelsLoading(true);
    try {
      let results: UnifiedVideo[] = [];
      if (isPexelsSearchMode) {
        results = await fetchVideosWithCache(activePexelsQuery, nextPage, 12);
      } else {
        results = await fetchPopularVideos(nextPage, 12);
      }
      setPexelsVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        return [...prev, ...results.filter((v) => !seen.has(v.id))];
      });
      setPexelsHasMore(results.length === 12);
      setPexelsPage(nextPage);
    } catch (e) {
      console.error("Error loading more videos:", e);
    } finally {
      setPexelsLoading(false);
    }
  };

  const handlePexelsVideoSelect = async (video: UnifiedVideo) => {
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

    if (downloadingVideoId) return;
    setDownloadingVideoId(video.id);
    try {
      const res = await fetch(video.videoUrl);
      if (!res.ok) throw new Error("Failed to download Pexels video");
      const blob = await res.blob();

      const fileName = `Pexels - ${video.photographer} - ${video.id.split("-")[1]}.mp4`;
      const savedVideo = await addVideoToLibraryWithMetadata({
        blob,
        fileName,
        duration: video.duration,
        width: video.width,
        height: video.height,
        hasAudio: false,
      });

      await loadVideos();

      if (onAddToTrack) {
        onAddToTrack(savedVideo.id, savedVideo.blob, savedVideo.duration);
      }
    } catch (error) {
      console.error("Error adding Pexels video to library:", error);
    } finally {
      setDownloadingVideoId(null);
    }
  };

  const handlePexelsBadgeClick = (badge: string) => {
    setPexelsQuery(badge);
    setActivePexelsQuery(badge);
  };

  const handlePexelsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPexelsQuery(val);

    if (debouncePexelsRef.current) clearTimeout(debouncePexelsRef.current);

    if (val.trim().length >= 2) {
      debouncePexelsRef.current = setTimeout(() => {
        setActivePexelsQuery(val.trim());
      }, 600);
    } else if (val.trim().length === 0) {
      setActivePexelsQuery("");
    }
  };

  const handlePexelsInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && pexelsQuery.trim()) {
      setActivePexelsQuery(pexelsQuery.trim());
    }
  };

  const handlePexelsClear = () => {
    setPexelsQuery("");
    setActivePexelsQuery("");
  };

  const loadVideos = useCallback(async () => {
    try {
      const videoList = await getLibraryVideoInfoList();
      setVideos(videoList);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos, refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteLibraryVideo(id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      onVideoDeleteFromTrack?.(id);
    } catch (error) {
      console.error("Error deleting video:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddToTrack = async (id: string) => {
    if (addingId || !onAddToTrack) return;
    setAddingId(id);
    try {
      const video = await getLibraryVideo(id);
      if (video) {
        onAddToTrack(video.id, video.blob, video.duration);
      }
    } catch (error) {
      console.error("Error adding video to track:", error);
    } finally {
      setAddingId(null);
    }
  };

  const handleToggleAudio = async (id: string, currentHasAudio: boolean | undefined) => {
    try {
      const newHasAudio = !(currentHasAudio ?? true);
      await updateVideoAudioState(id, newHasAudio);
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, hasAudio: newHasAudio } : v)));
      onVideoAudioToggle?.(id, newHasAudio);
    } catch (error) {
      console.error("Error toggling audio state:", error);
    }
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onVideoUpload) {
        onVideoUpload(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onVideoUpload]
  );

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/") && onVideoUpload) {
      onVideoUpload(file);
    }
  };

  return (
    <div
      className="p-4 flex flex-col gap-4 h-full relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#09090B]/90 backdrop-blur-sm border-2 border-blue-500 border-dashed rounded-xl m-2"
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-14 h-14 rounded-full bg-blue-500/20 border flex items-center justify-center border-blue-500/50 text-blue-400 mb-4 scale-110">
              <Icon icon="solar:upload-minimalistic-bold" className="text-2xl" />
            </div>
            <p className="text-blue-400 font-medium text-sm">{t("dropzone")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />

      <div className="flex items-center gap-2 text-white font-medium shrink-0">
        <Icon icon="solar:video-library-outline" width="20" aria-hidden="true" />
        <span>{t("title")}</span>
      </div>

      {/* User uploaded videos (Local) - Independent Scrollable Area */}
      <div className="shrink-0 max-h-[180px] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-6" role="status">
            <Icon icon="svg-spinners:ring-resize" width="20" className="text-white/40" aria-hidden="true" />
          </div>
        ) : videos.length === 0 ? (
          <div
            onClick={triggerFileUpload}
            className="group bg-[#09090B] border border-dashed border-white/10 hover:border-white/30 hover:bg-white/3 squircle-element p-5 text-center cursor-pointer transition-colors"
            role="button"
            tabIndex={0}
            aria-label={t("emptyState.title")}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerFileUpload(); } }}
          >
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
              <Icon
                icon="solar:upload-minimalistic-outline"
                width="20"
                className="text-white/40 group-hover:text-white/70 transition-colors"
                aria-hidden="true"
              />
            </div>
            <p className="text-xs font-medium text-white/70 mb-0.5">{t("emptyState.title")}</p>
            <p className="text-[10px] text-white/40 mb-3">{t("emptyState.instruction")}</p>
            <Button disabled={isUploading} variant="outline" className="w-full text-[10px] h-8">
              {isUploading ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" width="12" />
                  <span>{t("upload.status")}</span>
                </>
              ) : (
                <span>{t("upload.action")}</span>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              onClick={triggerFileUpload}
              disabled={isUploading}
              variant="outline"
              className="w-full text-xs mb-2 group shrink-0"
            >
              {isUploading ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" width="16" />
                  <span className="text-sm">{t("upload.status")}</span>
                </>
              ) : (
                <>
                  <Icon
                    icon="solar:upload-minimalistic-outline"
                    width="16"
                    className="group-hover:-translate-y-0.5 transition-transform"
                  />
                  <span className="text-sm">{t("upload.button")}</span>
                </>
              )}
            </Button>

            <AnimatePresence mode="popLayout">
              {videos.map((video) => (
                <motion.div
                  key={video.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className={`group bg-[#09090B] border squircle-element overflow-hidden transition-colors ${
                    videosInTrackIds.includes(video.id)
                      ? "border-blue-500/50 bg-blue-500/5"
                      : "border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex gap-3 p-2.5 items-center">
                    <div
                      className="relative w-20 h-12 rounded-md overflow-hidden bg-black/50 shrink-0 cursor-pointer"
                      onClick={() => {
                        if (!addingId) {
                          videosInTrackIds.includes(video.id) ? onRemoveFromTrack?.(video.id) : handleAddToTrack(video.id);
                        }
                      }}
                    >
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.fileName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon icon="solar:play-bold" width="20" className="text-white/30" />
                        </div>
                      )}
                      <div className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/70 rounded text-[9px] font-mono text-white/80">
                        {formatVideoDuration(video.duration)}
                      </div>
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-all ${
                          videosInTrackIds.includes(video.id) ? "bg-blue-500/10 opacity-100" : "bg-black/60 opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {addingId === video.id ? (
                          <Icon icon="svg-spinners:ring-resize" width="20" className="text-white" />
                        ) : videosInTrackIds.includes(video.id) ? (
                          <Icon icon="solar:check-circle-bold" width="20" className="text-blue-400" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className={` flex items-center gap-0.5 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-2xl transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105 `}
                            >
                              <Icon icon="material-symbols:add-rounded" width="16" className="text-white drop-shadow-md" />
                              <span className="text-[9px] font-bold text-white tracking-wider">{t("actions.add")}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-xs text-white/80 truncate" title={video.fileName}>
                        {video.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/40">{formatFileSize(video.fileSize)}</span>
                        <span className="text-[10px] text-white/30">•</span>
                        <span className="text-[10px] text-white/40">
                          {video.width}×{video.height}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipAction label={video.hasAudio === false ? t("actions.unmute") : t("actions.mute")}>
                        <button
                          onClick={() => handleToggleAudio(video.id, video.hasAudio)}
                          disabled={video.originalHasAudio === false}
                          className={`p-1.5 rounded-md transition-colors ${
                            video.originalHasAudio === false
                              ? "text-white/10 cursor-not-allowed"
                              : video.hasAudio === false
                              ? "text-red-400 bg-red-500/10"
                              : "text-white/40 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Icon
                            icon={video.hasAudio === false ? "solar:volume-cross-outline" : "solar:volume-loud-outline"}
                            width="16"
                          />
                        </button>
                      </TooltipAction>
                      <TooltipAction label={t("actions.delete")}>
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={deletingId === video.id}
                          className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          {deletingId === video.id ? (
                            <Icon icon="svg-spinners:ring-resize" width="16" />
                          ) : (
                            <Icon icon="solar:trash-bin-trash-outline" width="16" />
                          )}
                        </button>
                      </TooltipAction>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="h-px bg-white/10 shrink-0" />

      {/* Pexels stock videos - Independent Scrollable Area */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white/80 font-medium text-xs uppercase tracking-wider">
            <Icon icon="solar:globus-outline" width="16" className="text-white/50" />
            <span>{t("pexels.title")}</span>
          </div>
          {isPexelsSearchMode && (
            <span className="text-[10px] text-white/30 truncate max-w-[120px]">
              "{activePexelsQuery}"
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#09090B] border border-white/10 focus-within:border-white/20 transition-colors shrink-0">
          <Icon icon="ph:magnifying-glass-bold" width="13" className="text-white/30 shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={pexelsQuery}
            onChange={handlePexelsInputChange}
            onKeyDown={handlePexelsInputKeyDown}
            placeholder={t("pexels.searchPlaceholder")}
            className="flex-1 bg-transparent text-[12px] text-white/80 placeholder:text-white/30 outline-none"
            aria-label={t("pexels.searchPlaceholder")}
          />
          {pexelsQuery && (
            <button onClick={handlePexelsClear} className="text-white/30 hover:text-white/60 transition-colors shrink-0" aria-label="Clear search">
              <Icon icon="mdi:close" width="13" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Suggested badges */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {PEXELS_VIDEO_BADGES.map((badge) => (
            <button
              key={badge.id}
              onClick={() => handlePexelsBadgeClick(badge.id)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] transition-all border ${
                activePexelsQuery === badge.id
                  ? "bg-white/15 border-white/30 text-white/90"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {t(`pexels.badges.${badge.key}`)}
            </button>
          ))}
        </div>

        {/* Videos Grid - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {pexelsLoading && pexelsVideos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="svg-spinners:ring-resize" width="20" className="text-white/30" />
            </div>
          ) : pexelsVideos.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-xs">
              {t("pexels.noResults")}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                {pexelsVideos.map((video) => {
                  const isDownloading = downloadingVideoId === video.id;
                  return (
                    <div
                      key={video.id}
                      className="group relative aspect-video bg-black/40 rounded-lg border border-white/5 hover:border-white/15 overflow-hidden transition-all duration-300"
                    >
                      <img
                        src={video.thumbnailUrl}
                        alt={`Video by ${video.photographer}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        crossOrigin="anonymous"
                      />
                      
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

                      {/* Duration badge */}
                      <div className="absolute bottom-1.5 right-1.5 px-1 py-0.5 bg-black/60 rounded text-[9px] font-mono text-white/80 shrink-0">
                        {formatVideoDuration(video.duration)}
                      </div>

                      {/* Photographer */}
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-medium text-white/60 truncate drop-shadow-sm group-hover:text-white/95 transition-colors">
                        {video.photographer}
                      </div>

                      {/* Add overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {isDownloading ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <Icon icon="svg-spinners:ring-resize" width="18" className="text-white" />
                            <span className="text-[8px] font-semibold text-white tracking-wider uppercase bg-black/40 px-1.5 py-0.5 rounded">
                              {t("pexels.downloading")}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePexelsVideoSelect(video)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-white/95 text-black rounded-full font-bold text-[9px] tracking-wider uppercase shadow-lg transform scale-95 group-hover:scale-100 transition-all duration-200"
                          >
                            <Icon icon="material-symbols:add-rounded" width="12" />
                            <span>{t("pexels.addButton")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more */}
              {pexelsHasMore && (
                <Button
                  onClick={handlePexelsLoadMore}
                  disabled={pexelsLoading}
                  variant="ghost"
                  className="w-full text-[10px] text-white/40 hover:text-white/70 hover:bg-white/5 py-1.5 h-auto transition-colors mt-1"
                >
                  {pexelsLoading ? (
                    <Icon icon="svg-spinners:ring-resize" width="12" />
                  ) : (
                    <span>Show more</span>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-white/25 text-center pt-2 border-t border-white/5 shrink-0">
        {t("footer")}
      </div>
    </div>
  );
}