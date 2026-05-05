import { supabase, getUserId } from './supabase';

export async function exportAllDataAsCSV() {
  const userId = getUserId();
  if (!userId) return;

  // Export weight records
  const { data: weights } = await supabase
    .from('light_weight_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  // Export measurement records
  const { data: measurements } = await supabase
    .from('light_measurement_records')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  // Export food log
  const { data: foodLog } = await supabase
    .from('light_food_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  const csvSections: string[] = [];

  // Weight CSV
  if (weights && weights.length > 0) {
    const header = '日期,早晨体重,晚间体重,是否断食日';
    const rows = weights.map(w =>
      `${w.date},${w.morning_weight || ''},${w.evening_weight || ''},${w.is_fasting_day ? '是' : '否'}`
    );
    csvSections.push('=== 体重记录 ===\n' + header + '\n' + rows.join('\n'));
  }

  // Measurements CSV
  if (measurements && measurements.length > 0) {
    const header = '日期,类型,数值(cm)';
    const rows = measurements.map(m =>
      `${m.date},${m.type},${m.value}`
    );
    csvSections.push('=== 围度记录 ===\n' + header + '\n' + rows.join('\n'));
  }

  // Food log CSV
  if (foodLog && foodLog.length > 0) {
    const header = '日期,餐次,时间,食物,重量(g),热量(kcal),蛋白质(g),碳水(g),脂肪(g)';
    const rows = foodLog.map(f =>
      `${f.date},${f.meal},${f.time || ''},${f.food_name},${f.weight_g},${f.calories},${f.protein},${f.carbs},${f.fat}`
    );
    csvSections.push('=== 饮食记录 ===\n' + header + '\n' + rows.join('\n'));
  }

  const content = csvSections.join('\n\n');
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `light_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
