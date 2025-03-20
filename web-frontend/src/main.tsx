import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/App.css";
import App from "./App";
import { Toaster } from "./components/ui/toaster";
const MainApp = () => {
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MainApp />
    <Toaster />
  </StrictMode>
);
