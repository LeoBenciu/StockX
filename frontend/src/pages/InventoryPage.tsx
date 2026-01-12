import { useEffect, useState } from 'react';
import { inventoryApi } from '../services/api';
import { Package, AlertTriangle } from 'lucide-react';

interface InventoryItem {
  id: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
  ingredient: {
    id: string;
    name: string;
    category?: string;
  };
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const [all, low] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getLowStock(),
      ]);
      setInventory(all);
      setLowStock(low);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Se încarcă...</div>;
  }

  const isLowStock = (item: InventoryItem) => {
    return item.minThreshold !== null && item.quantity <= item.minThreshold;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Inventar</h1>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800">
              {lowStock.length} articol(e) cu stoc redus
            </h3>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Toate articolele</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {inventory.map((item) => (
            <li key={item.id} className={isLowStock(item) ? 'bg-yellow-50' : ''}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{item.ingredient.name}</h3>
                      {item.ingredient.category && (
                        <p className="text-sm text-gray-500">{item.ingredient.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {item.quantity} {item.unit}
                    </div>
                    {item.minThreshold !== null && (
                      <div className="text-sm text-gray-500">
                        Min: {item.minThreshold} {item.unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {inventory.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nu există articole în inventar</div>
        )}
      </div>
    </div>
  );
}

