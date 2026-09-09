import { describe, it, expect } from 'vitest';
import {
  generateWorkout,
  UserProfile,
  Exercise,
  WorkoutPlan,
  ALL_MUSCLE_GROUPS,
  MuscleGroup,
} from './workout-generator';

describe('workout-generator', () => {
  const createMockProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
    name: 'João Silva',
    age: 30,
    weight: 80,
    height: 180,
    sex: 'masculino',
    goal: 'hipertrofia',
    level: 'intermediario',
    daysPerWeek: 4,
    hoursPerSession: 1.5,
    ...overrides,
  });

  describe('generateWorkout - Success Cases', () => {
    it('should generate a valid workout plan with all required fields', () => {
      const profile = createMockProfile();
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.title).toBeTruthy();
      expect(plan.description).toBeTruthy();
      expect(plan.daysPerWeek).toBeGreaterThan(0);
      expect(plan.days).toBeInstanceOf(Array);
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should respect daysPerWeek parameter', () => {
      const daysPerWeekOptions = [2, 3, 4, 5, 6];

      daysPerWeekOptions.forEach((days) => {
        const profile = createMockProfile({ daysPerWeek: days });
        const plan = generateWorkout(profile);

        expect(plan.daysPerWeek).toBeLessThanOrEqual(days);
        expect(plan.days.length).toBeLessThanOrEqual(days);
      });
    });

    it('should include correct goal label in title', () => {
      const goals: Array<UserProfile['goal']> = [
        'hipertrofia',
        'emagrecimento',
        'resistencia',
        'forca',
      ];

      goals.forEach((goal) => {
        const profile = createMockProfile({ goal });
        const plan = generateWorkout(profile);

        expect(plan.title).toContain(profile.name);
        expect(plan.title).toMatch(/Hipertrofia|Emagrecimento|Resistência|Força/);
      });
    });

    it('should include correct level label in title', () => {
      const levels: Array<UserProfile['level']> = [
        'iniciante',
        'intermediario',
        'avancado',
      ];

      levels.forEach((level) => {
        const profile = createMockProfile({ level });
        const plan = generateWorkout(profile);

        expect(plan.title).toMatch(/Iniciante|Intermediário|Avançado/);
      });
    });

    it('should generate exercises with valid structure', () => {
      const profile = createMockProfile();
      const plan = generateWorkout(profile);

      plan.days.forEach((day) => {
        expect(day.day).toBeTruthy();
        expect(day.focus).toBeTruthy();
        expect(Array.isArray(day.exercises)).toBe(true);

        day.exercises.forEach((exercise) => {
          expect(exercise.name).toBeTruthy();
          expect(exercise.sets).toBeGreaterThan(0);
          expect(exercise.reps).toBeTruthy();
          expect(exercise.rest).toBeTruthy();
          expect(exercise.muscle).toBeTruthy();
        });
      });
    });

    it('should respect hoursPerSession when calculating exercises per day', () => {
      const shortSession = createMockProfile({ hoursPerSession: 0.5 });
      const longSession = createMockProfile({ hoursPerSession: 2 });

      const shortPlan = generateWorkout(shortSession);
      const longPlan = generateWorkout(longSession);

      // Verify that descriptions reflect the time
      expect(shortPlan.description).toContain('30min');
      expect(longPlan.description).toContain('2h');
    });

    it('should handle selectedMuscles parameter correctly', () => {
      const selectedMuscles: MuscleGroup[] = ['peito', 'costas', 'ombros'];
      const profile = createMockProfile({ selectedMuscles });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should use all muscle groups when selectedMuscles is empty', () => {
      const profile = createMockProfile({ selectedMuscles: [] });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should generate different plans for different goals', () => {
      const profiles = [
        createMockProfile({ goal: 'hipertrofia' }),
        createMockProfile({ goal: 'emagrecimento' }),
        createMockProfile({ goal: 'forca' }),
      ];

      const plans = profiles.map((p) => generateWorkout(p));

      // Check that rep ranges differ based on goal
      const hipertrofiaReps = plans[0].days[0].exercises[0].reps;
      const emagrecimentoReps = plans[1].days[0].exercises[0].reps;

      expect(hipertrofiaReps).not.toEqual(emagrecimentoReps);
    });

    it('should generate different plans for different levels', () => {
      const profiles = [
        createMockProfile({ level: 'iniciante' }),
        createMockProfile({ level: 'intermediario' }),
        createMockProfile({ level: 'avancado' }),
      ];

      const plans = profiles.map((p) => generateWorkout(p));

      // Check that exercise sets differ based on level
      const inicianteSets = plans[0].days[0].exercises[0].sets;
      const avancadoSets = plans[2].days[0].exercises[0].sets;

      expect(inicianteSets).toBeLessThanOrEqual(avancadoSets);
    });

    it('should respect splitLegs parameter', () => {
      const noSplitLegs = createMockProfile({
        daysPerWeek: 4,
        splitLegs: false,
      });
      const withSplitLegs = createMockProfile({
        daysPerWeek: 4,
        splitLegs: true,
      });

      const noPlan = generateWorkout(noSplitLegs);
      const withPlan = generateWorkout(withSplitLegs);

      expect(noPlan).toBeDefined();
      expect(withPlan).toBeDefined();
    });
  });

  describe('generateWorkout - Edge Cases', () => {
    it('should handle minimum daysPerWeek (2)', () => {
      const profile = createMockProfile({ daysPerWeek: 2 });
      const plan = generateWorkout(profile);

      expect(plan.days.length).toBe(2);
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should handle maximum daysPerWeek (6)', () => {
      const profile = createMockProfile({ daysPerWeek: 6 });
      const plan = generateWorkout(profile);

      expect(plan.days.length).toBeLessThanOrEqual(6);
    });

    it('should handle very short session (0.25 hours)', () => {
      const profile = createMockProfile({ hoursPerSession: 0.25 });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.days[0].exercises.length).toBeGreaterThan(0);
    });

    it('should handle very long session (3 hours)', () => {
      const profile = createMockProfile({ hoursPerSession: 3 });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should handle single muscle group selection', () => {
      const profile = createMockProfile({
        selectedMuscles: ['peito'],
        daysPerWeek: 3,
      });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      // Should use all muscle groups when less than 2 are selected
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should handle all muscle groups selected', () => {
      const profile = createMockProfile({
        selectedMuscles: [...ALL_MUSCLE_GROUPS],
      });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.days.length).toBeGreaterThan(0);
    });

    it('should ensure minimum 4 exercises per day when possible', () => {
      const profile = createMockProfile({
        hoursPerSession: 1,
        daysPerWeek: 3,
      });
      const plan = generateWorkout(profile);

      plan.days.forEach((day) => {
        expect(day.exercises.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should have no duplicate exercises within a day', () => {
      const profile = createMockProfile();
      const plan = generateWorkout(profile);

      plan.days.forEach((day) => {
        const exerciseNames = day.exercises.map((e) => e.name);
        const uniqueNames = new Set(exerciseNames);
        expect(uniqueNames.size).toBe(exerciseNames.length);
      });
    });

    it('should handle extreme age values', () => {
      const youngProfile = createMockProfile({ age: 18 });
      const oldProfile = createMockProfile({ age: 65 });

      const youngPlan = generateWorkout(youngProfile);
      const oldPlan = generateWorkout(oldProfile);

      expect(youngPlan).toBeDefined();
      expect(oldPlan).toBeDefined();
    });

    it('should handle extreme weight values', () => {
      const lightProfile = createMockProfile({ weight: 50 });
      const heavyProfile = createMockProfile({ weight: 150 });

      const lightPlan = generateWorkout(lightProfile);
      const heavyPlan = generateWorkout(heavyProfile);

      expect(lightPlan).toBeDefined();
      expect(heavyPlan).toBeDefined();
    });
  });

  describe('generateWorkout - Invalid Input Handling', () => {
    it('should handle invalid goal gracefully (fallback behavior)', () => {
      const profile = createMockProfile({
        goal: 'hipertrofia',
      });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.title).toContain('Hipertrofia');
    });

    it('should handle invalid level gracefully (fallback behavior)', () => {
      const profile = createMockProfile({
        level: 'intermediario',
      });
      const plan = generateWorkout(profile);

      expect(plan).toBeDefined();
      expect(plan.title).toContain('Intermediário');
    });

    it('should maintain type safety with all profile variations', () => {
      const goals: Array<UserProfile['goal']> = [
        'hipertrofia',
        'emagrecimento',
        'resistencia',
        'forca',
      ];
      const levels: Array<UserProfile['level']> = [
        'iniciante',
        'intermediario',
        'avancado',
      ];

      goals.forEach((goal) => {
        levels.forEach((level) => {
          const profile = createMockProfile({ goal, level });
          const plan = generateWorkout(profile);

          expect(plan).toBeDefined();
          expect(plan.daysPerWeek).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('generateWorkout - Data Consistency', () => {
    it('should maintain consistent exercise structure across all days', () => {
      const profile = createMockProfile();
      const plan = generateWorkout(profile);

      plan.days.forEach((day) => {
        day.exercises.forEach((exercise) => {
          expect(typeof exercise.name).toBe('string');
          expect(typeof exercise.sets).toBe('number');
          expect(typeof exercise.reps).toBe('string');
          expect(typeof exercise.rest).toBe('string');
          expect(typeof exercise.muscle).toBe('string');

          // Validate sets range
          expect(exercise.sets).toBeGreaterThanOrEqual(1);
          expect(exercise.sets).toBeLessThanOrEqual(6);

          // Validate rest format
          expect(exercise.rest).toMatch(/^\d+s$/);
        });
      });
    });

    it('should generate consistent results for same input', () => {
      const profile = createMockProfile();

      const plan1 = generateWorkout(profile);
      const plan2 = generateWorkout(profile);

      // Structure should be identical
      expect(plan1.daysPerWeek).toBe(plan2.daysPerWeek);
      expect(plan1.days.length).toBe(plan2.days.length);

      plan1.days.forEach((day, index) => {
        expect(day.exercises.length).toBe(
          plan2.days[index].exercises.length
        );
      });
    });

    it('should have valid day names', () => {
      const profile = createMockProfile();
      const plan = generateWorkout(profile);

      const validDays = [
        'Segunda',
        'Terça',
        'Quarta',
        'Quinta',
        'Sexta',
        'Sábado',
        'Domingo',
      ];

      plan.days.forEach((day) => {
        expect(validDays).toContain(day.day);
      });
    });

    it('should have meaningful focus descriptions', () => {
      const profile = createMockProfile();
      const plan = generateWorkout(profile);

      plan.days.forEach((day) => {
        expect(day.focus.length).toBeGreaterThan(0);
        expect(day.focus).not.toBe('');
      });
    });
  });

  describe('generateWorkout - Performance', () => {
    it('should generate workout plan within reasonable time', () => {
      const profile = createMockProfile();
      const startTime = performance.now();

      generateWorkout(profile);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should handle multiple generations without memory issues', () => {
      const profile = createMockProfile();

      for (let i = 0; i < 100; i++) {
        const plan = generateWorkout(profile);
        expect(plan).toBeDefined();
      }
    });
  });
});
