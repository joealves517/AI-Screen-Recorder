import React, { useContext, useState, useEffect, useRef } from "react";

// Styles
import styles from "../../styles/player/_Title.module.scss";
const URL = "/assets/";

import { PenToolIcon as Pencil, LinkIcon as Link } from "lucide-animated";

import ShareModal from "./ShareModal";

// Context
import { ContentStateContext } from "../../context/ContentState"; // Import the ContentState context

const Title = () => {
  const [showShare, setShowShare] = useState(false);
  const [contentState, setContentState] = useContext(ContentStateContext); // Access the ContentState context
  const inputRef = useRef(null);
  // Show the video title, as a heading by default (multiline), on click show a text input to edit the title
  const [showTitle, setShowTitle] = useState(true);
  const [title, setTitle] = useState(contentState.title);
  const [displayTitle, setDisplayTitle] = useState(contentState.title);

  useEffect(() => {
    setTitle(contentState.title);
    if (contentState.title.length > 80) {
      setDisplayTitle(contentState.title.slice(0, 80) + "...");
    } else {
      setDisplayTitle(contentState.title);
    }
  }, [contentState.title]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleTitleClick = () => {
    setShowTitle(false);
  };

  const handleTitleBlur = () => {
    setShowTitle(true);
    setContentState((prevState) => ({
      ...prevState,
      title: title,
    }));
  };

  useEffect(() => {
    if (!showTitle) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showTitle]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        setShowTitle(true);
        setContentState((prevState) => ({
          ...prevState,
          title: title,
        }));
      } else if (e.key === "Escape") {
        setShowTitle(true);
        setTitle(contentState.title);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [title]);

  return (
    <div className={styles.TitleParent}>
      {showShare && (
        <ShareModal showShare={showShare} setShowShare={setShowShare} />
      )}
      <div className={styles.TitleWrap}>
        {showTitle ? (
          <>
            <h1 onClick={handleTitleClick}>
              {displayTitle}{" "}
              <Pencil
                size={18}
                color="currentColor"
                className={styles.pencil}
                style={{ display: "inline-block", marginLeft: "8px" }}
              />
            </h1>
            {/* <div
              className={styles.shareButton}
              onClick={() => {
                chrome.runtime.sendMessage({ type: "handle-login" });
              }}
            >
              <Link
                size={16}
                color="currentColor"
                className={styles.shareIcon}
              />
              {chrome.i18n.getMessage("shareUnlockButton") ||
                "Sign in to share (pro)"}
            </div> */}
          </>
        ) : (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            ref={inputRef}
          />
        )}
      </div>
    </div>
  );
};

export default Title;
