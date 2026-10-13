import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import ProfilePage from './pages/private/Users/ProfilePage';
import ManageUsersPage from './pages/private/Users/ManageUsersPage';

import ApdexAnalyzeResultPage from './pages/private/Dynatrace/ApdexAnalyze/ApdexAnalyzeResultPage';
import FormApdexAnalyze from './pages/private/Dynatrace/ApdexAnalyze/FormApdexAnalyze';
import TenantSelectionPage from './pages/private/Dynatrace/Report/ReportPage/FormReportPage';
import ReportPage from './pages/private/Dynatrace/Report/ReportPage/ReportPage';
import ReportSelectionPage from './pages/private/Dynatrace/Report/ReportPage/ReportSelectionPage';
import InventoryTenantSelectPage from './pages/private/Dynatrace/Inventory/InventoryTenantSelectPage';
import InventoryDashboardPage from './pages/private/Dynatrace/Inventory/InventoryDashboardPage';
import PlatformCredentialsPage from './pages/private/Dynatrace/Credentials/PlatformCredentialsPage';
import LicenseDashboardPage from './pages/private/Dynatrace/License/LicenseDashboardPage';

import SchedulePage from './pages/private/Schedule/SchedulePage';
import ManageCollaborators from './pages/private/Schedule/ManageCollaborators';
import ManageAbsence from './pages/private/Schedule/ManageAbsence';
import ManagePrograms from './pages/private/Schedule/ManagePrograms';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.perfil !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Públicas ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* ── Perfil ── */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* ── Usuários (admin) ── */}
            <Route path="/users" element={
              <ProtectedRoute>
                <AdminRoute><ManageUsersPage /></AdminRoute>
              </ProtectedRoute>
            } />

            {/* ── Report ── */}
            <Route path="/select-report" element={<ProtectedRoute><ReportSelectionPage /></ProtectedRoute>} />
            <Route path="/form-report" element={<ProtectedRoute><TenantSelectionPage /></ProtectedRoute>} />
            <Route path="/form-report/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

            {/* ── Apdex ── */}
            <Route path="/form-apdex-analyze/" element={<ProtectedRoute><FormApdexAnalyze /></ProtectedRoute>} />
            <Route path="/form-apdex-analyze/result" element={<ProtectedRoute><ApdexAnalyzeResultPage /></ProtectedRoute>} />

            {/* ── Schedule ── */}
            <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/schedule/collaboratos" element={<ProtectedRoute><ManageCollaborators /></ProtectedRoute>} />
            <Route path="/schedule/absence" element={<ProtectedRoute><ManageAbsence /></ProtectedRoute>} />
            <Route path="/schedule/programs" element={<ProtectedRoute><ManagePrograms /></ProtectedRoute>} />

            {/* ── Inventory ── */}
            <Route path="/inventory" element={<ProtectedRoute><InventoryTenantSelectPage /></ProtectedRoute>} />
            <Route path="/inventory/:tenantId" element={<ProtectedRoute><InventoryDashboardPage /></ProtectedRoute>} />

            {/* ── Platform Credentials ── */}
            <Route path="/platform-credentials" element={<ProtectedRoute><PlatformCredentialsPage /></ProtectedRoute>} />

            {/* ── Licenciamento ── */}
            <Route path="/licenciamento" element={<ProtectedRoute><LicenseDashboardPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;