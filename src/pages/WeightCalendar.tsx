import { useState, useEffect } from 'react';
import { supabase, getUserId } from '../lib/supabase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, subDays } from 'date-fns';
import WeightEntryModal from '../components/WeightEntryModal';

interface WeightRecord {
  date: string;
  morning_weight: number | null;
  evening_weight: number | null;
  is_fasting_day: boolean;
  has_bowel: boolean;
  bowel_note: string | null;
}

export default function WeightCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<Record<string, WeightRecord>>({});
  const [allRecords, setAllRecords] = useState<WeightRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<string | undefined>();
  const [bowelLabels, setBowelLabels] = useState<string[]>([]);
  const [bowelInput, setBowelInput] = useState('');

  const userId = getUserId();

  const loadData = async () => {
    if (!userId) return;

    const { data } = await supabase
      .from('light_weight_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (data) {
      setAllRecords(data);
      const map: Record<string, WeightRecord> = {};
      data.forEach(r => { map[r.date] = r; });
      setRecords(map);
    }

    // Load bowel labels
    const { data: profile } = await supabase
      .from('light_user_profile')
      .select('bowel_labels')
      .eq('user_id', userId)
      .limit(1)
      .single();
    if (profile?.bowel_labels) {
      setBowelLabels(profile.bowel_labels);
    }
  };

  useEffect(() => { loadData(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);

  const getColorClass = (dateStr: string): string => {
    const rec = records[dateStr];
    if (!rec || !rec.morning_weight) return '';
    const prevDate = format(subDays(new Date(dateStr), 1), 'yyyy-MM-dd');
    const prevRec = records[prevDate];
    if (!prevRec || !prevRec.morning_weight) return 'bg-gray-100';
    const diff = rec.morning_weight - prevRec.morning_weight;
    if (diff < 0) return 'bg-green-100 text-green-700';
    if (diff > 0) return 'bg-red-100 text-red-700';
    return 'bg-gray-100';
  };

  const getSelectedDetails = () => {
    if (!selectedDate) return null;
    const rec = records[selectedDate];
    if (!rec) return null;

    const prevDate = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd');
    const prevRec = records[prevDate];
    const dailyChange = rec.morning_weight && prevRec?.morning_weight
      ? rec.morning_weight - prevRec.morning_weight : null;

    const weekDate = format(subDays(new Date(selectedDate), 7), 'yyyy-MM-dd');
    const weekRec = records[weekDate];
    const weeklyChange = rec.morning_weight && weekRec?.morning_weight
      ? rec.morning_weight - weekRec.morning_weight : null;

    const monthDate = format(subDays(new Date(selectedDate), 30), 'yyyy-MM-dd');
    const monthRec = records[monthDate];
    const monthlyChange = rec.morning_weight && monthRec?.morning_weight
      ? rec.morning_weight - monthRec.morning_weight : null;

    const firstRec = allRecords.find(r => r.morning_weight);
    const totalChange = rec.morning_weight && firstRec?.morning_weight
      ? rec.morning_weight - firstRec.morning_weight : null;

    return { rec, dailyChange, weeklyChange, monthlyChange, totalChange };
  };

  const details = getSelectedDetails();
  const selectedRec = selectedDate ? records[selectedDate] : null;

  const formatChange = (val: number | null) => {
    if (val === null) return '-';
    const sign = val > 0 ? '+' : '';
    const color = val < 0 ? 'text-green-600' : val > 0 ? 'text-red-500' : 'text-gray-500';
    return <span className={color}>{sign}{val.toFixed(1)} kg</span>;
  };

  const toggleBowel = async (checked: boolean) => {
    if (!userId || !selectedDate) return;

    const { data: existing } = await supabase
      .from('light_weight_records')
      .select('id')
      .eq('user_id', userId)
      .eq('date', selectedDate)
      .limit(1)
      .single();

    if (existing) {
      await supabase.from('light_weight_records')
        .update({ has_bowel: checked, bowel_note: checked ? (selectedRec?.bowel_note || null) : null })
        .eq('id', existing.id);
    } else {
      await supabase.from('light_weight_records').insert({
        user_id: userId,
        date: selectedDate,
        has_bowel: checked,
      });
    }
    loadData();
  };

  const saveBowelNote = async (note: string) => {
    if (!userId || !selectedDate) return;

    const { data: existing } = await supabase
      .from('light_weight_records')
      .select('id')
      .eq('user_id', userId)
      .eq('date', selectedDate)
      .limit(1)
      .single();

    if (existing) {
      await supabase.from('light_weight_records')
        .update({ bowel_note: note || null })
        .eq('id', existing.id);
    }

    // Update bowel labels history
    const updated = [note, ...bowelLabels.filter(l => l !== note)].slice(0, 6);
    setBowelLabels(updated);
    await supabase.from('light_user_profile')
      .update({ bowel_labels: updated })
      .eq('user_id', userId);

    loadData();
  };

  const handleBowelLabelClick = (label: string) => {
    saveBowelNote(label);
    setBowelInput('');
  };

  const handleBowelInputSubmit = () => {
    if (!bowelInput.trim()) return;
    saveBowelNote(bowelInput.trim());
    setBowelInput('');
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {Array(startDow).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const rec = records[dateStr];
          const colorClass = getColorClass(dateStr);
          const isSelected = selectedDate === dateStr;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${colorClass} ${isSelected ? 'ring-2 ring-green-500' : ''}`}
            >
              <span className="font-medium">{day.getDate()}</span>
              {rec?.morning_weight && (
                <span className="text-[10px] opacity-70">{rec.morning_weight.toFixed(1)}</span>
              )}
              {rec?.is_fasting_day && (
                <span className="absolute top-0 right-0.5 text-[6px] leading-none">💧</span>
              )}
              {rec?.has_bowel && (
                <span className="absolute bottom-0.5 left-0.5 text-[6px] leading-none">💩</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      {selectedDate && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">{selectedDate}</h3>
            <button
              onClick={() => { setModalDate(selectedDate); setShowModal(true); }}
              className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg"
            >
              记录
            </button>
          </div>
          {details ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">早晨</span>
                  <span className="font-medium">{details.rec.morning_weight ? `${details.rec.morning_weight} kg` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">晚间</span>
                  <span className="font-medium">{details.rec.evening_weight ? `${details.rec.evening_weight} kg` : '-'}</span>
                </div>
              </div>
              <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">日变化</span>
                  {formatChange(details.dailyChange)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">周变化</span>
                  {formatChange(details.weeklyChange)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">月变化</span>
                  {formatChange(details.monthlyChange)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">总变化</span>
                  {formatChange(details.totalChange)}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-sm text-gray-400 py-4">
              暂无记录，点击右上角记录体重
            </div>
          )}

          {/* Bowel tracking */}
          <div className="border-t mt-3 pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedRec?.has_bowel || false}
                onChange={e => toggleBowel(e.target.checked)}
                className="w-4 h-4 accent-amber-600"
              />
              <span className="text-gray-600">排便 💩</span>
              {selectedRec?.bowel_note && (
                <span className="text-xs text-gray-400 ml-1">— {selectedRec.bowel_note}</span>
              )}
            </label>

            {selectedRec?.has_bowel && (
              <div className="mt-2 space-y-2">
                {bowelLabels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {bowelLabels.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => handleBowelLabelClick(label)}
                        className={`px-2.5 py-1 rounded-full text-xs ${
                          selectedRec.bowel_note === label
                            ? 'bg-amber-100 text-amber-700 font-medium'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    placeholder="描述（可选）"
                    value={bowelInput}
                    onChange={e => setBowelInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleBowelInputSubmit(); }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleBowelInputSubmit}
                    disabled={!bowelInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary stats */}
      {allRecords.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">统计</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">记录天数</span>
              <span className="font-medium">{allRecords.length} 天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">断食天数</span>
              <span className="font-medium">{allRecords.filter(r => r.is_fasting_day).length} 天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">最高体重</span>
              <span className="font-medium">{Math.max(...allRecords.filter(r => r.morning_weight).map(r => r.morning_weight!)).toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">最低体重</span>
              <span className="font-medium">{Math.min(...allRecords.filter(r => r.morning_weight).map(r => r.morning_weight!)).toFixed(1)} kg</span>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <WeightEntryModal
          date={modalDate}
          onClose={() => setShowModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
