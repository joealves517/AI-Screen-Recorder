import React from "react";
import { createRoot } from "react-dom/client";
import Content from "./Content";

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // Do not run on editor pages to avoid overlaying the editor
    if (window.location.pathname.includes('openvideditor.html')) {
      return;
    }

    // Check if aisr-ui already exists, if so, remove it
    const existingRoot = document.getElementById("aisr-ui");
    if (existingRoot) {
      document.body.removeChild(existingRoot);
    }

    const root = document.createElement("div");
    root.id = "aisr-ui";
    document.body.appendChild(root);

    const appRoot = createRoot(root);
    appRoot.render(<Content />);
  }
});
