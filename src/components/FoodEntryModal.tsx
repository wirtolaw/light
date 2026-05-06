import { useState, useMemo, useEffect } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { builtInFoods } from '../lib/foods';
import type { FoodItem } from '../lib/foods';
import { format } from 'date-fns';

interface Props {
  date?: string;
  meal?: 'breakfast' | 'lunch' | 'dinner';
  onClose: () => void;
  onSaved: () => void;
}

export default function FoodEntryModal({ date, meal: initialMeal, onClose, onSaved }: Props) {
  const today = date || format(new Date(), 'yyyy-MM-dd');
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner'>(initialMeal || 'lunch');
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [weightG, setWeightG] = useState('100');
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    supabase
      .from('light_food_database')
      .select('*')
      .eq('user_id', userId)
      .eq('is_custom', true)
      .then(({ data }) => {
        if (data) {
          setCustomFoods(data.map(d => ({
            name: d.name,
            calories_per_100g: d.calories_per_100g,
            protein_per_100g: d.protein_per_100g,
            carbs_per_100g: d.carbs_per_100g,
            fat_per_100g: d.fat_per_100g,
          })));
        }
      });
  }, []);

  const allFoods = useMemo(() => [...builtInFoods, ...customFoods], [customFoods]);

  const filteredFoods = useMemo(() => {
    if (!search) return allFoods.slice(0, 20);
    return allFoods.filter(f => f.name.includes(search));
  }, [search, allFoods]);

  const calculated = useMemo(() => {
    if (!selectedFood || !weightG) return null;
    const w = parseFloat(weightG) / 100;
    return {
      calories: Math.round(selectedFood.calories_per_100g * w),
      protein: Math.round(selectedFood.protein_per_100g * w * 10) / 10,
      carbs: Math.round(selectedFood.carbs_per_100g * w * 10) / 10,
      fat: Math.round(selectedFood.fat_per_100g * w * 10) / 10,
    };
  }, [selectedFood, weightG]);

  const handleAddToLog = async () => {
    const userId = getUserId();
    if (!userId || !selectedFood || !calculated) return;
    setSaving(true);

    await supabase.from('light_food_log').insert({
      user_id: userId,
      date: today,
      meal,
      time: format(new Date(), 'HH:mm'),
      food_name: selectedFood.name,
      weight_g: parseFloat(weightG) || 0,
      calories: calculated.calories,
      protein: calculated.protein,
      carbs: calculated.carbs,
      fat: calculated.fat,
    });

    setSaving(false);
    onSaved();
    onClose();
  };

  const handleSaveToFoodDB = async () => {
    const userId = getUserId();
    if (!userId || !manualName) return;
    setSaving(true);

    const { error } = await supabase.from('light_food_database').insert({
      user_id: userId,
      name: manualName,
      calories_per_100g: parseFloat(manualCalories) || 0,
      protein_per_100g: parseFloat(manualProtein) || 0,
      carbs_per_100g: parseFloat(manualCarbs) || 0,
      fat_per_100g: parseFloat(manualFat) || 0,
      is_custom: true,
    });

    if (!error) {
      setCustomFoods(prev => [...prev, {
        name: manualName,
        calories_per_100g: parseFloat(manualCalories) || 0,
        protein_per_100g: parseFloat(manualProtein) || 0,
        carbs_per_100g: parseFloat(manualCarbs) || 0,
        fat_per_100g: parseFloat(manualFat) || 0,
      }]);
      setSaveSuccess(`"${manualName}" 已保存到食物库，可在搜索食物中找到`);
      setManualName('');
      setManualCalories('');
      setManualProtein('');
      setManualCarbs('');
      setManualFat('');
      setTimeout(() => setSaveSuccess(''), 3000);
    }

    setSaving(false);
  };

  const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-2xl p-5 w-full max-w-[430px] max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">添加食物</h3>
          <button onClick={onClose} className="text-gray-400 text-xl">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-3">{today}</p>

        {/* Meal selection */}
        <div className="flex gap-2 mb-4">
          {(['breakfast', 'lunch', 'dinner'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMeal(m)}
              className={`flex-1 py-1.5 rounded-lg text-sm ${
                meal === m ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {mealLabels[m]}
            </button>
          ))}
        </div>

        {/* Toggle manual mode */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setManualMode(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs ${!manualMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-500'}`}
          >
            搜索食物
          </button>
          <button
            onClick={() => setManualMode(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs ${manualMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-500'}`}
          >
            手动输入
          </button>
        </div>

        {manualMode ? (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-gray-400">添加新食材到食物库（每100g营养数据），保存后可在"搜索食物"中使用</p>
            <input
              placeholder="食物名称"
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
            <input
              type="number"
              placeholder="热量 (kcal/100g)"
              value={manualCalories}
              onChange={e => setManualCalories(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="蛋白质(g/100g)"
                value={manualProtein}
                onChange={e => setManualProtein(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="碳水(g/100g)"
                value={manualCarbs}
                onChange={e => setManualCarbs(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <input
                type="number"
                placeholder="脂肪(g/100g)"
                value={manualFat}
                onChange={e => setManualFat(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            {saveSuccess && (
              <div className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{saveSuccess}</div>
            )}
            <button
              onClick={handleSaveToFoodDB}
              disabled={saving || !manualName || !manualCalories}
              className="w-full py-3 rounded-lg bg-blue-500 text-white font-medium disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存到食物库'}
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <input
              placeholder="搜索食物..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            />

            {/* Food list */}
            {!selectedFood && (
              <div className="max-h-40 overflow-y-auto mb-4 space-y-1">
                {filteredFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFood(food)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex justify-between"
                  >
                    <span>{food.name}</span>
                    <span className="text-gray-400">{food.calories_per_100g} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected food */}
            {selectedFood && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3 bg-green-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium text-green-700">{selectedFood.name}</span>
                  <button
                    onClick={() => setSelectedFood(null)}
                    className="text-xs text-gray-400"
                  >
                    更换
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="重量 (g)"
                  value={weightG}
                  onChange={e => setWeightG(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
                />
                {calculated && (
                  <>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-600 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-sm text-gray-800">{calculated.calories}</div>
                        <div>千卡</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-sm text-gray-800">{calculated.protein}</div>
                        <div>蛋白质</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-sm text-gray-800">{calculated.carbs}</div>
                        <div>碳水</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-sm text-gray-800">{calculated.fat}</div>
                        <div>脂肪</div>
                      </div>
                    </div>
                    <button
                      onClick={handleAddToLog}
                      disabled={saving}
                      className="w-full py-3 rounded-lg bg-green-500 text-white font-medium disabled:opacity-50"
                    >
                      {saving ? '添加中...' : '添加'}
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
