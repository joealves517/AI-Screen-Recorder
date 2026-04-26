import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";

import Sandbox from "./Sandbox";
import ContentState from "./context/ContentState";

// Find the container to render into
const container = window.document.querySelector("#app-container");

if (container) {
  const root = createRoot(container);
  root.render(
    <ContentState>
      <Sandbox />
    </ContentState>
  );
}

// Hot Module Replacement
if (module.hot) {
  module.hot.accept();
}
