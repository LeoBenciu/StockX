import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import ReceiptsPage from './pages/ReceiptsPage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';
import { getDebugInfo } from './utils/log';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((state) => state.auth);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function DebugBar() {
  const location = useLocation();
  const show = import.meta.env.DEV || new URLSearchParams(location.search).get('debug') === '1';
  if (!show) return null;
  const info = getDebugInfo();
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1a1a1a',
        color: '#0f0',
        fontSize: '11px',
        fontFamily: 'monospace',
        padding: '6px 10px',
        zIndex: 9999,
        borderTop: '1px solid #333',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <span title="Current path">path: {info.pathname}</span>
      <span title="API base URL">API: {info.apiUrl}</span>
      <span title="Origin">origin: {info.origin}</span>
      <span title="Mode">mode: {info.mode}</span>
      <span style={{ color: '#888' }}>Open console for request/response logs</span>
    </div>
  );
}

function App() {
  return (
    <>
      <DebugBar />
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/invoices" element={<InvoicesPage />} />
                <Route path="/receipts" element={<ReceiptsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/recipes" element={<RecipesPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
    </>
  );
}

export default App;

