import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import IdentityAsZenRage from "./app/pages/IdentityAsZenRage.tsx";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/identity-as-zenrage" element={<IdentityAsZenRage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);