import { useEffect, useState } from 'react';
import { recipesApi, inventoryApi } from '../services/api';
import { Plus, Trash2 } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  baseunit: string;
}

interface RecipeItem {
  id: string;
  quantity: number;
  ingredient: Ingredient;
}

interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings?: number;
  items: RecipeItem[];
}
interface InventoryRow {
  id: string;
  quantity: number;
  ingredient: Ingredient;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    servings: number;
    items: Array<{ ingredientId: string; quantity: number }>;
  }>({
    name: '',
    description: '',
    servings: 1,
    items: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    const [recipesData, inventoryData]: [Recipe[], InventoryRow[]] =
      await Promise.all([
        recipesApi.getAll(),
        inventoryApi.getAll(),
      ]);

    setRecipes(recipesData);

    const uniqueIngredients: Ingredient[] = Array.from(
      new Map(
        inventoryData.map((row) => [
          row.ingredient.id,
          row.ingredient,
        ]),
      ).values(),
    );

    setIngredients(uniqueIngredients);
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Adaugă cel puțin un ingredient');
      return;
    }

    try {
      await recipesApi.create({
        name: formData.name,
        description: formData.description,
        servings: formData.servings,
        items: formData.items.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        })),
      });

      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        servings: 1,
        items: [],
      });

      await loadData();
    } catch (err) {
      console.error(err);
      alert('Eroare la crearea rețetei');
    }
  };

  const addRecipeItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ingredientId: '', quantity: 0 }],
    });
  };

  const updateRecipeItem = (
    index: number,
    field: 'ingredientId' | 'quantity',
    value: any,
  ) => {
    const items = [...formData.items];
    items[index] = { ...items[index], [field]: value };
    setFormData({ ...formData, items });
  };

  const removeRecipeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ștergi această rețetă?')) return;
    await recipesApi.delete(id);
    await loadData();
  };

  if (loading) {
    return <div className="text-center py-12">Se încarcă…</div>;
  }

  return (
    <div className="space-y-6 text-gray-900">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rețete</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Rețetă nouă
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Creează rețetă</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              placeholder="Nume rețetă"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <textarea
              placeholder="Descriere"
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <input
              type="number"
              min={1}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={formData.servings}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  servings: Number(e.target.value),
                })
              }
            />

            <div>
              {formData.items.map((item, index) => {
                const ingredient = ingredients.find(
                  (i) => i.id === item.ingredientId,
                );

                return (
                  <div key={index} className="flex gap-2 mb-2 items-center">
                    <select
                      required
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1"
                      value={item.ingredientId}
                      onChange={(e) =>
                        updateRecipeItem(index, 'ingredientId', e.target.value)
                      }
                    >
                      <option value="">Ingredient</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      required
                      className="w-32 rounded-md border border-gray-300 px-2 py-1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateRecipeItem(
                          index,
                          'quantity',
                          Number(e.target.value),
                        )
                      }
                    />

                    <span className="w-10 text-sm text-gray-500">
                      {ingredient?.baseunit ?? 'g'}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeRecipeItem(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addRecipeItem}
                className="text-blue-600 text-sm"
              >
                + Adaugă ingredient
              </button>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-md"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Creează rețeta
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-md">
        <ul className="divide-y">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{recipe.name}</h3>
                  <ul className="text-sm text-gray-600">
                    {recipe.items.map((i) => (
                      <li key={i.id}>
                        {i.quantity} {i.ingredient.baseunit} {i.ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="text-red-600"
                >
                  <Trash2 />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {recipes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nu există rețete
          </div>
        )}
      </div>
    </div>
  );
}
