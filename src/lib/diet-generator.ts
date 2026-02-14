export interface DietProfile {
  goal: 'hipertrofia' | 'emagrecimento' | 'resistencia' | 'forca';
  weight: number;
  height: number;
  age: number;
  sex: 'masculino' | 'feminino';
  activityLevel: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
  mealsPerDay: number;
  restrictions: string[];
  preferences: string[];
  dislikes: string[];
}

export interface Meal {
  name: string;
  time: string;
  foods: { item: string; portion: string; calories: number; protein: number; carbs: number; fat: number }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DietPlan {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
  tips: string[];
}

function calculateTDEE(profile: DietProfile): number {
  // Mifflin-St Jeor
  let bmr: number;
  if (profile.sex === 'masculino') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const multipliers: Record<string, number> = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9,
  };

  return Math.round(bmr * (multipliers[profile.activityLevel] || 1.55));
}

function getMacroSplit(goal: string): { proteinPct: number; carbsPct: number; fatPct: number } {
  switch (goal) {
    case 'hipertrofia': return { proteinPct: 0.30, carbsPct: 0.45, fatPct: 0.25 };
    case 'emagrecimento': return { proteinPct: 0.35, carbsPct: 0.35, fatPct: 0.30 };
    case 'resistencia': return { proteinPct: 0.20, carbsPct: 0.55, fatPct: 0.25 };
    case 'forca': return { proteinPct: 0.30, carbsPct: 0.40, fatPct: 0.30 };
    default: return { proteinPct: 0.25, carbsPct: 0.45, fatPct: 0.30 };
  }
}

function getCalorieAdjustment(goal: string): number {
  switch (goal) {
    case 'hipertrofia': return 300;
    case 'emagrecimento': return -500;
    case 'forca': return 200;
    default: return 0;
  }
}

interface FoodItem {
  item: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
}

const foodDatabase: Record<string, FoodItem[]> = {
  proteinas: [
    { item: 'Peito de frango grelhado', portion: '150g', calories: 248, protein: 46, carbs: 0, fat: 5, tags: [] },
    { item: 'Ovos mexidos', portion: '3 unidades', calories: 231, protein: 18, carbs: 2, fat: 16, tags: ['vegetariano'] },
    { item: 'Patinho moído', portion: '150g', calories: 270, protein: 40, carbs: 0, fat: 11, tags: [] },
    { item: 'Tilápia grelhada', portion: '150g', calories: 162, protein: 34, carbs: 0, fat: 3, tags: ['peixe'] },
    { item: 'Whey Protein', portion: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1, tags: ['suplemento'] },
    { item: 'Iogurte grego natural', portion: '170g', calories: 150, protein: 15, carbs: 8, fat: 7, tags: ['vegetariano', 'laticinio'] },
    { item: 'Tofu grelhado', portion: '150g', calories: 144, protein: 16, carbs: 4, fat: 8, tags: ['vegano', 'vegetariano'] },
    { item: 'Atum em água', portion: '1 lata (120g)', calories: 132, protein: 30, carbs: 0, fat: 1, tags: ['peixe'] },
    { item: 'Cottage', portion: '100g', calories: 98, protein: 11, carbs: 3, fat: 4, tags: ['vegetariano', 'laticinio'] },
    { item: 'Salmão grelhado', portion: '120g', calories: 250, protein: 30, carbs: 0, fat: 14, tags: ['peixe'] },
  ],
  carboidratos: [
    { item: 'Arroz integral', portion: '150g cozido', calories: 166, protein: 4, carbs: 34, fat: 1, tags: ['vegano'] },
    { item: 'Batata doce', portion: '200g', calories: 172, protein: 3, carbs: 40, fat: 0, tags: ['vegano'] },
    { item: 'Aveia', portion: '40g', calories: 152, protein: 5, carbs: 27, fat: 3, tags: ['vegano'] },
    { item: 'Pão integral', portion: '2 fatias', calories: 140, protein: 6, carbs: 24, fat: 2, tags: ['vegetariano'] },
    { item: 'Macarrão integral', portion: '100g cozido', calories: 124, protein: 5, carbs: 25, fat: 1, tags: ['vegetariano'] },
    { item: 'Banana', portion: '1 unidade', calories: 105, protein: 1, carbs: 27, fat: 0, tags: ['vegano', 'fruta'] },
    { item: 'Mandioca cozida', portion: '100g', calories: 125, protein: 1, carbs: 30, fat: 0, tags: ['vegano'] },
    { item: 'Tapioca', portion: '2 unidades', calories: 140, protein: 0, carbs: 34, fat: 0, tags: ['vegano', 'sem glúten'] },
  ],
  gorduras: [
    { item: 'Abacate', portion: '½ unidade', calories: 160, protein: 2, carbs: 8, fat: 15, tags: ['vegano'] },
    { item: 'Castanhas mistas', portion: '30g', calories: 185, protein: 5, carbs: 7, fat: 16, tags: ['vegano'] },
    { item: 'Azeite de oliva', portion: '1 colher sopa', calories: 119, protein: 0, carbs: 0, fat: 14, tags: ['vegano'] },
    { item: 'Pasta de amendoim', portion: '1 colher sopa', calories: 94, protein: 4, carbs: 3, fat: 8, tags: ['vegano'] },
    { item: 'Queijo minas', portion: '30g', calories: 80, protein: 6, carbs: 1, fat: 6, tags: ['vegetariano', 'laticinio'] },
  ],
  vegetais: [
    { item: 'Brócolis cozido', portion: '100g', calories: 35, protein: 3, carbs: 7, fat: 0, tags: ['vegano'] },
    { item: 'Salada verde mista', portion: '100g', calories: 20, protein: 2, carbs: 3, fat: 0, tags: ['vegano'] },
    { item: 'Espinafre refogado', portion: '100g', calories: 23, protein: 3, carbs: 4, fat: 0, tags: ['vegano'] },
    { item: 'Legumes grelhados', portion: '150g', calories: 55, protein: 2, carbs: 10, fat: 1, tags: ['vegano'] },
  ],
};

