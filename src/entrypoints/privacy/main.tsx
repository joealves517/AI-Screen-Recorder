import React from "react";
import { createRoot } from "react-dom/client";
import PrivacyLicense from "./PrivacyLicense";
import '@/app/globals.css';

const container = window.document.querySelector("#app-container");

if (container) {
  const root = createRoot(container);
  root.render(<PrivacyLicense />);
}
