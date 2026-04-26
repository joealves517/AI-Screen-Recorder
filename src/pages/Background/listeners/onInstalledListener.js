import { removeTab } from "../tabManagement";
import { executeScripts } from "../utils/executeScripts";

export const onInstalledListener = () => {
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
      // Clear storage on fresh install
      chrome.storage.local.clear();

      chrome.storage.local.set({
        firstTime: true,
        onboarding: false,
        bannerSupport: true,
        firstTimePro: false,
      });
    } else if (details.reason === "update") {
      if (details.previousVersion === "2.8.6") {
        chrome.storage.local.set({ updatingFromOld: true });
      } else {
        chrome.storage.local.set({ updatingFromOld: false });
      }
    }

    // Disable backups for older Chrome versions
    if (navigator.userAgent.includes("Chrome/")) {
      const chromeVersion = parseInt(
        navigator.userAgent.match(/Chrome\/([0-9]+)/)?.[1] ?? "0"
      );
      if (chromeVersion <= 109) {
        chrome.storage.local.set({ backup: false });
      }
    }

    if (details.reason === "install") {
      chrome.storage.local.set({ systemAudio: true });
    }
    chrome.storage.local.set({ offscreenRecording: false });

    const { backupTab } = await chrome.storage.local.get(["backupTab"]);
    if (backupTab) {
      removeTab(backupTab);
    }

    executeScripts();
  });
};
