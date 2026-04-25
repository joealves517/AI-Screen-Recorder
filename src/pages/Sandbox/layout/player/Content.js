import React, { useContext } from "react";
import styles from "../../styles/player/_Content.module.scss";

// Components
import VideoPlayer from "../../components/player/VideoPlayer";
import CropperWrap from "../../components/editor/CropperWrap";

// Context
import { ContentStateContext } from "../../context/ContentState";

const Content = () => {
  const [contentState] = useContext(ContentStateContext);
  return (
    <div className={styles.content}>
      <div className={styles.wrap}>
        {contentState.mode === "audio" && <VideoPlayer />}
        {contentState.mode === "player" && <VideoPlayer />}
        {contentState.mode === "crop" && <CropperWrap />}
      </div>
    </div>
  );
};

export default Content;
