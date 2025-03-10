import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles/App.css";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
const MainApp = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/serviceWorker.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MainApp />
    <Toaster />
  </StrictMode>
);
