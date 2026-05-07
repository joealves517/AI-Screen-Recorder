import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import Plyr from "plyr-react";
import "../../styles/plyr.css";
import { ContentStateContext } from "../../context/ContentState"; // Import the ContentState context

// Components
import Title from "./Title";

const VideoPlayer = (props) => {
  const [contentState, setContentState] = useContext(ContentStateContext); // Access the ContentState context

  const playerRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [source, setSource] = useState(null);
  const contentStateRef = useRef(contentState);
  const bannerRef = useRef(null);

  useEffect(() => {
    contentStateRef.current = contentState;
  }, [contentState]);

  const getProcessingBannerText = () => {
    const base = chrome.i18n.getMessage("processingBannerEditor");
    const pct = Math.round(contentStateRef.current.processingProgress || 0);
    if (pct > 0 && pct < 100) {
      return `${base} (${pct}%)`;
    }
    return base;
  };

  useEffect(() => {
    if (
      playerRef.current &&
      playerRef.current.plyr &&
      contentState.updatePlayerTime
    ) {
      playerRef.current.plyr.currentTime = contentState.time;
    }
  }, [contentState.time]);

  const options = useMemo(
    () => ({
      controls: [
        "play",
        "rewind",
        "fast-forward",
        "progress",
        "current-time",
        "duration",
        "mute",
        "captions",
        "settings",
        "pip",
        "fullscreen",
      ],
      captions: { active: true, update: true },
      urls: null,
      ratio: "16:9",
      blankVideo:
        "chrome-extension://" +
        chrome.i18n.getMessage("@@extension_id") +
        "/assets/blank.mp4",
      keyboard: {
        global: true,
      },
    }),
    []
  );

  const [vidUrl, setVidUrl] = useState(null);

  useEffect(() => {
    let vid;
    if (contentState.blob) {
      if (bannerRef.current) {
        bannerRef.current.style.display = "none";
        bannerRef.current.remove();
      }
      vid = contentState.blob;
    } else if (contentState.webm) {
      vid = contentState.webm;
    }

    if (vid) {
      const url = URL.createObjectURL(vid);
      setVidUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [contentState.blob, contentState.webm, contentState.hasBeenEdited]);

  useEffect(() => {
    if (vidUrl) {
      let currentTime = 0;
      let isPlaying = false;
      if (playerRef.current && playerRef.current.plyr) {
        currentTime = playerRef.current.plyr.currentTime;
        isPlaying = playerRef.current.plyr.playing;
        
        // Pause the current player before updating source to prevent background audio looping
        if (isPlaying) {
          playerRef.current.plyr.pause();
        }
      }

      const newSource = {
        type: "video",
        sources: [
          {
            src: vidUrl,
            type: contentState.blob ? contentState.blob.type : (contentState.webm ? contentState.webm.type : "video/webm"),
          },
        ],
      };

      if (contentState.subtitleTracks && contentState.subtitleTracks.length > 0) {
        newSource.tracks = contentState.subtitleTracks;
      } else if (contentState.subtitleVtt) {
        newSource.tracks = [
          {
            kind: "captions",
            label: "AI Subtitles",
            srclang: "en",
            src: contentState.subtitleVtt,
            default: true,
          }
        ];
      }

      setSource(newSource);
      setUrl(vidUrl);

      // Restore playback state if possible
      setTimeout(() => {
        if (playerRef.current && playerRef.current.plyr) {
          if (currentTime > 0) playerRef.current.plyr.currentTime = currentTime;
          if (isPlaying) playerRef.current.plyr.play();
          if (contentState.subtitleTracks && contentState.subtitleTracks.length > 0) {
             playerRef.current.plyr.toggleCaptions(true);
          } else if (contentState.subtitleVtt) {
             playerRef.current.plyr.toggleCaptions(true);
          }
        }
      }, 200);
    }
  }, [vidUrl, contentState.subtitleVtt, contentState.subtitleTracks]);

  // Use a mutation observer to check if .plyr--video is added to the DOM
  useEffect(() => {
    if (contentStateRef.current.mp4ready || contentStateRef.current.blob)
      return;
    const config = { attributes: true, childList: true, subtree: true };

    const callback = function (mutationsList, observer) {
      for (let mutation of mutationsList) {
        if (
          document.querySelector(".plyr--video") &&
          !contentStateRef.current.mp4ready &&
          !contentStateRef.current.blob &&
          !bannerRef.current &&
          !contentStateRef.current.nativeUnsupported &&
          !(
            contentStateRef.current.duration >
              contentStateRef.current.editLimit &&
            !contentStateRef.current.override
          )
        ) {
          bannerRef.current = document.createElement("div");
          bannerRef.current.classList.add("videoBanner");
          bannerRef.current.innerHTML =
            "<img src='" +
            chrome.runtime.getURL("assets/editor/icons/alert-white.svg") +
            "'/> <span>" +
            getProcessingBannerText() +
            "</span>";

          document.querySelector(".plyr--video").appendChild(bannerRef.current);
        }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(document.body, config);

    return () => {
      observer.disconnect();

      if (bannerRef.current) {
        bannerRef.current.style.display = "none";
        bannerRef.current.remove();
        bannerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!bannerRef.current) return;
    bannerRef.current.innerHTML =
      "<img src='" +
      chrome.runtime.getURL("assets/editor/icons/alert-white.svg") +
      "'/> <span>" +
      getProcessingBannerText() +
      "</span>";
  }, [contentState.processingProgress]);

  return (
    <div className="videoPlayer">
      <div className="playerWrap">
        {url && (
          <Plyr
            ref={playerRef}
            id="plyr-player"
            source={source}
            options={options}
          />
        )}
        {contentState.mode === "player" && <Title />}
      </div>
      <style>
        {`
					@media (max-width: 900px) {
						.videoPlayer {
							position: relative!important;
						}
					}
					`}
      </style>
    </div>
  );
};

export default VideoPlayer;
