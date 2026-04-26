import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/700.css";
import "./styles/app.scss";
import Content from "./Content";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React>
    <Content />
  </React>
);
