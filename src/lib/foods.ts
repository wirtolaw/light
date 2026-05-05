export interface FoodItem {
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

export const builtInFoods: FoodItem[] = [
  // 蔬菜类
  { name: '西兰花', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 6.6, fat_per_100g: 0.4 },
  { name: '菠菜', calories_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4 },
  { name: '番茄', calories_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2 },
  { name: '黄瓜', calories_per_100g: 15, protein_per_100g: 0.7, carbs_per_100g: 2.9, fat_per_100g: 0.1 },
  { name: '胡萝卜', calories_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 9.6, fat_per_100g: 0.2 },
  { name: '白菜', calories_per_100g: 13, protein_per_100g: 1.5, carbs_per_100g: 2.2, fat_per_100g: 0.1 },
  { name: '生菜', calories_per_100g: 15, protein_per_100g: 1.4, carbs_per_100g: 2.9, fat_per_100g: 0.2 },
  { name: '芹菜', calories_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3.0, fat_per_100g: 0.2 },
  { name: '茄子', calories_per_100g: 25, protein_per_100g: 1.0, carbs_per_100g: 5.9, fat_per_100g: 0.1 },
  { name: '冬瓜', calories_per_100g: 12, protein_per_100g: 0.4, carbs_per_100g: 2.6, fat_per_100g: 0.2 },
  { name: '豆芽', calories_per_100g: 31, protein_per_100g: 3.1, carbs_per_100g: 5.9, fat_per_100g: 0.2 },
  { name: '蘑菇', calories_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3 },

  // 水果类
  { name: '苹果', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 13.8, fat_per_100g: 0.2 },
  { name: '香蕉', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 22.8, fat_per_100g: 0.3 },
  { name: '橙子', calories_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 11.8, fat_per_100g: 0.1 },
  { name: '葡萄', calories_per_100g: 69, protein_per_100g: 0.7, carbs_per_100g: 18.1, fat_per_100g: 0.2 },
  { name: '草莓', calories_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3 },
  { name: '西瓜', calories_per_100g: 30, protein_per_100g: 0.6, carbs_per_100g: 7.6, fat_per_100g: 0.2 },
  { name: '猕猴桃', calories_per_100g: 61, protein_per_100g: 1.1, carbs_per_100g: 14.7, fat_per_100g: 0.5 },
  { name: '梨', calories_per_100g: 57, protein_per_100g: 0.4, carbs_per_100g: 15.2, fat_per_100g: 0.1 },

  // 肉类
  { name: '鸡胸肉', calories_per_100g: 165, protein_per_100g: 31.0, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { name: '鸡腿肉', calories_per_100g: 209, protein_per_100g: 26.0, carbs_per_100g: 0, fat_per_100g: 10.9 },
  { name: '猪瘦肉', calories_per_100g: 143, protein_per_100g: 20.3, carbs_per_100g: 0, fat_per_100g: 6.2 },
  { name: '猪五花肉', calories_per_100g: 518, protein_per_100g: 9.5, carbs_per_100g: 0, fat_per_100g: 53.0 },
  { name: '牛肉(瘦)', calories_per_100g: 250, protein_per_100g: 26.0, carbs_per_100g: 0, fat_per_100g: 15.0 },
  { name: '牛腱子', calories_per_100g: 106, protein_per_100g: 20.2, carbs_per_100g: 0.5, fat_per_100g: 2.3 },
  { name: '羊肉', calories_per_100g: 258, protein_per_100g: 25.6, carbs_per_100g: 0, fat_per_100g: 16.5 },
  { name: '三文鱼', calories_per_100g: 208, protein_per_100g: 20.4, carbs_per_100g: 0, fat_per_100g: 13.4 },
  { name: '虾仁', calories_per_100g: 99, protein_per_100g: 24.0, carbs_per_100g: 0.2, fat_per_100g: 0.3 },
  { name: '鲈鱼', calories_per_100g: 97, protein_per_100g: 18.6, carbs_per_100g: 0, fat_per_100g: 2.0 },
  { name: '鸭肉', calories_per_100g: 240, protein_per_100g: 15.5, carbs_per_100g: 0, fat_per_100g: 19.7 },

  // 蛋奶类
  { name: '鸡蛋(全)', calories_per_100g: 155, protein_per_100g: 12.6, carbs_per_100g: 1.1, fat_per_100g: 10.6 },
  { name: '鸡蛋白', calories_per_100g: 52, protein_per_100g: 11.0, carbs_per_100g: 0.7, fat_per_100g: 0.2 },
  { name: '牛奶(全脂)', calories_per_100g: 61, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.3 },
  { name: '酸奶(无糖)', calories_per_100g: 59, protein_per_100g: 3.5, carbs_per_100g: 4.7, fat_per_100g: 3.3 },
  { name: '豆腐', calories_per_100g: 76, protein_per_100g: 8.1, carbs_per_100g: 1.9, fat_per_100g: 4.2 },
  { name: '豆浆(无糖)', calories_per_100g: 33, protein_per_100g: 2.9, carbs_per_100g: 1.8, fat_per_100g: 1.6 },

  // 主食/谷物类
  { name: '米饭(熟)', calories_per_100g: 116, protein_per_100g: 2.6, carbs_per_100g: 25.6, fat_per_100g: 0.3 },
  { name: '面条(熟)', calories_per_100g: 138, protein_per_100g: 4.5, carbs_per_100g: 25.1, fat_per_100g: 2.1 },
  { name: '馒头', calories_per_100g: 236, protein_per_100g: 7.0, carbs_per_100g: 47.0, fat_per_100g: 1.1 },
  { name: '全麦面包', calories_per_100g: 247, protein_per_100g: 13.0, carbs_per_100g: 41.0, fat_per_100g: 3.4 },
  { name: '燕麦片', calories_per_100g: 389, protein_per_100g: 16.9, carbs_per_100g: 66.3, fat_per_100g: 6.9 },
  { name: '红薯', calories_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20.1, fat_per_100g: 0.1 },
  { name: '玉米', calories_per_100g: 86, protein_per_100g: 3.3, carbs_per_100g: 19.0, fat_per_100g: 1.2 },
  { name: '土豆', calories_per_100g: 77, protein_per_100g: 2.0, carbs_per_100g: 17.5, fat_per_100g: 0.1 },
  { name: '糙米饭(熟)', calories_per_100g: 111, protein_per_100g: 2.6, carbs_per_100g: 23.0, fat_per_100g: 0.9 },

  // 油脂/调料类
  { name: '橄榄油', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { name: '花生油', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100 },
  { name: '花生', calories_per_100g: 567, protein_per_100g: 25.8, carbs_per_100g: 16.1, fat_per_100g: 49.2 },
  { name: '核桃', calories_per_100g: 654, protein_per_100g: 15.2, carbs_per_100g: 13.7, fat_per_100g: 65.2 },
  { name: '杏仁', calories_per_100g: 579, protein_per_100g: 21.2, carbs_per_100g: 21.7, fat_per_100g: 49.9 },
  { name: '芝麻', calories_per_100g: 573, protein_per_100g: 17.7, carbs_per_100g: 23.5, fat_per_100g: 49.7 },
  { name: '牛油果', calories_per_100g: 160, protein_per_100g: 2.0, carbs_per_100g: 8.5, fat_per_100g: 14.7 },
];
