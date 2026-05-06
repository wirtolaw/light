import { useState, useEffect, useMemo } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import FoodEntryModal from '../components/FoodEntryModal';
import { builtInFoods } from '../lib/foods';
import type { FoodItem } from '../lib/foods';

interface FoodRecord {
  id: string;
  date: string;
  meal: string;
  food_name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  food_id?: string;
}

interface Profile {
  height_cm: number;
  age: number;
  gender: string;
  start_weight: number;
}

interface WeightRecord {
  date: string;
  morning_weight: number | null;
  activity_factor: number | null;
  calorie_target_factor: number | null;
  is_fasting_day: boolean;
}

export default function Calories() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<FoodRecord | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editMeal, setEditMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [editSaving, setEditSaving] = useState(false);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [activityFactor, setActivityFactor] = useState(1.2);
  const [calorieTargetFactor, setCalorieTargetFactor] = useState(0.8);
  const [showTargetEditor, setShowTargetEditor] = useState(false);
  const [editTargetValue, setEditTargetValue] = useState('0.8');
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);

  const userId = getUserId();

  const loadData = async () => {
    if (!userId) return;

    const monthStartStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('light_food_log')
      .select('*')
      .eq('user_id', userId)
      .gte('date', monthStartStr)
      .lte('date', monthEndStr)
      .order('time', { ascending: true });

    if (data) setRecords(data);

    const { data: profileData } = await supabase
      .from('light_user_profile')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (profileData) setProfile(profileData);

    // Get weight records for this month + recent history for factor inheritance
    const { data: weightData } = await supabase
      .from('light_weight_records')
      .select('date, morning_weight, activity_factor, calorie_target_factor, is_fasting_day')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(60);

    if (weightData && weightData.length > 0) {
      setWeightRecords(weightData);
      const latestWithWeight = weightData.find(w => w.morning_weight);
      if (latestWithWeight) setCurrentWeight(latestWithWeight.morning_weight);

      // Activity factor: prefer selected date, fallback to most recent
      const selectedAF = weightData.find(w => w.date === selectedDate && w.activity_factor);
      const recentAF = weightData.find(w => w.activity_factor);
      setActivityFactor(selectedAF?.activity_factor || recentAF?.activity_factor || 1.2);

      // Calorie target factor logic
      const selectedRecord = weightData.find(w => w.date === selectedDate);
      if (selectedRecord?.calorie_target_factor != null) {
        // 1. User manually set for this day
        setCalorieTargetFactor(selectedRecord.calorie_target_factor);
      } else if (selectedRecord?.is_fasting_day) {
        // 2. Fasting day without manual override → 0.15
        setCalorieTargetFactor(0.15);
      } else {
        // 3. Inherit from most recent non-fasting day
        const recentNonFasting = weightData.find(w =>
          w.date < selectedDate && !w.is_fasting_day && w.calorie_target_factor != null
        );
        if (recentNonFasting?.calorie_target_factor != null) {
          setCalorieTargetFactor(recentNonFasting.calorie_target_factor);
        } else {
          // 4. Default
          setCalorieTargetFactor(0.8);
        }
      }
    }

    // Load custom foods
    const { data: customData } = await supabase
      .from('light_food_database')
      .select('*')
      .eq('user_id', userId)
      .eq('is_custom', true);
    if (customData) {
      setCustomFoods(customData.map(d => ({
        name: d.name,
        calories_per_100g: d.calories_per_100g,
        protein_per_100g: d.protein_per_100g,
        carbs_per_100g: d.carbs_per_100g,
        fat_per_100g: d.fat_per_100g,
      })));
    }
  };

  useEffect(() => { loadData(); }, [currentMonth, selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  // Daily calories map
  const dailyCalories: Record<string, number> = {};
  records.forEach(r => {
    dailyCalories[r.date] = (dailyCalories[r.date] || 0) + r.calories;
  });

  // Fasting days map
  const fastingDays: Record<string, boolean> = {};
  weightRecords.forEach(w => {
    if (w.is_fasting_day) fastingDays[w.date] = true;
  });

  // Selected day records
  const dayRecords = records.filter(r => r.date === selectedDate);
  const dayTotal = dayRecords.reduce((sum, r) => sum + r.calories, 0);
  const dayProtein = dayRecords.reduce((sum, r) => sum + (r.protein || 0), 0);
  const dayCarbs = dayRecords.reduce((sum, r) => sum + (r.carbs || 0), 0);
  const dayFat = dayRecords.reduce((sum, r) => sum + (r.fat || 0), 0);

  // TDEE & target
  const weight = currentWeight || profile?.start_weight || 60;
  const bmr = profile
    ? (profile.gender === 'female'
      ? 655.1 + 9.563 * weight + 1.85 * profile.height_cm - 4.676 * profile.age
      : 66.47 + 13.75 * weight + 5.003 * profile.height_cm - 6.755 * profile.age)
    : 1400;
  const tdee = Math.round(bmr * activityFactor);
  const targetCalories = Math.round(tdee * calorieTargetFactor);
  const deficit = tdee - dayTotal;
  const canStillEat = targetCalories - dayTotal;

  // Protein target
  const proteinTarget = Math.round(weight * 1.2);

  // Color helpers
  const getCalorieColor = () => {
    if (targetCalories === 0) return 'text-gray-800';
    const ratio = dayTotal / targetCalories;
    if (ratio > 1) return 'text-red-500';
    if (ratio >= 0.8) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getProteinColor = () => {
    if (proteinTarget === 0) return 'text-gray-800';
    const ratio = dayProtein / proteinTarget;
    if (ratio >= 1) return 'text-blue-500';
    if (ratio >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const mealLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

  const allFoods = useMemo(() => [...builtInFoods, ...customFoods], [customFoods]);

  const findFoodItem = (name: string): FoodItem | null => {
    return allFoods.find(f => f.name === name) || null;
  };

  const editFoodItem = editingRecord ? findFoodItem(editingRecord.food_name) : null;

  const editCalculated = useMemo(() => {
    if (!editFoodItem || !editWeight) return null;
    const w = parseFloat(editWeight) / 100;
    return {
      calories: Math.round(editFoodItem.calories_per_100g * w),
      protein: Math.round(editFoodItem.protein_per_100g * w * 10) / 10,
      carbs: Math.round(editFoodItem.carbs_per_100g * w * 10) / 10,
      fat: Math.round(editFoodItem.fat_per_100g * w * 10) / 10,
    };
  }, [editFoodItem, editWeight]);

  const openEdit = (record: FoodRecord) => {
    setEditingRecord(record);
    setEditWeight(String(record.weight_g));
    setEditMeal(record.meal as 'breakfast' | 'lunch' | 'dinner');
  };

  const handleEditSave = async () => {
    if (!editingRecord) return;
    setEditSaving(true);

    const updates: Record<string, unknown> = {
      meal: editMeal,
      weight_g: parseFloat(editWeight) || 0,
    };

    if (editCalculated) {
      updates.calories = editCalculated.calories;
      updates.protein = editCalculated.protein;
      updates.carbs = editCalculated.carbs;
      updates.fat = editCalculated.fat;
    } else {
      const ratio = (parseFloat(editWeight) || 0) / (editingRecord.weight_g || 1);
      updates.calories = Math.round(editingRecord.calories * ratio);
      updates.protein = Math.round(editingRecord.protein * ratio * 10) / 10;
      updates.carbs = Math.round(editingRecord.carbs * ratio * 10) / 10;
      updates.fat = Math.round(editingRecord.fat * ratio * 10) / 10;
    }

    await supabase.from('light_food_log').update(updates).eq('id', editingRecord.id);
    setEditingRecord(null);
    setEditSaving(false);
    loadData();
  };

  const handleEditDelete = async () => {
    if (!editingRecord) return;
    setEditSaving(true);
    await supabase.from('light_food_log').delete().eq('id', editingRecord.id);
    setEditingRecord(null);
    setEditSaving(false);
    loadData();
  };

  const editPreview = useMemo(() => {
    if (!editingRecord) return null;
    if (editCalculated) return editCalculated;
    const ratio = (parseFloat(editWeight) || 0) / (editingRecord.weight_g || 1);
    return {
      calories: Math.round(editingRecord.calories * ratio),
      protein: Math.round(editingRecord.protein * ratio * 10) / 10,
      carbs: Math.round(editingRecord.carbs * ratio * 10) / 10,
      fat: Math.round(editingRecord.fat * ratio * 10) / 10,
    };
  }, [editingRecord, editCalculated, editWeight]);

  const handleSaveTargetFactor = async () => {
    const val = parseFloat(editTargetValue);
    if (isNaN(val) || val < 0 || val > 2) return;
    setCalorieTargetFactor(val);
    setShowTargetEditor(false);

    // Upsert into weight_records
    const { data: existing } = await supabase
      .from('light_weight_records')
      .select('id')
      .eq('user_id', userId)
      .eq('date', selectedDate)
      .limit(1)
      .single();

    if (existing) {
      await supabase.from('light_weight_records').update({ calorie_target_factor: val }).eq('id', existing.id);
    } else {
      await supabase.from('light_weight_records').insert({
        user_id: userId,
        date: selectedDate,
        calorie_target_factor: val,
      });
    }
  };

  return (
    <div className="px-4 pb-20 pt-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-gray-500">&lt;</button>
        <h2 className="text-lg font-semibold">{format(currentMonth, 'yyyy年M月')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-gray-500">&gt;</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array(startDow).fill(null).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const cal = dailyCalories[dateStr];
          const isSelected = selectedDate === dateStr;
          const isFasting = fastingDays[dateStr];

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${
                isSelected ? 'ring-2 ring-green-500 bg-green-50' : cal ? 'bg-gray-50' : ''
              }`}
            >
              <span className="font-medium">{day.getDate()}{isFasting ? ' 💧' : ''}</span>
              {cal && <span className="text-[9px] text-gray-500">{cal}</span>}
            </button>
          );
        })}
      </div>

      {/* Daily summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium">{selectedDate}{fastingDays[selectedDate] ? ' 💧' : ''}</h3>
          <button
            onClick={() => setShowFoodModal(true)}
            className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg"
          >
            添加食物
          </button>
        </div>

        {/* Intake summary with colors */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
          <div className="bg-white rounded-lg p-2">
            <div className={`font-bold text-base ${getCalorieColor()}`}>{dayTotal}</div>
            <div className="text-gray-400">千卡</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className={`font-bold text-base ${getProteinColor()}`}>{dayProtein.toFixed(0)}</div>
            <div className="text-gray-400">蛋白质g</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="font-bold text-base text-gray-800">{dayCarbs.toFixed(0)}</div>
            <div className="text-gray-400">碳水g</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="font-bold text-base text-gray-800">{dayFat.toFixed(0)}</div>
            <div className="text-gray-400">脂肪g</div>
          </div>
        </div>

        {/* TDEE / Target / Deficit / Can still eat */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs border-t pt-3">
          <div>
            <div className="text-gray-400 mb-1">TDEE</div>
            <div className="font-bold text-sm text-gray-800">{tdee}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">目标热量</div>
            <button
              onClick={() => { setEditTargetValue(String(calorieTargetFactor)); setShowTargetEditor(true); }}
              className="font-bold text-sm text-green-600 underline underline-offset-2"
            >
              {targetCalories}
            </button>
          </div>
          <div>
            <div className="text-gray-400 mb-1">缺口</div>
            <div className={`font-bold text-sm ${deficit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{deficit}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">还能吃</div>
            <div className={`font-bold text-sm ${canStillEat >= 0 ? 'text-green-600' : 'text-red-500'}`}>{canStillEat}</div>
          </div>
        </div>
      </div>

      {/* Meals breakdown */}
      {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
        const mealRecords = dayRecords.filter(r => r.meal === meal);
        if (mealRecords.length === 0) return null;
        return (
          <div key={meal} className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 mb-1">{mealLabels[meal]}</h4>
            <div className="space-y-1">
              {mealRecords.map(r => (
                <button
                  key={r.id}
                  onClick={() => openEdit(r)}
                  className="w-full text-left bg-gray-50 rounded-lg px-3 py-2 active:bg-gray-100"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{r.food_name}</span>
                    <span className="text-gray-400">{r.weight_g}g</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.calories} kcal · 蛋白质 {(r.protein || 0).toFixed(1)}g · 碳水 {(r.carbs || 0).toFixed(1)}g · 脂肪 {(r.fat || 0).toFixed(1)}g
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Food Entry Modal */}
      {showFoodModal && (
        <FoodEntryModal
          date={selectedDate}
          onClose={() => setShowFoodModal(false)}
          onSaved={loadData}
        />
      )}

      {/* Target Factor Editor Modal */}
      {showTargetEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowTargetEditor(false)}>
          <div className="bg-white rounded-2xl p-5 w-[90%] max-w-[400px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">目标热量</h3>
              <button onClick={() => setShowTargetEditor(false)} className="text-gray-400 text-xl">&times;</button>
            </div>

            <div className="text-sm text-gray-500 mb-3">TDEE: {tdee} kcal</div>

            <label className="text-xs text-gray-400 mb-1 block">目标系数</label>
            <input
              type="number"
              step="0.01"
              value={editTargetValue}
              onChange={e => setEditTargetValue(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            />

            <div className="space-y-1 mb-4">
              {[
                { val: 0.8, label: '0.8 轻度减脂' },
                { val: 0.7, label: '0.7 中度减脂' },
                { val: 0.6, label: '0.6 高度减脂' },
                { val: 0.15, label: '0.15 液断' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setEditTargetValue(String(opt.val))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    editTargetValue === String(opt.val) ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="text-center text-xs text-gray-400 mb-3">
              目标热量 = {tdee} × {editTargetValue} = {Math.round(tdee * (parseFloat(editTargetValue) || 0.8))} kcal
            </div>

            <button
              onClick={handleSaveTargetFactor}
              className="w-full py-3 rounded-lg bg-green-500 text-white font-medium"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingRecord(null)}>
          <div className="bg-white rounded-2xl p-5 w-[90%] max-w-[400px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">编辑食物</h3>
              <button onClick={() => setEditingRecord(null)} className="text-gray-400 text-xl">&times;</button>
            </div>

            <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
              <span className="text-sm font-medium text-gray-700">{editingRecord.food_name}</span>
            </div>

            <label className="text-xs text-gray-400 mb-1 block">重量 (g)</label>
            <input
              type="number"
              value={editWeight}
              onChange={e => setEditWeight(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-green-500"
            />

            <label className="text-xs text-gray-400 mb-1 block">餐段</label>
            <div className="flex gap-2 mb-4">
              {(['breakfast', 'lunch', 'dinner'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setEditMeal(m)}
                  className={`flex-1 py-1.5 rounded-lg text-sm ${
                    editMeal === m ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {mealLabels[m]}
                </button>
              ))}
            </div>

            {editPreview && (
              <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-600 mb-4">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-sm text-gray-800">{editPreview.calories}</div>
                  <div>千卡</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-sm text-gray-800">{editPreview.protein}</div>
                  <div>蛋白质</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-sm text-gray-800">{editPreview.carbs}</div>
                  <div>碳水</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="font-semibold text-sm text-gray-800">{editPreview.fat}</div>
                  <div>脂肪</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 py-3 rounded-lg bg-green-500 text-white font-medium disabled:opacity-50"
              >
                {editSaving ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  if (confirm('确定删除这条记录？')) handleEditDelete();
                }}
                disabled={editSaving}
                className="flex-1 py-3 rounded-lg bg-red-500 text-white font-medium disabled:opacity-50"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
