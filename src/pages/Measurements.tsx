import { useState, useEffect } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const TYPES = [
  { key: 'waist', label: '腰围' },
  { key: 'upper_chest', label: '上胸围' },
  { key: 'lower_chest', label: '下胸围' },
  { key: 'hips', label: '臀围' },
  { key: 'bicep', label: '臂围' },
  { key: 'thigh', label: '大腿围' },
  { key: 'calf', label: '小腿围' },
];

interface MeasurementRecord {
  type: string;
  value: number;
  date: string;
}

export default function Measurements() {
  const [records, setRecords] = useState<MeasurementRecord[]>([]);
  const [selectedType, setSelectedType] = useState('waist');
  const [showInput, setShowInput] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const userId = getUserId();

  const loadData = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('light_measurement_records')
      .select('type, value, date')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (data) setRecords(data);
  };

  useEffect(() => { loadData(); }, []);

  const latestValues: Record<string, number> = {};
  [...records].reverse().forEach(r => {
    if (!latestValues[r.type]) latestValues[r.type] = r.value;
  });

  const chartData = records
    .filter(r => r.type === selectedType)
    .map(r => ({ date: r.date.slice(5), value: r.value }));

  const handleSave = async (type: string) => {
    if (!userId || !inputValue) return;
    setSaving(true);

    await supabase.from('light_measurement_records').insert({
      user_id: userId,
      date: format(new Date(), 'yyyy-MM-dd'),
      type,
      value: parseFloat(inputValue),
    });

    setSaving(false);
    setShowInput(null);
    setInputValue('');
    loadData();
  };

  return (
    <div className="px-4 pb-20 pt-6">
      <h2 className="text-lg font-semibold mb-4">围度记录</h2>

      {/* Latest values */}
      <div className="space-y-2 mb-6">
        {TYPES.map(t => (
          <div key={t.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <button
              onClick={() => setSelectedType(t.key)}
              className={`text-sm font-medium ${selectedType === t.key ? 'text-green-600' : 'text-gray-700'}`}
            >
              {t.label}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                {latestValues[t.key] ? `${latestValues[t.key]} cm` : '-'}
              </span>
              {showInput === t.key ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSave(t.key)}
                    disabled={saving}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => { setShowInput(null); setInputValue(''); }}
                    className="text-xs text-gray-400"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowInput(t.key); setInputValue(''); }}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                >
                  记录
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            {TYPES.find(t => t.key === selectedType)?.label} 趋势
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
