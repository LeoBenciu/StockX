import { useEffect, useState } from 'react';
import { invoicesApi, receiptsApi, inventoryApi, dashboardApi } from '../services/api';
import { Package, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalInventory: 0,
    lowStockItems: 0,
    totalInvoices: 0,
    totalReceipts: 0,
  });
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [monthlyStatsLoading, setMonthlyStatsLoading] = useState(false);
  const [monthlyStatsError, setMonthlyStatsError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadData();
    loadMonthlyStats();
  }, [selectedYear, selectedMonth]);

  const loadMonthlyStats = async () => {
    setMonthlyStatsLoading(true);
    setMonthlyStatsError(null);
    try {
      const data = await dashboardApi.getMonthlyStats(selectedYear, selectedMonth);
      console.log('Monthly stats loaded:', data);
      setMonthlyStats(data);
    } catch (error: any) {
      console.error('Error loading monthly stats:', error);
      setMonthlyStatsError(error?.response?.data?.message || error?.message || 'Eroare la încărcarea statisticilor');
    } finally {
      setMonthlyStatsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [invoices, receipts, inventory, lowStock] = await Promise.all([
        invoicesApi.getAll(),
        receiptsApi.getAll(),
        inventoryApi.getAll(),
        inventoryApi.getLowStock(),
      ]);

      setStats({
        totalInventory: inventory.length,
        lowStockItems: lowStock.length,
        totalInvoices: invoices.length,
        totalReceipts: receipts.length,
      });

      // Prepare chart data (top 10 items by quantity)
      const sortedInventory = inventory
        .sort((a: { quantity: number }, b: { quantity: number }) => b.quantity - a.quantity)
        .slice(0, 10)
        .map((item: { quantity: number; ingredient: { name: string } }) => ({
          name: item.ingredient.name,
          quantity: item.quantity,
        }));

      setInventoryData(sortedInventory);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Se încarcă...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Panou de control</h1>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total articole inventar</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalInventory}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Articole cu stoc redus</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lowStockItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total facturi</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalInvoices}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total bonuri</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalReceipts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Top articole inventar</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inventoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantity" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Venituri și Cheltuieli</h2>
          <div className="flex gap-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
                'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
              ].map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
        {monthlyStatsLoading && (
          <div className="text-center py-8">Se încarcă statisticile...</div>
        )}
        {monthlyStatsError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Eroare:</p>
            <p>{monthlyStatsError}</p>
            <button
              onClick={loadMonthlyStats}
              className="mt-2 text-sm underline"
            >
              Încearcă din nou
            </button>
          </div>
        )}
        {!monthlyStatsLoading && !monthlyStatsError && monthlyStats && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Venituri</p>
                <p className="text-2xl font-bold text-green-600">
                  {monthlyStats.venituri?.toFixed(2) || '0.00'} RON
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Cheltuieli</p>
                <p className="text-2xl font-bold text-red-600">
                  {monthlyStats.cheltuieli?.toFixed(2) || '0.00'} RON
                </p>
              </div>
              <div className={`p-4 rounded-lg ${(monthlyStats.profit || 0) >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className="text-sm text-gray-600">Profit</p>
                <p className={`text-2xl font-bold ${(monthlyStats.profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {(monthlyStats.profit || 0).toFixed(2)} RON
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{
                Venituri: monthlyStats.venituri || 0,
                Cheltuieli: monthlyStats.cheltuieli || 0,
              }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} RON`} />
                <Legend />
                <Bar dataKey="Venituri" fill="#10b981" />
                <Bar dataKey="Cheltuieli" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
        {!monthlyStatsLoading && !monthlyStatsError && !monthlyStats && (
          <div className="text-center py-8 text-gray-500">
            Nu există date pentru această lună
          </div>
        )}
      </div>
    </div>
  );
}

