import { useEffect, useState } from 'react';
import { recipesApi, inventoryApi } from '../services/api';
import { ChefHat, Plus, Trash2, Edit } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface RecipeItem {
  id: string;
  quantity: number;
  unit: string;
  ingredient: Ingredient;
}

interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings?: number;
  items: RecipeItem[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    servings: 1,
    items: [] as Array<{ ingredientId: string; quantity: number; unit: string }>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recipesData, inventoryData] = await Promise.all([
        recipesApi.getAll(),
        inventoryApi.getAll(),
      ]);
      setRecipes(recipesData);
      // Extract unique ingredients from inventory
      const uniqueIngredients = Array.from(
        new Map(inventoryData.map((item) => [item.ingredient.id, item.ingredient])).values()
      );
      setIngredients(uniqueIngredients);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recipesApi.create(formData);
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        servings: 1,
        items: [],
      });
      await loadData();
    } catch (error) {
      console.error('Error creating recipe:', error);
      alert('Eroare la crearea rețetei');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ești sigur că vrei să ștergi această rețetă?')) return;

    try {
      await recipesApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Eroare la ștergerea rețetei');
    }
  };

  const addRecipeItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ingredientId: '', quantity: 0, unit: 'g' }],
    });
  };

  const updateRecipeItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeRecipeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div className="text-center py-12">Se încarcă...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Rețete</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Rețetă nouă
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Creează rețetă nouă</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nume rețetă</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descriere</label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Porții</label>
              <input
                type="number"
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ingrediente</label>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    required
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={item.ingredientId}
                    onChange={(e) => updateRecipeItem(index, 'ingredientId', e.target.value)}
                  >
                    <option value="">Selectează ingredient</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="Cantitate"
                    className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={item.quantity}
                    onChange={(e) => updateRecipeItem(index, 'quantity', parseFloat(e.target.value))}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Unitate"
                    className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={item.unit}
                    onChange={(e) => updateRecipeItem(index, 'unit', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRecipeItem(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addRecipeItem}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Adaugă ingredient
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Creează rețeta
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChefHat className="w-8 h-8 text-gray-400 mr-4" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{recipe.name}</h3>
                      {recipe.description && (
                        <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                      )}
                      {recipe.servings && (
                        <p className="text-sm text-gray-500">Pentru {recipe.servings} porții</p>
                      )}
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Ingrediente:</p>
                        <ul className="text-sm text-gray-600 mt-1">
                          {recipe.items.map((item) => (
                            <li key={item.id}>
                              {item.quantity} {item.unit} {item.ingredient.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {recipes.length === 0 && (
          <div className="text-center py-12 text-gray-500">Nu au fost create rețete</div>
        )}
      </div>
    </div>
  );
}

