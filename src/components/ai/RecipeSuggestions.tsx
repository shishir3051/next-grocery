'use client';
import { useState } from 'react';
import { ChefHat, X, Plus, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

export default function RecipeSuggestions() {
  const { items, addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);

  const fetchRecipes = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setRecipes([]);
    try {
      const cartItems = items.map(i => i.name);
      const res = await fetch('/api/ai/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems }),
      });
      const data = await res.json();
      if (data.recipes) setRecipes(data.recipes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchRecipes();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-orange-200"
      >
        <ChefHat size={15} />
        Recipes
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                  <ChefHat size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Recipe Suggestions</h3>
                  <p className="text-xs text-slate-400">Based on your cart items</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Add items to your cart first!</p>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Sparkles size={14} className="text-orange-400" />
                    AI is cooking up ideas...
                  </p>
                </div>
              ) : recipes.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>No recipes found. Try adding more items.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipes.map((recipe: any, i: number) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-4 hover:border-orange-300 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-slate-800">{recipe.name}</h4>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                          {recipe.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">{recipe.description}</p>
                      {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-700 mb-2">Missing ingredients:</p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.missingIngredients.map((ing: string, j: number) => (
                              <span key={j} className="text-xs bg-white border border-amber-200 text-amber-700 px-2 py-1 rounded-full">
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
