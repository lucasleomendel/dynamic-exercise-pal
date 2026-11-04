import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// After a new publish, an open/cached app may ask for files that no longer exist.
// Reload once to pick up the new version instead of hanging on the logo.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    if (sessionStorage.getItem("fitforge_chunk_reload") === "1") return;
    sessionStorage.setItem("fitforge_chunk_reload", "1");
  } catch { /* ignore */ }
  window.location.reload();
});

(window as unknown as { __fitforgeBooted?: boolean }).__fitforgeBooted = true;
createRoot(document.getElementById("root")!).render(<App />);
// The app started fine: allow a future one-time recovery reload again.
setTimeout(() => { try { sessionStorage.removeItem("fitforge_chunk_reload"); } catch { /* ignore */ } }, 10000);
