import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './hooks/redux';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import ReceiptsPage from './pages/ReceiptsPage';
import InventoryPage from './pages/InventoryPage';
import RecipesPage from './pages/RecipesPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((state) => state.auth);
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
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
  );
}

export default App;

