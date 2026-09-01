import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { WorkspaceListPage } from "../features/workspace/pages/WorkspaceListPage";
import { WorkspaceDetailPage } from "../features/workspace/pages/WorkspaceDetailPage";
import { BoardPage } from "../features/board/pages/BoardPage";
import { ProtectedRoute } from "../components/shared/ProtectedRoute";
import { Layout } from "../components/shared/Layout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <WorkspaceListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <WorkspaceDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/projects/:projectId/board"
          element={
            <ProtectedRoute>
              <Layout>
                <BoardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
