import { useState } from 'react';
import { supabase, setUserId } from '../lib/supabase';
import { format } from 'date-fns';

interface Props {
  onComplete: () => void;
}

export default function Setup({ onComplete }: Props) {
  const [nickname, setNickname] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [startWeight, setStartWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [goalDays, setGoalDays] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nickname || !height || !age || !startWeight || !goalWeight || !goalDays) return;
    setSaving(true);

    setUserId(nickname);

    await supabase.from('light_user_profile').insert({
      user_id: nickname,
      height_cm: parseFloat(height),
      age: parseInt(age),
      gender,
      start_weight: parseFloat(startWeight),
      goal_weight: parseFloat(goalWeight),
      goal_days: parseInt(goalDays),
      start_date: startDate,
    });

    // Also record the starting weight
    await supabase.from('light_weight_records').insert({
      user_id: nickname,
      date: startDate,
      morning_weight: parseFloat(startWeight),
      is_fasting_day: false,
    });

    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        <h1 className="text-2xl font-bold text-center mb-2">Light</h1>
        <p className="text-center text-gray-500 text-sm mb-8">开始你的轻盈之旅</p>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">昵称</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="输入你的昵称"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">身高 (cm)</label>
              <input
                type="number"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">年龄</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">性别</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender('female')}
                className={`flex-1 py-2 rounded-lg text-sm ${gender === 'female' ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
              >
                女
              </button>
              <button
                onClick={() => setGender('male')}
                className={`flex-1 py-2 rounded-lg text-sm ${gender === 'male' ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'}`}
              >
                男
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">起始体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={startWeight}
                onChange={e => setStartWeight(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">目标体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={e => setGoalWeight(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">目标天数</label>
              <input
                type="number"
                value={goalDays}
                onChange={e => setGoalDays(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !nickname || !height || !age || !startWeight || !goalWeight || !goalDays}
            className="w-full py-3 rounded-lg bg-green-500 text-white font-medium mt-4 disabled:opacity-50"
          >
            {saving ? '保存中...' : '开始'}
          </button>
        </div>
      </div>
    </div>
  );
}
