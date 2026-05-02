import React, { useContext, useState, useEffect } from "react";
import Trimmer from "../../components/editor/Trimmer";
import styles from "../../styles/edit/_TrimUI.module.scss";

import {
  FilePenLineIcon as Trim,
  ArchiveIcon as Remove,
  MicOffIcon as Mute,
  UndoIcon as Undo,
  RedoIcon as Redo,
  ClockIcon as Time,
} from "lucide-animated";

import { AnimatedIcon } from "../../../Content/components/AnimatedIcon";

// Context
import { ContentStateContext } from "../../context/ContentState";

const TrimUI = (props) => {
  const [contentState, setContentState] = useContext(ContentStateContext);
  const [undoDisabled, setUndoDisabled] = useState(true);
  const [redoDisabled, setRedoDisabled] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);

  useEffect(() => {
    setStartTime(contentState.start * contentState.duration);
    setEndTime(contentState.end * contentState.duration);
  }, [contentState.duration, contentState.start, contentState.end]);

  useEffect(() => {
    if (contentState.history.length > 2) {
      setUndoDisabled(false);
    } else {
      setUndoDisabled(true);
    }
  }, [contentState.history]);

  useEffect(() => {
    if (contentState.redoHistory.length > 0) {
      setRedoDisabled(false);
    } else {
      setRedoDisabled(true);
    }
  }, [contentState.redoHistory]);

  const toTimeStamp = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - minutes * 60);

    if (seconds < 10) {
      return `${minutes}:0${seconds}`;
    } else {
      return `${minutes}:${seconds}`;
    }
  };

  return (
    <div className={styles.trimWrap}>
      <div className={styles.controls}>
        <div className={styles.actions}>
          <button
            className="button secondaryButton"
            onClick={() => contentState.handleTrim(false)}
            disabled={
              contentState.isFfmpegRunning ||
              (contentState.start === 0 && contentState.end === 1)
            }
          >
            <AnimatedIcon animation="none">
              <Trim size={16} color="currentColor" style={{ marginRight: 6 }} />
            </AnimatedIcon>
            {contentState.trimming
              ? chrome.i18n.getMessage("sandboxEditorTrimProgressButton") +
                (contentState.processingProgress > 0
                  ? ` ${contentState.processingProgress}%`
                  : "")
              : chrome.i18n.getMessage("sandboxEditorTrimButton")}
          </button>
          <button
            className="button secondaryButton"
            disabled={
              (contentState.start === 0 && contentState.end === 1) ||
              contentState.isFfmpegRunning
            }
            onClick={() => contentState.handleTrim(true)}
          >
            <AnimatedIcon animation="none">
              <Remove size={16} color="currentColor" style={{ marginRight: 6 }} />
            </AnimatedIcon>
            {contentState.cutting
              ? chrome.i18n.getMessage("sandboxEditorCutProgressButton") +
                (contentState.processingProgress > 0
                  ? ` ${contentState.processingProgress}%`
                  : "")
              : chrome.i18n.getMessage("sandboxEditorCutButton")}
          </button>
          <button
            className="button secondaryButton"
            onClick={() => contentState.handleMute()}
            disabled={contentState.isFfmpegRunning}
          >
            <AnimatedIcon animation="none">
              <Mute size={16} color="currentColor" style={{ marginRight: 6 }} />
            </AnimatedIcon>
            {contentState.muting
              ? chrome.i18n.getMessage("sandboxEditorMuteProgressButton") +
                (contentState.processingProgress > 0
                  ? ` ${contentState.processingProgress}%`
                  : "")
              : chrome.i18n.getMessage("sandboxEditorMuteButton")}
          </button>
        </div>
        <div className={styles.timeWrap}>
          <AnimatedIcon animation="none">
            <Time size={16} color="currentColor" style={{ marginRight: 6 }} />
          </AnimatedIcon>
          <span>{toTimeStamp(startTime) + " - " + toTimeStamp(endTime)}</span>
        </div>

        <div className={styles.controlsRight}>
          <button
            className="button simpleButton"
            onClick={() => contentState.undo()}
            disabled={undoDisabled || contentState.isFfmpegRunning}
          >
            <AnimatedIcon animation="none">
              <Undo size={16} color="currentColor" style={{ marginRight: 6 }} />
            </AnimatedIcon>
            {chrome.i18n.getMessage("undoLabel")}
          </button>
          <button
            className="button simpleButton"
            onClick={() => contentState.redo()}
            disabled={redoDisabled || contentState.isFfmpegRunning}
          >
            <AnimatedIcon animation="none">
              <Redo size={16} color="currentColor" style={{ marginRight: 6 }} />
            </AnimatedIcon>
            {chrome.i18n.getMessage("redoLabel")}
          </button>
        </div>
      </div>
      <Trimmer />
    </div>
  );
};

export default TrimUI;
