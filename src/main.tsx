import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { MusicProvider } from "./context/MusicContext.js";

createRoot(document.getElementById("root")!).render(
  <MusicProvider>
    <App />
  </MusicProvider>
);