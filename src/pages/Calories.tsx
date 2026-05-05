import { useState, useEffect } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import FoodEntryModal from '../components/FoodEntryModal';

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
}

interface Profile {
  height_cm: number;
  age: number;
  gender: string;
  start_weight: number;
}

export default function Calories() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);

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

    // Get latest weight
    const { data: weightData } = await supabase
      .from('light_weight_records')
      .select('morning_weight')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (weightData?.morning_weight) setCurrentWeight(weightData.morning_weight);
  };

  useEffect(() => { loadData(); }, [currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  // Daily calories map
  const dailyCalories: Record<string, number> = {};
  records.forEach(r => {
    dailyCalories[r.date] = (dailyCalories[r.date] || 0) + r.calories;
  });

  // Selected day records
  const dayRecords = records.filter(r => r.date === selectedDate);
  const dayTotal = dayRecords.reduce((sum, r) => sum + r.calories, 0);
  const dayProtein = dayRecords.reduce((sum, r) => sum + (r.protein || 0), 0);
  const dayCarbs = dayRecords.reduce((sum, r) => sum + (r.carbs || 0), 0);
  const dayFat = dayRecords.reduce((sum, r) => sum + (r.fat || 0), 0);

  // TDEE
  const weight = currentWeight || profile?.start_weight || 60;
  const bmr = profile
    ? (profile.gender === 'female'
      ? 655.1 + 9.563 * weight + 1.85 * profile.height_cm - 4.676 * profile.age
      : 66.47 + 13.75 * weight + 5.003 * profile.height_cm - 6.755 * profile.age)
    : 1400;
  const tdee = Math.round(bmr * 1.2);

  const mealLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

  const handleDelete = async (id: string) => {
    await supabase.from('light_food_log').delete().eq('id', id);
    loadData();
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

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${
                isSelected ? 'ring-2 ring-green-500 bg-green-50' : cal ? 'bg-gray-50' : ''
              }`}
            >
              <span className="font-medium">{day.getDate()}</span>
              {cal && <span className="text-[9px] text-gray-500">{cal}</span>}
            </button>
          );
        })}
      </div>

      {/* Daily summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium">{selectedDate}</h3>
          <button
            onClick={() => setShowFoodModal(true)}
            className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg"
          >
            添加食物
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
          <div className="bg-white rounded-lg p-2">
            <div className="font-bold text-base text-gray-800">{dayTotal}</div>
            <div className="text-gray-400">千卡</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="font-bold text-base text-gray-800">{dayProtein.toFixed(0)}</div>
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

        <div className="flex justify-between text-sm text-gray-600 border-t pt-3">
          <span>TDEE: {tdee} kcal</span>
          <span className={dayTotal <= tdee ? 'text-green-600' : 'text-red-500'}>
            缺口: {tdee - dayTotal} kcal
          </span>
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
                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{r.food_name}</span>
                    <span className="text-gray-400 ml-2">{r.weight_g}g</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{r.calories} kcal</span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-300 text-xs"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {showFoodModal && (
        <FoodEntryModal
          date={selectedDate}
          onClose={() => setShowFoodModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
