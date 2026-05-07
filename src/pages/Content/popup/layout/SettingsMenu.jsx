// Work in progress - settings for the recording

import React, { useState, useContext, useRef, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { MoreIconPopup } from "../../toolbar/components/SVG";

import TooltipWrap from "../components/TooltipWrap";


import {
  SettingsIcon,
  ChevronRightIcon,
  CheckIcon,
  MaximizeIcon,
  MonitorCheckIcon,
  GaugeIcon,
  VolumeIcon,
  ZapIcon,
  CloudUploadIcon,
  CloudDownloadIcon,
  HistoryIcon,
  UserIcon,
  CircleHelpIcon,
  RefreshCcwIcon,
  LogoutIcon,
  UserRoundCheckIcon
} from "lucide-animated";
import { AnimatedIcon } from "../../components/AnimatedIcon";

// Context
import { contentStateContext } from "../../context/ContentState";
import {
  probeFastRecorderSupport,
  shouldUseFastRecorder,
  getFastRecorderStickyState,
} from "../../../../media/fastRecorderGate";
import { resetOnboardingSeen } from "../onboarding/storage";
import { runProPopupOnboardingIfNeeded } from "../onboarding/proOnboarding";

const CLOUD_FEATURES_ENABLED =
  process.env.AISR_ENABLE_CLOUD_FEATURES === "true";

const SettingsMenu = (props) => {
  const [contentState, setContentState] = useContext(contentStateContext);
  const [restore, setRestore] = useState(false);
  const [cloudRestore, setCloudRestore] = useState(false);
  const [oldChrome, setOldChrome] = useState(false);
  const [openQuality, setOpenQuality] = useState(false);
  const [openResize, setOpenResize] = useState(false);
  const [openFPS, setOpenFPS] = useState(false);
  const [RAM, setRAM] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [fastRecorderInfo, setFastRecorderInfo] = useState({
    status: null,
    probe: null,
    decision: null,
    disabled: false,
    disabledReason: null,
    disabledDetails: null,
    disabledAt: null,
  });

  useEffect(() => {
    // Check chrome version
    const chromeVersion = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    const MIN_CHROME_VERSION = 110;

    if (chromeVersion && parseInt(chromeVersion[2], 10) < MIN_CHROME_VERSION) {
      setOldChrome(true);
    }
  }, []);

  useEffect(() => {
    // More accurate screen detection
    const w = window.screen.availWidth * window.devicePixelRatio;
    const h = window.screen.availHeight * window.devicePixelRatio;
    setWidth(Math.round(w));
    setHeight(Math.round(h));

    // Fix RAM detection on macOS
    const isMac = navigator.userAgent.includes("Macintosh");
    const ram = isMac ? 32 : Number(navigator.deviceMemory) || 4;
    setRAM(ram);
  }, []);

  const getFastRecDebug = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("fastRecDebug") === "1";
    } catch {
      return false;
    }
  };

  const hasLadderFields = (probe) => {
    if (!probe || !probe.details) return false;
    return (
      Array.isArray(probe.details.attemptSummary) &&
      probe.details.attemptSummary.length > 0 &&
      Boolean(probe.details.selectedVideoConfig)
    );
  };

  const runFastRecorderProbe = async (source = "auto") => {
    if (!contentState) return;
    const userSetting =
      contentState.useWebCodecsRecorder === true
        ? true
        : contentState.useWebCodecsRecorder === false
        ? false
        : null;
    const sticky = await getFastRecorderStickyState();
    const probe = await probeFastRecorderSupport();
    const useFast = shouldUseFastRecorder(userSetting, probe, sticky);
    const decision = {
      useFast,
      why:
        userSetting === false
          ? "user_disabled"
          : sticky?.disabled && userSetting !== true
          ? "sticky_disabled"
          : probe.ok
          ? "probe_ok"
          : "probe_failed",
      at: Date.now(),
    };
    const status = {
      userSetting,
      probe: { ...probe, at: probe.at || Date.now() },
        decision,
        disabled: Boolean(sticky?.disabled),
        disabledReason: sticky?.reason || null,
        disabledDetails: sticky?.details || null,
        disabledAt: null,
        updatedAt: Date.now(),
      };
    try {
      await chrome.storage.local.set({ fastRecorderStatus: status });
    } catch {}
    setFastRecorderInfo({
      status,
      probe: status.probe,
      decision,
      disabled: status.disabled,
      disabledReason: status.disabledReason,
      disabledDetails: status.disabledDetails,
      disabledAt: status.disabledAt,
    });
    if (getFastRecDebug()) {
      console.log("[FastRecorderStatus]", { source, status });
    }
    return status;
  };

  const migrateFastRecorderStatus = async () => {
    const existing = await chrome.storage.local.get(["fastRecorderStatus"]);
    if (existing.fastRecorderStatus) {
      const status = existing.fastRecorderStatus;
      if (!hasLadderFields(status?.probe)) {
        await runFastRecorderProbe("stale-status");
        const refreshed = await chrome.storage.local.get(["fastRecorderStatus"]);
        return refreshed.fastRecorderStatus || status;
      }
      return status;
    }
    const legacy = await chrome.storage.local.get([
      "fastRecorderBeta",
      "fastRecorderProbe",
      "fastRecorderDecision",
      "fastRecorderDisabledForDevice",
      "fastRecorderDisabledReason",
      "fastRecorderDisabledDetails",
      "fastRecorderDisabledAt",
    ]);
    const status = {
      userSetting:
        legacy.fastRecorderBeta === true
          ? true
          : legacy.fastRecorderBeta === false
          ? false
          : null,
      probe: legacy.fastRecorderProbe || null,
      decision: legacy.fastRecorderDecision || null,
      disabled: Boolean(legacy.fastRecorderDisabledForDevice),
      disabledReason: legacy.fastRecorderDisabledReason || null,
      disabledDetails: legacy.fastRecorderDisabledDetails || null,
      disabledAt: legacy.fastRecorderDisabledAt || null,
      updatedAt: Date.now(),
    };
    try {
      await chrome.storage.local.set({ fastRecorderStatus: status });
    } catch {}
    if (!hasLadderFields(status.probe)) {
      await runFastRecorderProbe("stale-legacy");
      const refreshed = await chrome.storage.local.get(["fastRecorderStatus"]);
      return refreshed.fastRecorderStatus || status;
    }
    return status;
  };

  useEffect(() => {
    let canceled = false;
    (async () => {
      const status = await migrateFastRecorderStatus();
      if (canceled) return;
      setFastRecorderInfo((prev) => ({
        ...prev,
        status,
        probe: status?.probe || null,
        decision: status?.decision || null,
        disabled: Boolean(status?.disabled),
        disabledReason: status?.disabledReason || null,
        disabledDetails: status?.disabledDetails || null,
        disabledAt: status?.disabledAt || null,
      }));
      const staleHours = 12;
      const probeAgeMs =
        status?.probe?.at && Number.isFinite(status.probe.at)
          ? Date.now() - status.probe.at
          : Infinity;
      const shouldRun =
        !status?.probe ||
        probeAgeMs > staleHours * 60 * 60 * 1000 ||
        !hasLadderFields(status?.probe);
      if (shouldRun) {
        await runFastRecorderProbe("effect");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [contentState?.useWebCodecsRecorder]);

  return (
    <DropdownMenu.Root
      open={props.open}
      onOpenChange={(open) => {
        props.setOpen(open);

        chrome.runtime
          .sendMessage({ type: "check-restore" })
          .then((response) => {
            setRestore(response.restore);
          });

        // Cloud restore checks removed

        chrome.storage.local.get(["fastRecorderStatus"], (result) => {
          const status = result.fastRecorderStatus || null;
          setFastRecorderInfo((prev) => ({
            ...prev,
            status,
            probe: status?.probe || null,
            decision: status?.decision || null,
            disabled: Boolean(status?.disabled),
            disabledReason: status?.disabledReason || null,
            disabledDetails: status?.disabledDetails || null,
            disabledAt: status?.disabledAt || null,
          }));
        });
      }}
    >
      <DropdownMenu.Trigger asChild>
        <button className="IconButton" aria-label="Customise options">
          <AnimatedIcon animation="none"><SettingsIcon style={{ display: "block" }} size={16} color="#4B5563" strokeWidth={2.5} /></AnimatedIcon>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal
        container={props.shadowRef.current.shadowRoot.querySelector(
          ".container"
        )}
      >
        <DropdownMenu.Content className="DropdownMenuContent" sideOffset={5}>
          {true && (
            <DropdownMenu.Sub
              open={openResize}
              onOpenChange={(open) => {
                if (open) {
                  setOpenFPS(false);
                  setOpenQuality(false);
                }
                setOpenResize(open);
              }}
            >
              <DropdownMenu.SubTrigger className="DropdownMenuItem" style={{ paddingLeft: "12px" }}>
                <AnimatedIcon animation="none"><MaximizeIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
                {chrome.i18n.getMessage("resizeWindowLabel")}
                <div className="ItemIndicatorArrow">
                  <AnimatedIcon animation="none"><ChevronRightIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="#9CA3AF" /></AnimatedIcon>
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="AisrDropdownMenuContent"
                  sideOffset={0}
                  alignOffset={-3}
                >
                  <TooltipWrap
                    content={
                      width < 3840 || height < 2160
                        ? chrome.i18n.getMessage("screenTooSmallTooltip")
                        : ""
                    }
                  >
                    <DropdownMenu.Item
                      className="AisrDropdownMenuItem"
                      onClick={(e) => {
                        chrome.runtime.sendMessage({
                          type: "resize-window",
                          width: 3840,
                          height: 2160,
                        });
                      }}
                      
                    >
                      3840 x 2160 (4k)
                    </DropdownMenu.Item>
                  </TooltipWrap>
                  <TooltipWrap
                    content={
                      width < 1920 || height < 1080
                        ? chrome.i18n.getMessage("screenTooSmallTooltip")
                        : ""
                    }
                  >
                    <DropdownMenu.Item
                      className="AisrDropdownMenuItem"
                      onClick={(e) => {
                        chrome.runtime.sendMessage({
                          type: "resize-window",
                          width: 1920,
                          height: 1080,
                        });
                      }}
                      
                    >
                      1920 x 1080 (1080p)
                    </DropdownMenu.Item>
                  </TooltipWrap>
                  <TooltipWrap
                    content={
                      width < 1280 || height < 720
                        ? chrome.i18n.getMessage("screenTooSmallTooltip")
                        : ""
                    }
                  >
                    <DropdownMenu.Item
                      className="AisrDropdownMenuItem"
                      onClick={(e) => {
                        chrome.runtime.sendMessage({
                          type: "resize-window",
                          width: 1280,
                          height: 720,
                        });
                      }}
                      
                    >
                      1280 x 720 (720p)
                    </DropdownMenu.Item>
                  </TooltipWrap>
                  <TooltipWrap
                    content={
                      width < 640 || height < 480
                        ? chrome.i18n.getMessage("screenTooSmallTooltip")
                        : ""
                    }
                  >
                    <DropdownMenu.Item
                      className="AisrDropdownMenuItem"
                      onClick={(e) => {
                        chrome.runtime.sendMessage({
                          type: "resize-window",
                          width: 640,
                          height: 480,
                        });
                      }}
                      
                    >
                      640 x 480 (480p)
                    </DropdownMenu.Item>
                  </TooltipWrap>
                  <TooltipWrap
                    content={
                      width < 480 || height < 360
                        ? chrome.i18n.getMessage("screenTooSmallTooltip")
                        : ""
                    }
                  >
                    <DropdownMenu.Item
                      className="AisrDropdownMenuItem"
                      onClick={(e) => {
                        chrome.runtime.sendMessage({
                          type: "resize-window",
                          width: 480,
                          height: 360,
                        });
                      }}
                      
                    >
                      480 x 360 (360p)
                    </DropdownMenu.Item>
                  </TooltipWrap>
                  <TooltipWrap
                    content={
                      width < 320 || height < 240
                        ? chrome.i18n.getMessage("screenTooSmallTooltip")
                        : ""
                    }
                  >
                    <DropdownMenu.Item
                      className="AisrDropdownMenuItem"
                      onClick={(e) => {
                        chrome.runtime.sendMessage({
                          type: "resize-window",
                          width: 320,
                          height: 240,
                        });
                      }}
                      
                    >
                      320 x 240 (240p)
                    </DropdownMenu.Item>
                  </TooltipWrap>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          )}
          {true && (
            <DropdownMenu.Sub
              open={openQuality}
              onOpenChange={(open) => {
                if (open) {
                  setOpenFPS(false);
                  setOpenResize(false);
                }
                setOpenQuality(open);
              }}
            >
              <DropdownMenu.SubTrigger className="DropdownMenuItem" style={{ paddingLeft: "12px" }}>
                <AnimatedIcon animation="none"><MonitorCheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
                {chrome.i18n.getMessage("maxResolutionLabel") +
                  " (" +
                  contentState.qualityValue +
                  ")"}
                <div className="ItemIndicatorArrow">
                  <AnimatedIcon animation="none"><ChevronRightIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="#9CA3AF" /></AnimatedIcon>
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="AisrDropdownMenuContent"
                  sideOffset={0}
                  alignOffset={-3}
                >
                  <DropdownMenu.RadioGroup
                    value={contentState.qualityValue}
                    onValueChange={(value) => {
                      setContentState((prevContentState) => ({
                        ...prevContentState,
                        qualityValue: value,
                      }));
                      chrome.storage.local.set({
                        qualityValue: value,
                      });
                    }}
                  >
                    <TooltipWrap
                      content={
                        RAM < 8 || width < 3840 || height < 2160
                          ? chrome.i18n.getMessage("maxResolutionTooltip")
                          : ""
                      }
                    >
                      <DropdownMenu.RadioItem
                        className="AisrDropdownMenuItem"
                        value="4k"
                        
                      >
                        4k
                        <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                          <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    </TooltipWrap>
                    <TooltipWrap
                      content={
                        RAM < 4 || width < 1920 || height < 1080
                          ? chrome.i18n.getMessage("maxResolutionTooltip")
                          : ""
                      }
                    >
                      <DropdownMenu.RadioItem
                        className="AisrDropdownMenuItem"
                        value="1080p"
                        
                      >
                        1080p
                        <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                          <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    </TooltipWrap>
                    <TooltipWrap
                      content={
                        RAM < 2 || width < 1280 || height < 720
                          ? chrome.i18n.getMessage("maxResolutionTooltip")
                          : ""
                      }
                    >
                      <DropdownMenu.RadioItem
                        className="AisrDropdownMenuItem"
                        value="720p"
                        
                      >
                        720p
                        <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                          <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                        </DropdownMenu.ItemIndicator>
                      </DropdownMenu.RadioItem>
                    </TooltipWrap>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="480p"
                    >
                      480p
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="360p"
                    >
                      360p
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="240p"
                    >
                      240p
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          )}
          {true && (
            <DropdownMenu.Sub
              open={openFPS}
              onOpenChange={(open) => {
                if (open) {
                  setOpenQuality(false);
                  setOpenResize(false);
                }
                setOpenFPS(open);
              }}
            >
              <DropdownMenu.SubTrigger className="DropdownMenuItem" style={{ paddingLeft: "12px" }}>
                <AnimatedIcon animation="none"><GaugeIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
                {chrome.i18n.getMessage("maxFPSLabel") +
                  " (" +
                  contentState.fpsValue +
                  " fps)"}
                <div className="ItemIndicatorArrow">
                  <AnimatedIcon animation="none"><ChevronRightIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="#9CA3AF" /></AnimatedIcon>
                </div>
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className="AisrDropdownMenuContent"
                  sideOffset={0}
                  alignOffset={-3}
                >
                  <DropdownMenu.RadioGroup
                    value={contentState.fpsValue}
                    onValueChange={(value) => {
                      setContentState((prevContentState) => ({
                        ...prevContentState,
                        fpsValue: value,
                      }));
                      chrome.storage.local.set({
                        fpsValue: value,
                      });
                    }}
                  >
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="60"
                    >
                      60 fps
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="30"
                    >
                      30 fps
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="24"
                    >
                      24 fps
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="15"
                    >
                      15 fps
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="10"
                    >
                      10 fps
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                    <DropdownMenu.RadioItem
                      className="AisrDropdownMenuItem"
                      value="5"
                    >
                      5 fps
                      <DropdownMenu.ItemIndicator className="AisrItemIndicator">
                        <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                      </DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  </DropdownMenu.RadioGroup>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          )}
          <DropdownMenu.CheckboxItem
            className="DropdownMenuItem"
            onSelect={(e) => {
              e.preventDefault();
            }}
            onCheckedChange={(checked) => {
              setContentState((prevContentState) => ({
                ...prevContentState,
                systemAudio: checked,
              }));
              chrome.storage.local.set({
                systemAudio: checked,
              });
            }}
            checked={contentState.systemAudio}
            style={{ paddingLeft: "12px" }}
          >
            <AnimatedIcon animation="none"><VolumeIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
            {chrome.i18n.getMessage("systemAudioLabel")}
            <DropdownMenu.ItemIndicator className="ItemIndicator">
              <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
            </DropdownMenu.ItemIndicator>
          </DropdownMenu.CheckboxItem>
          {fastRecorderInfo?.probe?.ok === true &&
            fastRecorderInfo?.probe?.details?.selectedVideoConfig && (
              <DropdownMenu.CheckboxItem
                className="DropdownMenuItem"
                onSelect={(e) => {
                  e.preventDefault();
                }}
                onCheckedChange={(checked) => {
                  setContentState((prevContentState) => ({
                    ...prevContentState,
                    useWebCodecsRecorder: checked,
                  }));
                  chrome.storage.local.set({
                    useWebCodecsRecorder: checked,
                    ...(checked
                      ? {
                          lastWebCodecsFailureAt: null,
                          lastWebCodecsFailureCode: null,
                        }
                      : {}),
                  });
                }}
                checked={contentState.useWebCodecsRecorder !== false}
                style={{ paddingLeft: "12px" }}
              >
                <AnimatedIcon animation="none"><ZapIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
                {chrome.i18n.getMessage("webcodecsToggleLabel")}
                <DropdownMenu.ItemIndicator className="ItemIndicator">
                  <AnimatedIcon animation="none"><CheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center" }} size={14} color="white" strokeWidth={3} /></AnimatedIcon>
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.CheckboxItem>
            )}

          {true && (
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onSelect={(e) => {
                e.preventDefault();
                chrome.runtime.sendMessage({ type: "restore-recording" });
              }}
              disabled={!restore}
              style={{ paddingLeft: "12px" }}
            >
              <AnimatedIcon animation="none"><HistoryIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
              {chrome.i18n.getMessage("restoreRecording")}
            </DropdownMenu.Item>
          )}
        {contentState.isLoggedIn && !CLOUD_FEATURES_ENABLED && (
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onSelect={(e) => {
                e.preventDefault();
                chrome.runtime.sendMessage({ type: "open-account-settings" });
              }}
              style={{ paddingLeft: "12px" }}
            >
              <AnimatedIcon animation="none"><UserIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
              {chrome.i18n.getMessage("accountSettingsOption")}
            </DropdownMenu.Item>
          )}
          {contentState.isLoggedIn && !CLOUD_FEATURES_ENABLED && (
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onSelect={(e) => {
                e.preventDefault();
                chrome.runtime.sendMessage({
                  type: "open-support",
                  name: contentState.aisrUser?.name || "",
                  email: contentState.aisrUser?.email || "",
                });
              }}
              style={{ paddingLeft: "12px" }}
            >
              <AnimatedIcon animation="none"><CircleHelpIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
              {chrome.i18n.getMessage("supportSettingsOption")}
            </DropdownMenu.Item>
          )}

          {CLOUD_FEATURES_ENABLED && (
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onSelect={(e) => {
                e.preventDefault();
                if (contentState.isLoggedIn) {
                  // Log out flow
                  chrome.runtime.sendMessage({ type: "handle-logout" });
                  setContentState((prev) => ({
                    ...prev,
                    isLoggedIn: false,
                    wasLoggedIn: true,
                    isSubscribed: false,
                    aisrUser: null,
                    proSubscription: null,
                    bigTab: "record",
                  }));
                  contentState.openToast(
                    chrome.i18n.getMessage("loggedOutToastTitle"),
                    () => {},
                    2000
                  );
                } else {
                  // Log in flow (open login page)
                  chrome.runtime.sendMessage({ type: "handle-login" });
                }
                props.setOpen(false); // Close the menu after action
              }}
              style={{ paddingLeft: "12px" }}
            >
              {contentState.isLoggedIn ? (
                <>
                  <AnimatedIcon animation="none"><LogoutIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
                  {chrome.i18n.getMessage("logoutButtonLabel") || "Log out"}
                </>
              ) : (
                <>
                  <AnimatedIcon animation="none"><UserRoundCheckIcon style={{ display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px" }} size={14} color="#6B7280" strokeWidth={2} /></AnimatedIcon>
                  {chrome.i18n.getMessage("loginButtonLabel") || "Log in or sign up"}
                </>
              )}
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default SettingsMenu;
