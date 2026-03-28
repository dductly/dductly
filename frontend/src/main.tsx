import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./style.css";
import "./Menu.css";

import posthog from 'posthog-js';
import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  // SPA: capture a pageview on every route change (React Router)
  capture_pageview: 'history_change',
  // Autocapture: clicks, form submits, inputs (enabled by default; explicit for clarity)
  autocapture: true,
  // Error tracking: uncaught errors, unhandled promise rejections (see PostHog project → Error tracking)
  capture_exceptions: {
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true,
    capture_console_errors: false,
  },
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
      <PostHogErrorBoundary
        fallback={
          <div
            style={{
              padding: "2rem",
              maxWidth: "28rem",
              margin: "4rem auto",
              fontFamily: "system-ui, sans-serif",
              textAlign: "center",
            }}
          >
            <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#555", marginBottom: "1rem" }}>
              We have been notified. Try refreshing the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "0.5rem 1rem",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        }
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>
);