import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./style.css";
import "./Menu.css";

import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {

  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  // SPA: capture a pageview on every route change (React Router)
  capture_pageview: 'history_change',
  // Autocapture: clicks, form submits, inputs (enabled by default; explicit for clarity)
  autocapture: true,
  // Don't send autocapture events from password (or other sensitive) inputs
  before_send: (event) => {
    const chain = event?.properties?.elements_chain ?? '';
    if (typeof chain !== 'string') return event;
    // Drop events that involve a password field (element chain includes type=password)
    if (/attr__type=["']password["']|type=["']?password["']?/i.test(chain)) return null;
    return event;
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
);