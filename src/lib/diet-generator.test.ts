import { describe, expect, it } from 'vitest';
import { generateDietPlan, type DietProfile } from './diet-generator';

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

  it('warns when restrictions and dislikes leave a required food category empty', () => {
    const plan = generateDietPlan({
      ...baseProfile,
      restrictions: ['vegetariano'],
      dislikes: ['ovos', 'tofu', 'iogurte', 'cottage', 'whey'],
    });

    expect(plan.meals.some(meal => meal.foods.length < 3)).toBe(true);
    expect(plan.tips.some(tip => tip.includes('fonte de proteína compatível'))).toBe(true);
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
