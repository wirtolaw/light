import { useState, useEffect } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { format, subDays, differenceInDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import WeightEntryModal from '../components/WeightEntryModal';

interface Profile {
  height_cm: number;
  age: number;
  gender: string;
  start_weight: number;
  goal_weight: number;
  goal_days: number;
  start_date: string;
}

interface WeightRecord {
  date: string;
  morning_weight: number | null;
  evening_weight: number | null;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [showWeightModal, setShowWeightModal] = useState(false);

  const userId = getUserId();

  const loadData = async () => {
    if (!userId) return;

    const { data: profileData } = await supabase
      .from('light_user_profile')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (profileData) setProfile(profileData);

    // Last 7 days weights
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const { data: weightData } = await supabase
      .from('light_weight_records')
      .select('date, morning_weight, evening_weight')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: true });

    if (weightData) setWeights(weightData);

    // Today's calories
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: foodData } = await supabase
      .from('light_food_log')
      .select('calories')
      .eq('user_id', userId)
      .eq('date', today);

    if (foodData) {
      setTodayCalories(foodData.reduce((sum, f) => sum + (f.calories || 0), 0));
    }

    // Latest measurements
    const { data: measData } = await supabase
      .from('light_measurement_records')
      .select('type, value, date')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (measData) {
      const latest: Record<string, number> = {};
      measData.forEach(m => {
        if (!latest[m.type]) latest[m.type] = m.value;
      });
      setMeasurements(latest);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (!profile) return <div className="p-6 text-center text-gray-400">加载中...</div>;

  const currentWeight = weights.length > 0
    ? (weights[weights.length - 1].morning_weight || weights[weights.length - 1].evening_weight || profile.start_weight)
    : profile.start_weight;

  const bmi = currentWeight / Math.pow(profile.height_cm / 100, 2);
  const totalToLose = profile.start_weight - profile.goal_weight;
  const lost = profile.start_weight - currentWeight;
  const progressPct = totalToLose > 0 ? Math.min(100, Math.max(0, (lost / totalToLose) * 100)) : 0;

  const daysElapsed = differenceInDays(new Date(), new Date(profile.start_date));
  const daysRemaining = Math.max(0, profile.goal_days - daysElapsed);

  // TDEE calculation
  const bmr = profile.gender === 'female'
    ? 655.1 + 9.563 * currentWeight + 1.85 * profile.height_cm - 4.676 * profile.age
    : 66.47 + 13.75 * currentWeight + 5.003 * profile.height_cm - 6.755 * profile.age;
  const tdee = Math.round(bmr * 1.2);
  const deficit = tdee - todayCalories;

  // Chart data
  const chartData = weights
    .filter(w => w.morning_weight)
    .map(w => ({
      date: w.date.slice(5),
      weight: w.morning_weight,
    }));

  const measurementLabels: Record<string, string> = {
    waist: '腰围',
    upper_chest: '上胸围',
    lower_chest: '下胸围',
    hips: '臀围',
    bicep: '臂围',
    thigh: '大腿围',
    calf: '小腿围',
  };

  return (
    <div className="px-4 pb-20 pt-6">
      {/* Current weight */}
      <div className="text-center mb-6">
        <button
          onClick={() => setShowWeightModal(true)}
          className="inline-block"
        >
          <div className="text-5xl font-bold text-gray-800">{currentWeight.toFixed(1)}</div>
          <div className="text-sm text-gray-400 mt-1">kg &middot; 点击记录</div>
        </button>
        <div className="text-sm text-gray-500 mt-2">BMI {bmi.toFixed(1)}</div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{profile.start_weight} kg</span>
          <span>{profile.goal_weight} kg</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-center text-sm text-gray-600 mt-2">
          已减 <span className="font-semibold text-green-600">{lost.toFixed(1)} kg</span>，目标达成 <span className="font-semibold">{progressPct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">最近7天体重</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Today's calories */}
      <div className="mb-6 bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">今日热量</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xl font-bold text-gray-800">{todayCalories}</div>
            <div className="text-xs text-gray-400">摄入 kcal</div>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{tdee}</div>
            <div className="text-xs text-gray-400">TDEE</div>
          </div>
          <div>
            <div className={`text-xl font-bold ${deficit > 0 ? 'text-green-600' : 'text-red-500'}`}>{deficit}</div>
            <div className="text-xs text-gray-400">缺口 kcal</div>
          </div>
        </div>
      </div>

      {/* Measurements */}
      {Object.keys(measurements).length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">最新围度</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(measurements).map(([type, value]) => (
              <div key={type} className="flex justify-between text-sm px-2">
                <span className="text-gray-500">{measurementLabels[type] || type}</span>
                <span className="font-medium">{value} cm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Days remaining */}
      <div className="text-center text-sm text-gray-500">
        剩余 <span className="font-semibold text-gray-700">{daysRemaining}</span> 天
      </div>

      {showWeightModal && (
        <WeightEntryModal
          onClose={() => setShowWeightModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
