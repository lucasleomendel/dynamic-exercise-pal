import { describe, expect, it } from 'vitest';
import { generateDietPlan, validateDietProfile, type DietProfile } from './diet-generator';

const baseProfile: DietProfile = {
  goal: 'hipertrofia',
  weight: 79,
  height: 170,
  age: 26,
  sex: 'masculino',
  activityLevel: 'moderado',
  mealsPerDay: 4,
  restrictions: [],
  preferences: [],
  dislikes: [],
};

describe('diet profile validation', () => {
  it('rejects invalid body measurements, age, activity level and meal count', () => {
    const errors = validateDietProfile({
      ...baseProfile,
      weight: 0,
      height: 300,
      age: 0,
      activityLevel: 'invalid' as DietProfile['activityLevel'],
      mealsPerDay: 0,
    });

    expect(errors).toContain('Peso deve estar entre 25 e 350 kg.');
    expect(errors).toContain('Altura deve estar entre 120 e 230 cm.');
    expect(errors).toContain('Idade deve estar entre 13 e 100 anos.');
    expect(errors).toContain('Nível de atividade inválido.');
    expect(errors).toContain('Número de refeições deve ser um inteiro entre 1 e 6.');
  });

  it('prevents generating nutrition targets from an invalid profile', () => {
    expect(() => generateDietPlan({ ...baseProfile, weight: Number.NaN })).toThrow('Peso deve estar entre 25 e 350 kg.');
  });
});

describe('generateDietPlan', () => {
  it('returns daily totals equal to the sum of its meals and foods', () => {
    const plan = generateDietPlan(baseProfile);

    expect(plan.meals).toHaveLength(4);
    expect(plan.totalCalories).toBe(plan.meals.reduce((sum, meal) => sum + meal.totalCalories, 0));
    expect(plan.totalProtein).toBe(plan.meals.reduce((sum, meal) => sum + meal.totalProtein, 0));
    expect(plan.totalCarbs).toBe(plan.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0));
    expect(plan.totalFat).toBe(plan.meals.reduce((sum, meal) => sum + meal.totalFat, 0));

    for (const meal of plan.meals) {
      expect(meal.totalCalories).toBe(meal.foods.reduce((sum, food) => sum + food.calories, 0));
      expect(meal.totalProtein).toBe(meal.foods.reduce((sum, food) => sum + food.protein, 0));
      expect(meal.totalCarbs).toBe(meal.foods.reduce((sum, food) => sum + food.carbs, 0));
      expect(meal.totalFat).toBe(meal.foods.reduce((sum, food) => sum + food.fat, 0));
    }
  });

  it('keeps estimated targets separate from the actual selected-food totals', () => {
    const plan = generateDietPlan(baseProfile);

    expect(plan.targetCalories).toBeGreaterThan(0);
    expect(plan.targetProtein).toBeGreaterThan(0);
    expect(plan.targetCarbs).toBeGreaterThan(0);
    expect(plan.targetFat).toBeGreaterThan(0);
    expect(Number.isFinite(plan.totalCalories)).toBe(true);
  });

  it('limits the plan to the supported meal-count range', () => {
    expect(generateDietPlan({ ...baseProfile, mealsPerDay: 1 }).meals).toHaveLength(3);
    expect(generateDietPlan({ ...baseProfile, mealsPerDay: 8 }).meals).toHaveLength(6);
  });

  it('does not select explicitly disliked foods', () => {
    const plan = generateDietPlan({ ...baseProfile, dislikes: ['frango', 'banana'] });
    const names = plan.meals.flatMap(meal => meal.foods.map(food => food.item.toLocaleLowerCase()));

    expect(names.some(name => name.includes('frango'))).toBe(false);
    expect(names.some(name => name.includes('banana'))).toBe(false);
  });

  it('excludes generic whey when lactose-free restriction is active because lactose status is unknown', () => {
    const plan = generateDietPlan({ ...baseProfile, restrictions: ['sem_lactose'] });
    const names = plan.meals.flatMap(meal => meal.foods.map(food => food.item));

    expect(names).not.toContain('Whey Protein');
    expect(names).not.toContain('Iogurte grego natural');
    expect(names).not.toContain('Cottage');
    expect(names).not.toContain('Queijo minas');
  });

  it('warns when preferences have no match in one or more food groups and fallback foods are used', () => {
    const plan = generateDietPlan({ ...baseProfile, preferences: ['frango'] });

    expect(plan.tips.some(tip => tip.includes('preferências alimentares') && tip.includes('outras opções compatíveis'))).toBe(true);
    expect(plan.meals.every(meal => meal.foods.length > 0)).toBe(true);
  });

  it('warns when restrictions and dislikes leave a required food category empty', () => {
    const plan = generateDietPlan({
      ...baseProfile,
      restrictions: ['vegetariano'],
      dislikes: ['ovos', 'tofu', 'iogurte', 'cottage', 'whey'],
    });

    expect(plan.meals.filter(meal => meal.name === 'Almoço').every(meal => meal.foods.length < 4)).toBe(true);
    expect(plan.tips.some(tip => tip.includes('fonte de proteína compatível'))).toBe(true);
  });

  it('warns that gluten and lactose filters do not guarantee allergen safety', () => {
    const glutenPlan = generateDietPlan({ ...baseProfile, restrictions: ['sem_gluten'] });
    const lactosePlan = generateDietPlan({ ...baseProfile, restrictions: ['sem_lactose'] });

    expect(glutenPlan.tips.some(tip => tip.includes('não garantem ausência de alérgenos'))).toBe(true);
    expect(lactosePlan.tips.some(tip => tip.includes('não garantem ausência de alérgenos'))).toBe(true);
  });

  it('does not show allergen-specific caution when no related restriction is selected', () => {
    const plan = generateDietPlan(baseProfile);

    expect(plan.tips.some(tip => tip.includes('não garantem ausência de alérgenos'))).toBe(false);
  });

  it('selects only vegan-tagged foods when vegan restriction is active', () => {
    const plan = generateDietPlan({ ...baseProfile, restrictions: ['vegano'] });
    const names = plan.meals.flatMap(meal => meal.foods.map(food => food.item));

    expect(names).not.toContain('Peito de frango grelhado');
    expect(names).not.toContain('Ovos mexidos');
    expect(names).not.toContain('Iogurte grego natural');
    expect(names).not.toContain('Whey Protein');
  });
});
