import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import VideoItem from "../components/VideoItem";
import { PlaceholderThumb } from "../../images/popup/images";
import { useContext } from "react";
import { contentStateContext } from "../../context/ContentState";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DropdownIcon, CheckWhiteIcon } from "../../images/popup/images";
import { ChevronDownIcon, CheckIcon } from "lucide-animated";
import { AnimatedIcon } from "../../components/AnimatedIcon";

import {
  TempTwitter,
  TempFigma,
  TempDesignSystem,
  TempMarketing,
  TempSubstack,
} from "../../images/popup/images";

const CLOUD_FEATURES_ENABLED =
  process.env.AISR_ENABLE_CLOUD_FEATURES === "true";

const VideosTab = (props) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [contentState, setContentState] = useContext(contentStateContext);
  const fetchedPagesRef = useRef(new Set()); // key = `${sortBy}-${page}`
  const videoCacheRef = useRef({}); // key: `${sortBy}-${page}` → video[]
  const VIDEO_CACHE_STORAGE_KEY = "cachedVideosBySort";

  const pageRef = useRef(0); // Track page here without triggering re-renders
  const observerRef = useRef();

  const PAGE_SIZE = 8;
  const sortBy = contentState.sortBy || "newest";
  const filter = "all";

  const lastFetchTimeRef = useRef(0);
  const FETCH_COOLDOWN_MS = 1500;

  useEffect(() => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }

    chrome.storage.local.get(VIDEO_CACHE_STORAGE_KEY, (result) => {
      if (result?.[VIDEO_CACHE_STORAGE_KEY]) {
        videoCacheRef.current = result[VIDEO_CACHE_STORAGE_KEY];

        // Hydrate fetchedPagesRef with cached keys
        fetchedPagesRef.current = new Set(Object.keys(videoCacheRef.current));

        // Collect all cached videos for current sort
        const matchingKeys = Object.keys(videoCacheRef.current).filter((key) =>
          key.startsWith(`${sortBy}-`)
        );

        // Sort by page number (e.g. newest-0, newest-1, newest-2...)
        const sortedKeys = matchingKeys.sort((a, b) => {
          const aPage = parseInt(a.split("-")[1], 10);
          const bPage = parseInt(b.split("-")[1], 10);
          return aPage - bPage;
        });

        const allCachedVideos = sortedKeys.flatMap(
          (key) => videoCacheRef.current[key] || []
        );

        setVideos(allCachedVideos);

        // Update pageRef to next page
        pageRef.current = sortedKeys.length;

        // If the last page is smaller than PAGE_SIZE, we're done
        const lastPageKey = sortedKeys[sortedKeys.length - 1];
        const lastPage = videoCacheRef.current[lastPageKey] || [];
        setHasMore(lastPage.length === PAGE_SIZE);
      } else {
        // No cache found, do initial fetch
        pageRef.current = 0;
        setHasMore(true);
        fetchVideos();
      }
    });
  }, []);

  useEffect(() => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }

    if (contentState.isSubscribed) {
      setVideos([]);
      pageRef.current = 0;
      setHasMore(true);
      fetchedPagesRef.current = new Set();
      fetchVideos();
    }
  }, [sortBy]);

  const fetchVideos = useCallback(async () => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }

    const now = Date.now();

    if (
      !contentState.isSubscribed ||
      loading ||
      !hasMore ||
      now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS
    ) {
      return;
    }

    lastFetchTimeRef.current = now;

    const cacheKey = `${sortBy}-${pageRef.current}`;
    if (fetchedPagesRef.current.has(cacheKey)) return;
    fetchedPagesRef.current.add(cacheKey);
    setLoading(true);

    try {
      if (videoCacheRef.current[cacheKey]) {
        const cachedVideos = videoCacheRef.current[cacheKey];
        setVideos((prev) => [...prev, ...cachedVideos]);

        if (cachedVideos.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          pageRef.current += 1;
        }

        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: "fetch-videos",
        page: pageRef.current,
        pageSize: PAGE_SIZE,
        sort: sortBy,
        filter,
      });

      if (!response?.success) {
        console.error("❌ Failed to fetch videos:", response?.error);
        setError(response?.error || "Failed to load videos");
        setHasMore(false);
        return;
      }

      const newVideos = response.videos || [];
      setVideos((prev) => [...prev, ...newVideos]);

      if (newVideos.length > 0) {
        videoCacheRef.current[cacheKey] = newVideos;
        chrome.storage.local.set({
          [VIDEO_CACHE_STORAGE_KEY]: videoCacheRef.current,
        });
      }

      if (newVideos.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        pageRef.current += 1;
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      setError("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, contentState.isSubscribed, sortBy]);

  // useEffect(() => {
  //   if (contentState.isSubscribed) {
  //     fetchVideos();
  //   }
  // }, []); // Run once on mount

  useEffect(() => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }
    if (!observerRef.current || !hasMore || !contentState.isSubscribed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchVideos();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [fetchVideos, hasMore]);

  const handleVideoClick = (videoId) => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }
    const url = process.env.AISR_APP_BASE + `/editor/${videoId}/edit`;
    window.open(url, "_blank");
  };

  const handleCopyLink = (videoId) => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }
    const link = process.env.AISR_APP_BASE + `/view/${videoId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        contentState.openToast(
          chrome.i18n.getMessage("copiedToClipboardToast"),
          3000
        );
      })
      .catch((err) => {
        console.error("❌ Failed to copy:", err);
        contentState.openToast(
          chrome.i18n.getMessage("failedToCopyToClipboardToast"),
          3000
        );
      });
  };

  useEffect(() => {
    if (!CLOUD_FEATURES_ENABLED) {
      // show only local placeholder videos
      return;
    }
    chrome.storage.local.get(["sortBy"], (result) => {
      if (result.sortBy && !contentState.sortBy) {
        setContentState((prev) => ({ ...prev, sortBy: result.sortBy }));
      }
    });
  }, []);

  const sortLabelMap = {
    newest: chrome.i18n.getMessage("newestSortLabel"),
    oldest: chrome.i18n.getMessage("oldestSortLabel"),
    alphabetical: "A–Z",
    "reverse-alphabetical": "Z–A",
  };

  return (
    <div className="video-ui">

      <Tabs.Root className="TabsRoot" defaultValue="personal">
        <Tabs.List className="TabsList" aria-label="Manage your account">
          <div className="TabsTriggerWrap">
            <Tabs.Trigger className="TabsTrigger" value="personal">
              <div className="TabsTriggerLabel">
                <span>{chrome.i18n.getMessage("allVideosHeading")}</span>
              </div>
            </Tabs.Trigger>
            {/* <Tabs.Trigger className="TabsTrigger" value="team">
              <div className="TabsTriggerLabel">
                <span>Team</span>
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger className="TabsTrigger" value="shared">
              <div className="TabsTriggerLabel">
                <span>Shared</span>
              </div>
            </Tabs.Trigger> */}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="TabsSort" aria-label="Sort videos">
                <div className="TabsSortLabel">
                  {sortLabelMap[sortBy] || "Sort"} <AnimatedIcon animation="none"><ChevronDownIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="#9CA3AF" strokeWidth={2} /></AnimatedIcon>
                </div>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal
              container={props.shadowRef.current.shadowRoot.querySelector(
                ".container"
              )}
            >
              <DropdownMenu.Content
                className="DropdownMenuContent"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.RadioGroup
                  value={sortBy}
                  onValueChange={(value) => {
                    setContentState((prev) => ({ ...prev, sortBy: value }));
                    chrome.storage.local.set({ sortBy: value });
                  }}
                >
                  <DropdownMenu.RadioItem
                    className="DropdownMenuItem"
                    value="newest"
                  >
                    {chrome.i18n.getMessage("newestSortLabel")}
                    <DropdownMenu.ItemIndicator className="ItemIndicator">
                      <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>

                  <DropdownMenu.RadioItem
                    className="DropdownMenuItem"
                    value="oldest"
                  >
                    {chrome.i18n.getMessage("oldestSortLabel")}
                    <DropdownMenu.ItemIndicator className="ItemIndicator">
                      <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>

                  <DropdownMenu.RadioItem
                    className="DropdownMenuItem"
                    value="alphabetical"
                  >
                    A–Z
                    <DropdownMenu.ItemIndicator className="ItemIndicator">
                      <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>

                  <DropdownMenu.RadioItem
                    className="DropdownMenuItem"
                    value="reverse-alphabetical"
                  >
                    Z–A
                    <DropdownMenu.ItemIndicator className="ItemIndicator">
                      <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                    </DropdownMenu.ItemIndicator>
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </Tabs.List>

        <Tabs.Content className="TabsContent" value="personal">
          <div className="videos-list">
            {error && <p>{error}</p>}
            {videos.length === 0 &&
              !loading &&
              !error &&
              contentState.isSubscribed && (
                <div className="empty-state">
                  <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                    👻
                  </div>
                  <span>{chrome.i18n.getMessage("noVideosFound")}</span>
                </div>
              )}
            {contentState.isSubscribed ? (
              videos.map((video, i) => (
                <VideoItem
                  key={i}
                  title={video.title}
                  date={video.createdAt}
                  thumbnail={
                    video.signedThumbnail ||
                    (video.data?.useCustomThumbnail &&
                      video.data?.customThumbnail) ||
                    video.data?.tempThumbnail ||
                    PlaceholderThumb
                  }
                  onOpen={() => handleVideoClick(video._id)}
                  onCopyLink={() => handleCopyLink(video._id)}
                />
              ))
            ) : (
              <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center", marginTop: "20px" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                  🔒
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
                  Sign in to view your videos
                </h3>
                <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px", lineHeight: "1.5" }}>
                  Access your cloud recordings from anywhere. Log in to your account to manage your videos.
                </p>
                <button 
                  onClick={() => chrome.runtime.sendMessage({ type: "handle-login" })}
                  style={{
                    background: "#3080F8",
                    color: "white",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: "99px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "background 0.2s",
                    boxShadow: "0 2px 8px rgba(48, 128, 248, 0.25)"
                  }}
                >
                  Log in to Account
                </button>
              </div>
            )}
            {loading && contentState.isSubscribed && (
              <div className="spinner-container">
                <div className="spinner" />
                <span>{chrome.i18n.getMessage("loadingVideosLabel")}</span>
              </div>
            )}
            <div ref={observerRef} style={{ height: "1px" }} />
          </div>

          <div className="bottom-section">
            <a
              href={process.env.AISR_APP_BASE}
              target="_blank"
              rel="noopener noreferrer"
              role="button"
              className="main-button dashboard-button"
              tabIndex="0"
              style={{
                zIndex: 99,
              }}
            >
              <span className="main-button-label">
                {chrome.i18n.getMessage("goToDashboardButtonLabel")}
              </span>
              {/* <span className="main-button-shortcut">Ctrl+D</span> */}
            </a>
          </div>
        </Tabs.Content>

        <Tabs.Content className="TabsContent" value="team"></Tabs.Content>
        <Tabs.Content className="TabsContent" value="shared"></Tabs.Content>
      </Tabs.Root>
    </div>
  );
};

export default VideosTab;
