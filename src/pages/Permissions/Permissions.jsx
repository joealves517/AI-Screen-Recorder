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

    // 1. Check true permission state using Permissions API
    try {
      const camPerm = await navigator.permissions.query({ name: "camera" });
      camGranted = camPerm.state === "granted";
    } catch (e) {
      console.warn("Camera permissions query not supported");
    }

    try {
      const micPerm = await navigator.permissions.query({ name: "microphone" });
      micGranted = micPerm.state === "granted";
    } catch (e) {
      console.warn("Microphone permissions query not supported");
    }

    // 2. If not granted, try to trigger prompt via getUserMedia
    if (!micGranted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        micGranted = true;
      } catch (err) {
        console.log("Mic prompt failed:", err);
      }
    }

    if (!camGranted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        camGranted = true;
      } catch (err) {
        console.log("Cam prompt failed:", err);
        // If error is NotFound, it means we don't have a camera right now, 
        // but user might have already granted permission previously.
        // We will rely on enumerateDevices to see if any device appears later.
      }
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
      // Try to wake up devices to ensure they appear in enumeration.
      // Ignore errors (e.g. NotFoundError) so we still enumerate whatever is available.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: micGranted,
          video: camGranted,
        });
        stream.getTracks().forEach((track) => track.stop());
      } catch (wakeErr) {
        console.warn("Wake up getUserMedia failed, continuing to enumeration:", wakeErr);
      }

      const devicesInfo = await navigator.mediaDevices.enumerateDevices();

      let audioinput = [];
      let audiooutput = [];
      let videoinput = [];

      // Always filter devices if the user has granted permission, 
      // even if the wake-up stream failed (e.g. Continuity Camera takes time to appear).
      
      // Also, if devices have labels, it means permission IS granted, 
      // regardless of what the previous checks said!
      const hasLabels = devicesInfo.some(d => d.label && d.label.length > 0);
      
      // Re-evaluate permissions based on whether we can see labels for each kind
      const actualMicGranted = micGranted || devicesInfo.some(d => d.kind === "audioinput" && d.label);
      const actualCamGranted = camGranted || devicesInfo.some(d => d.kind === "videoinput" && d.label);

      if (actualMicGranted) {
        audioinput = devicesInfo
          .filter((device) => device.kind === "audioinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));

        audiooutput = devicesInfo
          .filter((device) => device.kind === "audiooutput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
      }

      if (actualCamGranted) {
        videoinput = devicesInfo
          .filter((device) => device.kind === "videoinput")
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label,
          }));
      }

      // Save in Chrome local storage
      chrome.storage.local.set({
        audioinput: audioinput,
        audiooutput: audiooutput,
        videoinput: videoinput,
        cameraPermission: actualCamGranted,
        microphonePermission: actualMicGranted,
      });

      // Post message to parent window
      window.parent.postMessage(
        {
          type: "aisr-permissions",
          success: true,
          audioinput: audioinput,
          audiooutput: audiooutput,
          videoinput: videoinput,
          cameraPermission: actualCamGranted,
          microphonePermission: actualMicGranted,
        },
        "*"
      );
    } catch (err) {
      window.parent.postMessage(
        {
          type: "aisr-permissions",
          success: false,
          error: err.name,
        },
        "*"
      );
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
