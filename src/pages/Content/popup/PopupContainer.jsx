import React, {
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
  useRef,
} from "react";
import useDraggable from "../hooks/useDraggable";
import * as Tabs from "@radix-ui/react-tabs";

import {
  RecordTabActive,
  RecordTabInactive,
  TempLogo,
  ProfilePic,
} from "../images/popup/images";

import { Rnd } from "react-rnd";

import {
  CloseIconPopup,
  GrabIconPopup,
  HelpIconPopup,
} from "../toolbar/components/SVG";

/* Component import */
import RecordingTab from "./layout/RecordingTab";
import AccountTab from "./layout/AccountTab";

// Layouts
import SettingsMenu from "./layout/SettingsMenu";
import InactiveSubscription from "./layout/InactiveSubscription";

import Welcome from "./layout/Welcome";
import {
  runProPopupOnboardingIfNeeded,
  runProCameraOnboardingIfNeeded,
} from "./onboarding/proOnboarding";

// Context
import { contentStateContext } from "../context/ContentState";
import { supportContextQuery } from "../../utils/buildSupportContext";

const PopupContainer = (props) => {
  const [contentState, setContentState] = useContext(contentStateContext);
  const contentStateRef = useRef(contentState);
  const [tab, setTab] = useState("record");
  const [badge, setBadge] = useState(TempLogo);
  const PopupRef = useRef(null);
  const [elastic, setElastic] = React.useState("");
  const [shake, setShake] = React.useState("");
  const [dragging, setDragging] = React.useState("");
  const [onboarding, setOnboarding] = useState(false);
  const [showProSplash, setShowProSplash] = useState(false);
  const [open, setOpen] = useState(false);
  const recordTabRef = useRef(null);
  const videoTabRef = useRef(null);
  const pillRef = useRef(null);
  const [URL, setURL] = useState("");
  const isCloudBuild = process.env.AISR_ENABLE_CLOUD_FEATURES === "true";
  const wasCameraActiveRef = useRef(null);

  const {
    offset: popupOffset,
    isDragging: isPopupDragging,
    dragHandleProps: popupDragHandleProps,
    containerStyle: popupContainerStyle,
    setRef: setPopupDragRef,
  } = useDraggable();

  useEffect(() => {
    chrome.storage.local.get(["onboarding", "showProSplash"], (result) => {
      const nextOnboarding = Boolean(result.onboarding);
      const nextShowProSplash = Boolean(result.showProSplash);
      setOnboarding(nextOnboarding);
      setShowProSplash(nextShowProSplash);
      setContentState((prevContentState) => ({
        ...prevContentState,
        onboarding: nextOnboarding,
        showProSplash: nextShowProSplash,
      }));
    });
  }, [setContentState]);

  useEffect(() => {
    if (contentState.isLoggedIn) {
      setOnboarding(false);
      setShowProSplash(false);
      return;
    }
    setOnboarding(Boolean(contentState.onboarding));
    setShowProSplash(Boolean(contentState.showProSplash));
  }, [
    contentState.isLoggedIn,
    contentState.onboarding,
    contentState.showProSplash,
  ]);

  useEffect(() => {
    const buildURL = async () => {
      const locale = chrome.i18n.getMessage("@@ui_locale");

      // Default URL
      let baseURL = "";

      // If logged in, switch to Tally with prefilled params
      if (contentState?.isLoggedIn && contentState?.aisrUser) {
        const { name, email } = contentState.aisrUser;
        const qs = await supportContextQuery({
          includeRecordingState: true,
          source: "popup",
          user: { name, email },
        });
        baseURL = "";
      }

      // If non-English locale, wrap with Google Translate
      if (!locale.includes("en")) {
        setURL(
          `https://translate.google.com/translate?sl=en&tl=${locale}&u=${encodeURIComponent(
            baseURL
          )}`
        );
      } else {
        setURL(baseURL);
      }
    };
    buildURL();
  }, [contentState]);

  const onValueChange = (tab) => {
    setTab(tab);

    if (contentState.isLoggedIn) {
      const avatar = contentState?.aisrUser?.avatar || contentState?.aisrUser?.picture;
      setBadge(avatar || ProfilePic);
    } else {
      setBadge(TempLogo);
    }

    setContentState((prevContentState) => ({
      ...prevContentState,
      bigTab: tab,
    }));
  };
  useEffect(() => {
    setTab(contentState.bigTab);
  }, []);

  useEffect(() => {
    if (contentState.isLoggedIn) {
      const avatar = contentState?.aisrUser?.avatar || contentState?.aisrUser?.picture;
      setBadge(avatar || ProfilePic);
    } else {
      setBadge(TempLogo);
    }
  }, [
    contentState.isLoggedIn,
    contentState.isSubscribed,
    contentState.aisrUser,
    tab,
  ]);

  const showWelcomeSplash = Boolean(
    isCloudBuild &&
      !contentState.isLoggedIn &&
      !contentState.wasLoggedIn &&
      (
        onboarding ||
        showProSplash ||
        contentState.onboarding ||
        contentState.showProSplash
      ),
  );

  useLayoutEffect(() => {
    if (!recordTabRef.current || !videoTabRef.current || !pillRef.current)
      return;

    const tabRef =
      tab === "record" ? recordTabRef.current : videoTabRef.current;

    pillRef.current.style.left = `${tabRef.offsetLeft}px`;
    pillRef.current.style.width = `${tabRef.getBoundingClientRect().width}px`;
  }, [tab]);

  useEffect(() => {
    contentStateRef.current = contentState;
  }, [contentState]);

  // Removed drag logic and effects
  useEffect(() => {
    requestAnimationFrame(() => {
      const tabRef =
        contentState.bigTab === "record"
          ? recordTabRef.current
          : videoTabRef.current;

      if (tabRef && pillRef.current) {
        pillRef.current.style.left = `${tabRef.offsetLeft}px`;
        pillRef.current.style.width = `${
          tabRef.getBoundingClientRect().width
        }px`;
      }
    });
  }, [
    contentState.isLoggedIn,
    contentState.bigTab,
    contentState.wasLoggedIn,
    pillRef.current,
  ]);

  useEffect(() => {
    const isPro = Boolean(contentState.isLoggedIn && contentState.isSubscribed);
    if (!isCloudBuild || !isPro) return;
    runProPopupOnboardingIfNeeded({
      rootContext: props.shadowRef?.current?.shadowRoot || document,
      isPro,
      isLoggedIn: Boolean(contentState.isLoggedIn),
      popupOpen: Boolean(contentState.showPopup && contentState.showExtension),
      cameraEnabled: Boolean(contentState.cameraActive),
      pendingRecording: Boolean(contentState.pendingRecording),
      preparingRecording: Boolean(contentState.preparingRecording),
      recording: Boolean(contentState.recording),
      countdownActive: Boolean(contentState.countdownActive),
      isCountdownVisible: Boolean(contentState.isCountdownVisible),
    });
  }, [
    isCloudBuild,
    contentState.isLoggedIn,
    contentState.isSubscribed,
    contentState.showPopup,
    contentState.showExtension,
    contentState.recordingToScene,
    contentState.cameraActive,
    contentState.pendingRecording,
    contentState.preparingRecording,
    contentState.recording,
    contentState.countdownActive,
    contentState.isCountdownVisible,
    props.shadowRef,
  ]);

  useEffect(() => {
    const isPro = Boolean(contentState.isLoggedIn && contentState.isSubscribed);
    const cameraEnabled = Boolean(contentState.cameraActive);
    if (wasCameraActiveRef.current === null) {
      wasCameraActiveRef.current = cameraEnabled;
      return;
    }
    const becameEnabled = cameraEnabled && !wasCameraActiveRef.current;
    wasCameraActiveRef.current = cameraEnabled;
    if (!becameEnabled || !isCloudBuild || !isPro) return;
    runProCameraOnboardingIfNeeded({
      rootContext: props.shadowRef?.current?.shadowRoot || document,
      isPro,
      isLoggedIn: Boolean(contentState.isLoggedIn),
      popupOpen: Boolean(contentState.showPopup && contentState.showExtension),
      cameraEnabled,
      pendingRecording: Boolean(contentState.pendingRecording),
      preparingRecording: Boolean(contentState.preparingRecording),
      recording: Boolean(contentState.recording),
      countdownActive: Boolean(contentState.countdownActive),
      isCountdownVisible: Boolean(contentState.isCountdownVisible),
    });
  }, [
    isCloudBuild,
    contentState.cameraActive,
    contentState.isLoggedIn,
    contentState.isSubscribed,
    contentState.showPopup,
    contentState.showExtension,
    contentState.pendingRecording,
    contentState.preparingRecording,
    contentState.recording,
    contentState.countdownActive,
    contentState.isCountdownVisible,
    props.shadowRef,
  ]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <div className={"ToolbarBounds" + " " + shake}></div>
      <div
        className={
          "react-draggable centered-popup " + elastic + " " + shake + " " + dragging +
          (isPopupDragging ? " ToolbarDragging" : "")
        }
        style={{
          ...(popupOffset
            ? {
                display: "block",
                pointerEvents: "none",
              }
            : {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }),
        }}
      >
        <div
          className="popup-container"
          id="pro-onboarding-popup-container"
          ref={(node) => {
            PopupRef.current = node;
            setPopupDragRef(node);
          }}
          style={{
            pointerEvents: "auto",
            ...popupContainerStyle,
          }}
        >
          <div
            className={open ? "popup-drag-head" : "popup-drag-head drag-area"}
            {...(!open ? popupDragHandleProps : {})}
            style={{
              cursor: open ? "default" : isPopupDragging ? "grabbing" : "grab",
            }}
          ></div>
          <div
            className={
              open ? "popup-controls open" : "popup-controls drag-area"
            }
          >
            <SettingsMenu
              shadowRef={props.shadowRef}
              open={open}
              setOpen={setOpen}
            />

            <div
              className="popup-control popup-close"
              onClick={() => {
                setContentState((prevContentState) => ({
                  ...prevContentState,
                  showPopup: false,
                }));
              }}
            >
              <CloseIconPopup />
            </div>
          </div>
          <div
            className="popup-cutout drag-area"
            {...popupDragHandleProps}
          >
            <img
              src={badge}
              crossOrigin="anonymous"
              style={{
                width: contentState.isLoggedIn ? "100%" : "90%",
                height: contentState.isLoggedIn ? "100%" : "90%",
                borderRadius: contentState.isLoggedIn ? "50%" : "0",
                filter: !contentState.isLoggedIn
                  ? "drop-shadow(rgba(86, 123, 218, 0.35) 0px 4px 11px) drop-shadow(rgba(53, 87, 98, 0.2) 0px 4px 10px)"
                  : "none",
                userSelect: "none",
                pointerEvents: "none",
                objectFit: "cover",
              }}
              draggable={false}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="popup-nav"></div>
          <div className="popup-content">
            {showWelcomeSplash ? (
              <Welcome
                setOnboarding={() => {
                  setOnboarding(false);
                  setShowProSplash(false);
                  chrome.storage.local.set({
                    onboarding: false,
                    showProSplash: false,
                    firstTimePro: false,
                  });
                  setContentState((prev) => ({
                    ...prev,
                    onboarding: false,
                    showProSplash: false,
                  }));
                }}
                isBack={showProSplash}
                clearBack={() => {
                  setShowProSplash(false);
                  setContentState((prev) => ({
                    ...prev,
                    showProSplash: false,
                  }));
                  chrome.storage.local.set({ showProSplash: false });
                }}
                setContentState={setContentState}
              />
            ) : (
              <Tabs.Root
                className="TabsRoot tl"
                value={tab}
                onValueChange={onValueChange}
              >
                <Tabs.List
                  className="TabsList tl"
                  data-value={tab}
                  aria-label="Manage your account"
                  tabIndex={0}
                >
                  <div className="pill-anim" ref={pillRef}></div>
                  <Tabs.Trigger
                    className="TabsTrigger tl"
                    value="record"
                    ref={recordTabRef}
                    tabIndex={0}
                  >
                    <div className="TabsTriggerIcon">
                      <img
                        src={
                          tab === "record" ? RecordTabActive : RecordTabInactive
                        }
                      />
                    </div>
                    {chrome.i18n.getMessage("recordTab")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    className="TabsTrigger tl"
                    value="dashboard"
                    ref={videoTabRef}
                    tabIndex={0}
                  >
                    <div className="TabsTriggerIcon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tab === "dashboard" ? "#3080F8" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    {chrome.i18n.getMessage("videosTab")}
                  </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content className="TabsContent tl" value="record">
                  <RecordingTab shadowRef={props.shadowRef} />
                </Tabs.Content>
                <Tabs.Content className="TabsContent tl" value="dashboard">
                  <AccountTab />
                </Tabs.Content>
              </Tabs.Root>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PopupContainer;
