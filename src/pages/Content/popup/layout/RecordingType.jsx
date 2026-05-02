import React, { useEffect, useContext, useState, useRef } from "react";

import Dropdown from "../components/Dropdown";
import Switch from "../components/Switch";
import RegionDimensions from "../components/RegionDimensions";
import Settings from "./Settings";
import { contentStateContext } from "../../context/ContentState";

import { EyeOffIcon, MicOffIcon } from "lucide-animated";
import { AnimatedIcon } from "../../components/AnimatedIcon";
import TooltipWrap from "../components/TooltipWrap";

import BackgroundEffects from "../components/BackgroundEffects";

import { AlertIcon, TimeIcon, NoInternet } from "../../toolbar/components/SVG";

const CLOUD_FEATURES_ENABLED =
  process.env.AISR_ENABLE_CLOUD_FEATURES === "true";

const RecordingType = (props) => {
  const [contentState, setContentState] = useContext(contentStateContext);
  const [cropActive, setCropActive] = useState(false);
  const [time, setTime] = useState(0);
  const [URL, setURL] = useState(
    ""
  );
  const [URL2, setURL2] = useState(
    ""
  );

  const buttonRef = useRef(null);
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  useEffect(() => {
    const locale = chrome.i18n.getMessage("@@ui_locale");
    if (!locale.includes("en")) {
      setURL("");
      setURL2("");
    }
  }, []);

  useEffect(() => {
    // Convert seconds to mm:ss
    let minutes = Math.floor(contentState.alarmTime / 60);
    let seconds = contentState.alarmTime - minutes * 60;
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    setTime(minutes + ":" + seconds);
  }, []);

  useEffect(() => {
    // Convert seconds to mm:ss
    let minutes = Math.floor(contentState.alarmTime / 60);
    let seconds = contentState.alarmTime - minutes * 60;
    if (seconds < 10) {
      seconds = "0" + seconds;
    }
    setTime(minutes + ":" + seconds);
  }, [contentState.alarmTime]);

  // Start recording
  const startStreaming = () => {
    contentState.startStreaming();
  };

  useEffect(() => {
    // Check if CropTarget is null
    if (typeof CropTarget === "undefined") {
      setCropActive(false);
      setContentState((prevContentState) => ({
        ...prevContentState,
        customRegion: false,
      }));
    } else {
      setCropActive(true);
    }
  }, []);

  useEffect(() => {
    if (contentState.recording) {
      setContentState((prevContentState) => ({
        ...prevContentState,
        pendingRecording: false,
      }));
    }
  }, [contentState.recording]);

  return (
    <div>
      {contentState.updateChrome && (
        <div className="popup-warning">
          <div className="popup-warning-left">
            <AlertIcon />
          </div>
          <div className="popup-warning-middle">
            <div className="popup-warning-title">
              {chrome.i18n.getMessage("customAreaRecordingDisabledTitle")}
            </div>
            <div className="popup-warning-description">
              {chrome.i18n.getMessage("customAreaRecordingDisabledDescription")}
            </div>
          </div>
          <div className="popup-warning-right">
            <a href={URL} target="_blank">
              {chrome.i18n.getMessage("customAreaRecordingDisabledAction")}
            </a>
          </div>
        </div>
      )}
      {/*contentState.offline && (
        <div className="popup-warning">
          <div className="popup-warning-left">
            <NoInternet />
          </div>
          <div className="popup-warning-middle">
            <div className="popup-warning-title">You are currently offline</div>
            <div className="popup-warning-description">
              Some features are unavailable
            </div>
          </div>
          <div className="popup-warning-right">
            <a href="#">Try again</a>
          </div>
        </div>
			)*/}
      {!cropActive &&
        contentState.recordingType === "region" &&
        !contentState.offline && (
          <div className="popup-warning">
            <div className="popup-warning-left">
              <AlertIcon />
            </div>
            <div className="popup-warning-middle">
              <div className="popup-warning-title">
                {chrome.i18n.getMessage("customAreaRecordingDisabledTitle")}
              </div>
              <div className="popup-warning-description">
                {chrome.i18n.getMessage(
                  "customAreaRecordingDisabledDescription"
                )}
              </div>
            </div>
            <div className="popup-warning-right">
              <a
                href="https://support.google.com/chrome/answer/95414?hl=en-GB&co=GENIE.Platform%3DDesktop"
                target="_blank"
              >
                {chrome.i18n.getMessage("customAreaRecordingDisabledAction")}
              </a>
            </div>
          </div>
        )}
      {!contentState.cameraPermission && (
        <button
          className="permission-button"
          onClick={() => {
            if (typeof contentState.openModal === "function") {
              contentState.openModal(
                chrome.i18n.getMessage("permissionsModalTitle"),
                chrome.i18n.getMessage("permissionsModalDescription"),
                chrome.i18n.getMessage("permissionsModalReview"),
                chrome.i18n.getMessage("permissionsModalDismiss"),
                () => {
                  chrome.runtime.sendMessage({
                    type: "extension-media-permissions",
                  });
                },
                () => {},
                null,
                chrome.i18n.getMessage("learnMoreDot"),
                URL2,
                true,
                false
              );
            }
          }}
        >
          <AnimatedIcon animation="none"><EyeOffIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={20} color="#3080F8" strokeWidth={2} /></AnimatedIcon>
          <span>{chrome.i18n.getMessage("allowCameraAccessButton")}</span>
        </button>
      )}
      {contentState.cameraPermission && (
        <Dropdown type="camera" shadowRef={props.shadowRef} />
      )}
      {contentState.cameraPermission &&
        contentState.defaultVideoInput != "none" &&
        contentState.cameraActive && (
          <div>
            <Switch
              label={chrome.i18n.getMessage("flipCameraLabel")}
              name="flip-camera"
              value="cameraFlipped"
            />
            {(!contentState.isLoggedIn || contentState.instantMode) && (
              <div style={{ pointerEvents: "auto" }}>
                <Switch
                  label={chrome.i18n.getMessage("backgroundEffectsLabel")}
                  name="background-effects-active"
                  value="backgroundEffectsActive"
                />
              </div>
            )}

            {contentState.backgroundEffectsActive &&
              (!contentState.isLoggedIn || contentState.instantMode) && (
                <BackgroundEffects />
              )}
          </div>
        )}

      {!contentState.microphonePermission && (
        <button
          className="permission-button"
          onClick={() => {
            if (typeof contentState.openModal === "function") {
              contentState.openModal(
                chrome.i18n.getMessage("permissionsModalTitle"),
                chrome.i18n.getMessage("permissionsModalDescription"),
                chrome.i18n.getMessage("permissionsModalReview"),
                chrome.i18n.getMessage("permissionsModalDismiss"),
                () => {
                  chrome.runtime.sendMessage({
                    type: "extension-media-permissions",
                  });
                },
                () => {},
                null,
                chrome.i18n.getMessage("learnMoreDot"),
                URL2,
                true,
                false
              );
            }
          }}
        >
          <AnimatedIcon animation="none"><MicOffIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={20} color="#3080F8" strokeWidth={2} /></AnimatedIcon>
          <span>{chrome.i18n.getMessage("allowMicrophoneAccessButton")}</span>
        </button>
      )}
      {contentState.microphonePermission && (
        <Dropdown type="mic" shadowRef={props.shadowRef} />
      )}
      {((!contentState.isLoggedIn &&
        contentState.microphonePermission &&
        contentState.defaultAudioInput != "none" &&
        contentState.micActive) ||
        (contentState.microphonePermission && contentState.pushToTalk)) && (
        <div>
          <iframe
            className="aisr-iframe"
            style={{
              width: "100%",
              height: "30px",
              zIndex: 999999,
              position: "relative",
            }}
            allow="camera; microphone"
            src={chrome.runtime.getURL("waveform.html")}
          ></iframe>
          <Switch
            label={
              isMac
                ? chrome.i18n.getMessage("pushToTalkLabel") + " (⌥⇧U)"
                : chrome.i18n.getMessage("pushToTalkLabel") + " (Alt⇧U)"
            }
            name="pushToTalk"
            value="pushToTalk"
          />
        </div>
      )}
      {contentState.recordingType === "region" && cropActive && (
        <div>
          <div className="popup-content-divider"></div>
          <Switch
            label={chrome.i18n.getMessage("customAreaLabel")}
            name="customRegion"
            value="customRegion"
          />
          {contentState.customRegion && <RegionDimensions />}
        </div>
      )}
      {contentState.isLoggedIn &&
        !contentState.recordingToScene &&
        CLOUD_FEATURES_ENABLED && (
          <>
            <div className="popup-content-divider"></div>
            <TooltipWrap
              id="pro-onboarding-instant-mode-field"
              content={
                chrome.i18n.getMessage("instantRecordingModeTooltip") ||
                "Instant download, but camera and layout won’t be editable later."
              }
              side="bottom"
              sideOffset={2}
            >
              <div style={{ pointerEvents: "auto" }}>
                <Switch
                  label={
                    chrome.i18n.getMessage("instantRecordingModeLabel") ||
                    "Instant recording mode"
                  }
                  name="instantMode"
                  value="instantMode"
                  anchorId="pro-onboarding-instant-mode-toggle"
                  rowAnchorId="pro-onboarding-instant-mode-toggle-row"
                  onChange={async (checked) => {
                    if (checked) {
                      contentState.openModal(
                        chrome.i18n.getMessage("instantRecordingModeTitle") ||
                          "Instant recording mode",
                        chrome.i18n.getMessage(
                          "instantRecordingModeDescription"
                        ) ||
                          "This records everything into one video for instant download and sharing. You won’t be able to change the camera layout afterward, but other edits are still possible.",
                        chrome.i18n.getMessage("instantRecordingModeAction") ||
                          "Got it",
                        chrome.i18n.getMessage("permissionsModalDismiss") ||
                          "Dismiss",
                        () => {},
                        () => {},
                        null,
                        "",
                        "",
                        true,
                        false
                      );
                    } else {
                      // Turn off background effects in chrome.storage
                      chrome.storage.local.set({
                        backgroundEffectsActive: false,
                      });

                      // Update in memory
                      setContentState((prev) => ({
                        ...prev,
                        backgroundEffectsActive: false,
                      }));
                    }
                  }}
                />
              </div>
            </TooltipWrap>
          </>
        )}
      <button
        role="button"
        className="main-button recording-button"
        ref={buttonRef}
        tabIndex="0"
        onClick={startStreaming}
        disabled={
          contentState.pendingRecording ||
          ((!contentState.cameraPermission || !contentState.cameraActive) &&
            contentState.recordingType === "camera")
        }
      >
        {contentState.alarm && contentState.alarmTime > 0 && (
          <div className="alarm-time-button">
            <TimeIcon />
            {time}
          </div>
        )}
        <span className="main-button-label">
          {contentState.pendingRecording
            ? chrome.i18n.getMessage("recordButtonInProgressLabel")
            : (!contentState.cameraPermission || !contentState.cameraActive) &&
              contentState.recordingType === "camera"
            ? chrome.i18n.getMessage("recordButtonNoCameraLabel")
            : contentState.multiMode && contentState.multiSceneCount > 0
            ? chrome.i18n.getMessage("recordButtonMultiLabel")
            : chrome.i18n.getMessage("recordButtonLabel")}
        </span>
        <span className="main-button-shortcut">
          {contentState.recordingShortcut}
        </span>
      </button>
      <Settings />
    </div>
  );
};

export default RecordingType;
