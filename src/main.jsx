import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const Playground = lazy(() => import("./pages/Playground"));
const isPlayground = window.location.pathname.startsWith("/playground");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isPlayground ? (
      <Suspense fallback={<div className="min-h-svh bg-background" />}>
        <Playground />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
