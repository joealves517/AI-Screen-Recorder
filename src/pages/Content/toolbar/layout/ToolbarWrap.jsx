import React, {
  useLayoutEffect,
  useEffect,
  useContext,
  useState,
  useRef,
} from "react";
import * as Toolbar from "@radix-ui/react-toolbar";

import { Rnd } from "react-rnd";

// Layout
import DrawingToolbar from "./DrawingToolbar";
import CursorToolbar from "./CursorToolbar";
import BlurToolbar from "./BlurToolbar";

// Components
import ToolTrigger from "../components/ToolTrigger";
import Toast from "../components/Toast";

import { CloseIconPopup } from "../components/SVG";

// Context
import { contentStateContext } from "../../context/ContentState";

// Icons
import {
  GrabIcon,
  StopIcon,
  DrawIcon,
  PauseIcon,
  ResumeIcon,
  CursorIcon,
  TargetCursorIcon,
  HighlightCursorIcon,
  SpotlightCursorIcon,
  RestartIcon,
  DiscardIcon,
  CameraIcon,
  BlurIcon,
  OnboardingArrow,
  CloseButtonToolbar,
} from "../components/SVG";
import MicToggle from "../components/MicToggle";

const ToolbarWrap = () => {
  const [contentState, setContentState, t, setT] =
    useContext(contentStateContext);
  const [mode, setMode] = React.useState("");
  const modeRef = React.useRef(mode);
  const [hovering, setHovering] = React.useState(false);
  const DragRef = React.useRef(null);
  const ToolbarRef = React.useRef(null);
  const [side, setSide] = React.useState("ToolbarTop");
  const [elastic, setElastic] = React.useState("");
  const [shake, setShake] = React.useState("");
  const [dragging, setDragging] = React.useState("");
  const [timer, setTimer] = React.useState(0);
  const [timestamp, setTimestamp] = React.useState("00:00");
  const [transparent, setTransparent] = React.useState(false);
  const [forceTransparent, setForceTransparent] = React.useState("");
  const [visuallyHidden, setVisuallyHidden] = useState(false);
  const timeRef = React.useRef("");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    setContentState((prev) => ({
      ...prev,
      setToolbarMode: setMode,
      toolbarMode: mode,
    }));
  }, [mode, setContentState]);

  useEffect(() => {
    if (contentState.toolbarHover && contentState.hideUI) {
      setTransparent("ToolbarTransparent");
    } else {
      setTransparent(false);
      setForceTransparent("");
    }
  }, [contentState.toolbarHover, contentState.hideUI]);

  // If mouse is down and toolbarHover is true, set forceTransparent
  useEffect(() => {
    if (!contentState.toolbarHover) return;
    if (!contentState.shadowRef) return;
    if (!contentState.hideUI) return;
    const handleMouseDown = (e) => {
      if (contentState.toolbarHover && contentState.hideUI) {
        // check if mouse is over toolbar
        if (ToolbarRef.current && ToolbarRef.current.contains(e.target)) return;
        if (
          contentState.shadowRef &&
          (contentState.shadowRef.contains(e.target) ||
            contentState.shadowRef === e.target ||
            contentState.shadowRef === e.target.parentNode)
        )
          return;

        setForceTransparent("ForceTransparent");
      }
    };

    const handleMouseUp = (e) => {
      setForceTransparent("");
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [contentState.toolbarHover, contentState.shadowRef, contentState.hideUI]);

  useEffect(() => {
    if (!isNaN(t)) {
      setTimer(t);
      const clampedT = Math.max(0, t); // prevent negative values
      const hours = Math.floor(clampedT / 3600);
      const minutes = Math.floor((clampedT % 3600) / 60);
      const seconds = clampedT % 60;

      // Determine the timestamp format based on the total duration (t)
      let newTimestamp =
        hours > 0
          ? `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          : `${minutes.toString().padStart(2, "0")}:${seconds
              .toString()
              .padStart(2, "0")}`;

      // Adjust the width of the time display based on the duration
      if (hours > 0) {
        // Adjust for HH:MM:SS format when hours are present
        timeRef.current.style.width = "58px"; // You might need to adjust this value based on your actual UI
      } else {
        // Adjust for MM:SS format when there are no hours
        timeRef.current.style.width = "42px"; // Adjust this value as needed
      }

      setTimestamp(newTimestamp);
    }
  }, [t]);

  // Removed all drag logic to make toolbar fixed at bottom center

  useEffect(() => {
    if (!contentState.openToast) return;
    if (contentState.drawingMode) {
      contentState.openToast(chrome.i18n.getMessage("drawingModeToast"), () => {
        setMode("");
      });
    }
    if (contentState.blurMode) {
      contentState.openToast(chrome.i18n.getMessage("blurModeToast"), () => {
        setMode("");
      });
    }
  }, [contentState.drawingMode, contentState.blurMode, contentState.openToast]);

  // useEffect(() => {
  //   let nextMode = modeRef.current;
  //   if (contentState.drawingMode) {
  //     nextMode = "draw";
  //   } else if (contentState.blurMode) {
  //     nextMode = "blur";
  //   } else if (modeRef.current === "draw" || modeRef.current === "blur") {
  //     nextMode = "";
  //   }

  //   if (nextMode !== modeRef.current) {
  //     setMode(nextMode);
  //   }
  // }, [contentState.drawingMode, contentState.blurMode]);

  useEffect(() => {
    // one-time init
    if (contentState.drawingMode) setMode("draw");
    else if (contentState.blurMode) setMode("blur");
    else setMode("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode === "draw") {
      setContentState((prevContentState) => ({
        ...prevContentState,
        drawingMode: true,
        showOnboardingArrow: false,
      }));
    } else {
      setContentState((prevContentState) => ({
        ...prevContentState,
        drawingMode: false,
      }));
    }
    if (mode === "blur") {
      setContentState((prevContentState) => ({
        ...prevContentState,
        blurMode: true,
        drawingMode: false,
      }));
    } else {
      setContentState((prevContentState) => ({
        ...prevContentState,
        blurMode: false,
      }));
    }
  }, [mode]);

  const enableCamera = () => {
    setContentState((prevContentState) => ({
      ...prevContentState,
      cameraActive: true,
    }));
    chrome.storage.local.set({
      cameraActive: true,
    });
    setContentState((prevContentState) => ({
      ...prevContentState,
      pipEnded: true,
    }));
  };

  const handleChange = (value) => {
    setMode(value);
  };

  return (
    <div style={{ pointerEvents: "none" }}>
      <Toast />
      <div
        className={
          contentState.paused && contentState.recording
            ? "ToolbarPaused"
            : "ToolbarPaused hidden"
        }
      ></div>
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          left: "0",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 999999
        }}
        id="pro-onboarding-recording-toolbar"
      >
        <Toolbar.Root
          id="pro-onboarding-recording-toolbar-root"
          className={
            "ToolbarRoot" +
            " " +
            side +
            " " +
            transparent +
            " " +
            forceTransparent +
            (visuallyHidden ? " visually-hidden-toolbar" : "")
          }
          ref={ToolbarRef}
          onMouseOver={() => {
            setHovering(true);
          }}
          onMouseLeave={() => {
            setHovering(false);
          }}
          style={{ pointerEvents: "auto" }}
        >
          {!contentState.recording && (
            <div
              className={`popup-controls toolbar-controls ${
                hovering ? "open" : ""
              }`}
              onClick={() => {
                // Show the toast first
                if (contentState.openToast) {
                  contentState.openToast(
                    chrome.i18n.getMessage("reopenToolbarToast"),
                    () => {},
                  );
                }

                // Visually hide the toolbar
                setVisuallyHidden(true);

                setContentState((prev) => ({
                  ...prev,

                  drawingMode: false,
                  blurMode: false,
                }));
                // After toast finishes (~3s), apply real hiding logic
                setTimeout(() => {
                  setContentState((prev) => ({
                    ...prev,
                    hideToolbar: true,
                    drawingMode: false,
                    blurMode: false,
                    hideUIAlerts: false,
                    toolbarHover: false,
                    hideUI: true,
                  }));

                  chrome.storage.local.set({
                    hideToolbar: true,
                    hideUIAlerts: false,
                    toolbarHover: false,
                    hideUI: true,
                  });
                }, 3000); // match your toast duration
              }}
            >
              <div className="popup-control popup-close">
                <CloseIconPopup />
              </div>
            </div>
          )}
          <div
            className={"ToolbarRecordingControls"}
            id="pro-onboarding-recording-toolbar-controls"
          >
            <ToolTrigger
              type="button"
              content={chrome.i18n.getMessage("finishRecordingTooltip")}
              disabled={!contentState.recording}
              onClick={() => {
                contentState.stopRecording();
              }}
            >
              <StopIcon width="20" height="20" />
            </ToolTrigger>
            <div
              className={`ToolbarRecordingTime ${
                contentState.timeWarning ? "TimerWarning" : ""
              }`}
              ref={timeRef}
            >
              {timestamp}
            </div>
            <ToolTrigger
              type="button"
              content={chrome.i18n.getMessage("restartRecordingTooltip")}
              disabled={!contentState.recording}
              onClick={() => {
                contentState.tryRestartRecording();
              }}
            >
              <RestartIcon />
            </ToolTrigger>
            {!contentState.paused && (
              <ToolTrigger
                type="button"
                content={chrome.i18n.getMessage("pauseRecordingTooltip")}
                disabled={!contentState.recording}
                onClick={() => {
                  contentState.pauseRecording();
                }}
              >
                <PauseIcon />
              </ToolTrigger>
            )}
            {contentState.recording && contentState.paused && (
              <ToolTrigger
                type="button"
                resume
                content={chrome.i18n.getMessage("resumeRecordingTooltip")}
                disabled={!contentState.recording}
                onClick={() => {
                  contentState.resumeRecording();
                }}
              >
                <ResumeIcon />
              </ToolTrigger>
            )}
            <ToolTrigger
              type="button"
              content={chrome.i18n.getMessage("cancelRecordingTooltip")}
              disabled={!contentState.recording}
              onClick={() => {
                if (contentState.tryDismissRecording !== undefined) {
                  contentState.tryDismissRecording();
                }
              }}
            >
              <DiscardIcon />
            </ToolTrigger>
          </div>
          <Toolbar.Separator className="ToolbarSeparator" />
          <Toolbar.ToggleGroup
            type="single"
            className="ToolbarToggleGroup"
            value={mode}
            onValueChange={handleChange}
          >
            <div className="ToolbarToggleWrap">
              {contentState.showOnboardingArrow && (
                <div className="OnboardingArrow">
                  <div className="OnboardingText">
                    {chrome.i18n.getMessage("clickHereDrawOnboarding")}
                  </div>
                  <div className="ArrowShape">
                    <OnboardingArrow />
                  </div>
                </div>
              )}
              <ToolTrigger
                type="mode"
                content={chrome.i18n.getMessage("toggleDrawingToolsTooltip")}
                value="draw"
                shortcut={contentState.toggleDrawingModeShortcut}
                disabled={contentState.recordingType === "camera"}
              >
                {mode === "draw" && <CloseButtonToolbar />}
                {mode !== "draw" && <DrawIcon />}
              </ToolTrigger>
              <DrawingToolbar visible={mode === "draw" ? "show-toolbar" : ""} />
            </div>
            <div className="ToolbarToggleWrap">
              <ToolTrigger
                type="mode"
                content={chrome.i18n.getMessage("toggleBlurToolTooltip")}
                value="blur"
                shortcut={contentState.toggleBlurModeShortcut}
                disabled={contentState.recordingType === "camera"}
              >
                {mode === "blur" && <CloseButtonToolbar />}
                {mode !== "blur" && <BlurIcon />}
              </ToolTrigger>
              <BlurToolbar visible={mode === "blur" ? "show-toolbar" : ""} />
            </div>

            <div className="ToolbarToggleWrap">
              <ToolTrigger
                type="mode"
                content={chrome.i18n.getMessage("toggleCursorOptionsTooltip")}
                value="cursor"
                shortcut={contentState.toggleCursorModeShortcut}
                disabled={contentState.recordingType === "camera"}
              >
                {contentState.cursorMode === "target" && <TargetCursorIcon />}
                {contentState.cursorMode === "highlight" && (
                  <HighlightCursorIcon />
                )}
                {contentState.cursorMode === "spotlight" && (
                  <SpotlightCursorIcon />
                )}
                {contentState.cursorMode === "none" && <CursorIcon />}
              </ToolTrigger>
              <CursorToolbar
                visible={mode === "cursor" ? "show-toolbar" : ""}
                mode={mode}
                setMode={setMode}
              />
            </div>
            <Toolbar.Separator className="ToolbarSeparator" />
            <MicToggle />
            {(!contentState.cameraActive ||
              contentState.defaultVideoInput === "none") &&
              (!contentState.isSubscribed || !contentState.recording) &&
              contentState.recordingType != "camera-only" && (
                <ToolTrigger
                  type="button"
                  content={
                    contentState.cameraActive && contentState.cameraPermission
                      ? chrome.i18n.getMessage("disableCameraTooltip")
                      : !contentState.cameraActive &&
                        contentState.cameraPermission
                      ? chrome.i18n.getMessage("enableCameraTooltip")
                      : chrome.i18n.getMessage("noCameraPermissionsTooltip")
                  }
                  value="camera"
                  onClick={enableCamera}
                  disabled={
                    !contentState.cameraPermission ||
                    contentState.defaultVideoInput === "none"
                  }
                >
                  <CameraIcon />
                </ToolTrigger>
              )}
          </Toolbar.ToggleGroup>
        </Toolbar.Root>
      </div>
    </div>
  );
};

export default ToolbarWrap;
