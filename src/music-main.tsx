// src/music-main.tsx
import { createRoot } from "react-dom/client";
import { MusicProvider } from "./context/MusicContext";
import MusicPage from "./pages/MusicPage";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <MusicProvider>
    <MusicPage />
  </MusicProvider>
);
