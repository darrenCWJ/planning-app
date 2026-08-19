import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { ProtectedRoute } from "../components/shared/ProtectedRoute";
import { Layout } from "../components/shared/Layout";

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <p className="text-gray-500 mt-1 text-sm">Workspaces and boards coming next.</p>
    </div>
  );
}

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
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <div className="p-8">
                  <h1 className="text-xl font-semibold text-gray-900">Workspace</h1>
                  <p className="text-gray-500 mt-1 text-sm">Coming in next task.</p>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
