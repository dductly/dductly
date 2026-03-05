import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PostHogProvider } from '@posthog/react'
import App from "./App";
import "./style.css";
import "./Menu.css";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
} as const

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
);