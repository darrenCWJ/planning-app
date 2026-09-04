import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { WorkspaceListPage } from "../features/workspace/pages/WorkspaceListPage";
import { WorkspaceDetailPage } from "../features/workspace/pages/WorkspaceDetailPage";
import { BoardPage } from "../features/board/pages/BoardPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { CalendarPage } from "../features/calendar/pages/CalendarPage";
import { KBPage } from "../features/kb/pages/KBPage";
import { ProfilePage } from "../features/profile/pages/ProfilePage";
import { AnalyticsPage } from "../features/analytics/pages/AnalyticsPage";
import { WebhookSettingsPage } from "../features/webhooks/pages/WebhookSettingsPage";
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
        <Route
          path="/workspaces/:id/projects/:projectId/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <CalendarPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/kb"
          element={
            <ProtectedRoute>
              <Layout>
                <KBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/kb/:pageId"
          element={
            <ProtectedRoute>
              <Layout>
                <KBPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/settings/webhooks"
          element={
            <ProtectedRoute>
              <Layout>
                <WebhookSettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