function filterByRestrictions(foods: FoodItem[], restrictions: string[], dislikes: string[]): FoodItem[] {
  return foods.filter(f => {
    for (const d of dislikes) {
      if (f.item.toLowerCase().includes(d.toLowerCase())) return false;
    }
    if (restrictions.includes('vegano') && !f.tags.includes('vegano')) return false;
    if (restrictions.includes('vegetariano') && !f.tags.includes('vegano') && !f.tags.includes('vegetariano')) return false;
    if (restrictions.includes('sem_lactose') && f.tags.includes('laticinio')) return false;
    if (restrictions.includes('sem_gluten') && !f.tags.includes('sem glúten') && (f.item.toLowerCase().includes('pão') || f.item.toLowerCase().includes('macarrão') || f.item.toLowerCase().includes('aveia'))) return false;
    return true;
  });
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

const mealTimes: Record<number, { name: string; time: string }[]> = {
  3: [
    { name: 'Café da Manhã', time: '07:00' },
    { name: 'Almoço', time: '12:00' },
    { name: 'Jantar', time: '19:00' },
  ],
  4: [
    { name: 'Café da Manhã', time: '07:00' },
    { name: 'Almoço', time: '12:00' },
    { name: 'Lanche da Tarde', time: '16:00' },
    { name: 'Jantar', time: '19:30' },
  ],
  5: [
    { name: 'Café da Manhã', time: '07:00' },
    { name: 'Lanche da Manhã', time: '10:00' },
    { name: 'Almoço', time: '12:30' },
    { name: 'Lanche da Tarde', time: '16:00' },
    { name: 'Jantar', time: '19:30' },
  ],
  6: [
    { name: 'Café da Manhã', time: '06:30' },
    { name: 'Lanche da Manhã', time: '09:30' },
    { name: 'Almoço', time: '12:00' },
    { name: 'Lanche da Tarde', time: '15:30' },
    { name: 'Jantar', time: '19:00' },
    { name: 'Ceia', time: '21:30' },
  ],
};

export function generateDietPlan(profile: DietProfile): DietPlan {
  const tdee = calculateTDEE(profile);
  const adjustment = getCalorieAdjustment(profile.goal);
  const targetCalories = tdee + adjustment;
  const { proteinPct, carbsPct, fatPct } = getMacroSplit(profile.goal);

  const totalProtein = Math.round((targetCalories * proteinPct) / 4);
  const totalCarbs = Math.round((targetCalories * carbsPct) / 4);
  const totalFat = Math.round((targetCalories * fatPct) / 9);

  const mealsCount = Math.min(Math.max(profile.mealsPerDay, 3), 6);
  const mealSlots = mealTimes[mealsCount] || mealTimes[4];

  const filteredProteins = filterByRestrictions(foodDatabase.proteinas, profile.restrictions, profile.dislikes);
  const filteredCarbs = filterByRestrictions(foodDatabase.carboidratos, profile.restrictions, profile.dislikes);
  const filteredFats = filterByRestrictions(foodDatabase.gorduras, profile.restrictions, profile.dislikes);
  const filteredVeggies = filterByRestrictions(foodDatabase.vegetais, profile.restrictions, profile.dislikes);

  const caloriesPerMeal = Math.round(targetCalories / mealsCount);

  const meals: Meal[] = mealSlots.map((slot, idx) => {
    const isMain = slot.name === 'Almoço' || slot.name === 'Jantar';
    const isBreakfast = slot.name === 'Café da Manhã';
    const isSnack = !isMain && !isBreakfast;

    const foods: FoodItem[] = [];

    if (isMain) {
      foods.push(...pickRandom(filteredProteins, 1));
      foods.push(...pickRandom(filteredCarbs, 1));
      foods.push(...pickRandom(filteredVeggies, 1));
      foods.push(...pickRandom(filteredFats, 1));
    } else if (isBreakfast) {
      foods.push(...pickRandom(filteredProteins, 1));
      foods.push(...pickRandom(filteredCarbs, 1));
      foods.push(...pickRandom(filteredFats, 1));
    } else {
      // Snack
      foods.push(...pickRandom(filteredProteins, 1));
      foods.push(...pickRandom(filteredCarbs.concat(filteredFats), 1));
    }

    const totalCal = foods.reduce((s, f) => s + f.calories, 0);
    const totalP = foods.reduce((s, f) => s + f.protein, 0);
    const totalC = foods.reduce((s, f) => s + f.carbs, 0);
    const totalF = foods.reduce((s, f) => s + f.fat, 0);

    return {
      name: slot.name,
      time: slot.time,
      foods: foods.map(f => ({
        item: f.item,
        portion: f.portion,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
      })),
      totalCalories: totalCal,
      totalProtein: totalP,
      totalCarbs: totalC,
      totalFat: totalF,
    };
  });

  const goalTips: Record<string, string[]> = {
    hipertrofia: [
      'Priorize proteína em todas as refeições (2g/kg de peso corporal)',
      'Consuma carboidratos complexos pré e pós-treino',
      'Mantenha o superávit calórico moderado para ganho limpo',
      'Hidrate-se com pelo menos 3L de água por dia',
    ],
    emagrecimento: [
      'Mantenha o déficit calórico sem cortar refeições',
      'Aumente a ingestão de fibras para saciedade',
      'Priorize proteínas para preservar massa magra',
      'Evite alimentos ultraprocessados e açúcares refinados',
    ],
    resistencia: [
      'Carboidratos são seu principal combustível',
      'Alimente-se 2h antes do treino e logo após',
      'Inclua fontes de eletrólitos na alimentação',
      'Mantenha refeições leves e frequentes',
    ],
    forca: [
      'Consuma pelo menos 2g de proteína por kg de peso',
      'Inclua creatina 5g/dia (consulte um profissional)',
      'Carboidratos pré-treino são fundamentais',
      'Gorduras boas ajudam na produção hormonal',
    ],
  };

  return {
    totalCalories: targetCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    meals,
    tips: goalTips[profile.goal] || goalTips.hipertrofia,
  };
}
