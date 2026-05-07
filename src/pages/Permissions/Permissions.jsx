import React, { useEffect, useState, useRef, useCallback } from "react";

const Recorder = () => {
  useEffect(() => {
    window.parent.postMessage(
      {
        type: "aisr-permissions-loaded",
      },
      "*"
    );
  }, []);

  useEffect(() => {
    const handleDeviceChange = () => {
      // Recheck permissions and enumerate devices
      checkPermissions();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  const checkPermissions = async () => {
    let micGranted = false;
    let camGranted = false;

    // 1. Try to get microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      micGranted = true;
    } catch (err) {
      console.log("Mic check failed:", err);
    }

    // 2. Try to get camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      camGranted = true;
    } catch (err) {
      console.log("Cam check failed:", err);
    }

    if (micGranted || camGranted) {
      enumerateDevices(camGranted, micGranted);
    } else {
      window.parent.postMessage(
        {
          type: "aisr-permissions",
          success: false,
          error: "Not granted",
        },
        "*"
      );
    }
  };

  const enumerateDevices = async (camGranted = true, micGranted = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micGranted,
        video: camGranted,
      });

      const devicesInfo = await navigator.mediaDevices.enumerateDevices();

      let audioinput = [];
      let audiooutput = [];
      let videoinput = [];

      if (micGranted) {
        // Filter by audio input
        audioinput = devicesInfo
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));

        // Filter by audio output and extract relevant properties
        audiooutput = devicesInfo
          .filter((device) => device.kind === "audiooutput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
      }

      if (camGranted) {
        // Filter by video input and extract relevant properties
        videoinput = devicesInfo
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
      }

      // Save in Chrome local storage
      chrome.storage.local.set({
        // Set available devices
        audioinput: audioinput,
        audiooutput: audiooutput,
        videoinput: videoinput,
        cameraPermission: camGranted,
        microphonePermission: micGranted,
      });

      // Post message to parent window
      window.parent.postMessage(
        {
          type: "aisr-permissions",
          success: true,
          audioinput: audioinput,
          audiooutput: audiooutput,
          videoinput: videoinput,
          cameraPermission: camGranted,
          microphonePermission: micGranted,
        },
        "*"
      );

      //sendResponse({ success: true, audioinput, audiooutput, videoinput });

      // End the stream
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
    } catch (err) {
      // Post message to parent window
      window.parent.postMessage(
        {
          type: "aisr-permissions",
          success: false,
          error: err.name,
        },
        "*"
      );
      //sendResponse({ success: false, error: err.name });
    }
  };

  const onMessage = (message) => {
    if (message.type === "aisr-get-permissions") {
      checkPermissions();
    }
  };

  // Post message listener
  useEffect(() => {
    window.addEventListener("message", (event) => {
      onMessage(event.data);
    });
  }, []);

  return <div></div>;
};

export default Recorder;
