import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SiteLayout from "./site/SiteLayout.tsx";
import Home from "./site/Home.tsx";
import Blog from "./site/Blog.tsx";
import Post from "./site/Post.tsx";
import { MePage, ProjectsPage, PublicationsPage, ResearchPage } from "./site/Pages.tsx";
import { applyTheme, initialTheme } from "./site/useTheme.ts";
import "./styles/index.css";

// The CMS is only loaded when /admin is visited.
const Admin = lazy(() => import("./admin/Admin.tsx"));
const LoginPage = lazy(() => import("./admin/LoginPage.tsx"));

applyTheme(initialTheme());

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="me" element={<MePage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="publications" element={<PublicationsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<Post />} />
      </Route>
      <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
      <Route path="/login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
