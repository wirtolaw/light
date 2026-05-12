import { useState } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { format } from 'date-fns';

interface Props {
  date?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function WeightEntryModal({ date, onClose, onSaved }: Props) {
  const today = date || format(new Date(), 'yyyy-MM-dd');
  const [type, setType] = useState<'morning' | 'evening'>('morning');
  const [weight, setWeight] = useState('');
  const [isFasting, setIsFasting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const userId = getUserId();
    if (!userId || (!weight && !isFasting)) return;

    setSaving(true);
    const weightVal = weight ? parseFloat(weight) : null;

    const { data: existing } = await supabase
      .from('light_weight_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existing) {
      const updateData: Record<string, unknown> = {
        is_fasting_day: isFasting,
      };
      if (weightVal !== null) {
        if (type === 'morning') updateData.morning_weight = weightVal;
        else updateData.evening_weight = weightVal;
      }

      await supabase
        .from('light_weight_records')
        .update(updateData)
        .eq('id', existing.id);
    } else {
      const insertData: Record<string, unknown> = {
        user_id: userId,
        date: today,
        is_fasting_day: isFasting,
      };
      if (weightVal !== null) {
        if (type === 'morning') insertData.morning_weight = weightVal;
        else insertData.evening_weight = weightVal;
      }

      await supabase.from('light_weight_records').insert(insertData);
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[360px]">
        <h3 className="text-lg font-semibold mb-4">记录体重</h3>
        <p className="text-sm text-gray-500 mb-4">{today}</p>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('morning')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              type === 'morning' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            早晨
          </button>
          <button
            onClick={() => setType('evening')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              type === 'evening' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            晚间
          </button>
        </div>

        <input
          type="number"
          step="0.1"
          placeholder="输入体重 (kg)"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-2xl text-center mb-4 focus:outline-none focus:border-green-500"
        />

        <label className="flex items-center gap-2 mb-6">
          <input
            type="checkbox"
            checked={isFasting}
            onChange={e => setIsFasting(e.target.checked)}
            className="w-4 h-4 accent-green-600"
          />
          <span className="text-sm text-gray-600">今日断食 💧</span>
        </label>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!weight && !isFasting)}
            className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
