import { describe, expect, it } from "vitest";
import { generateWorkout, validateUserProfile, type UserProfile } from "./workout-generator";

const baseProfile: UserProfile = {
  name: "Teste FitForge",
  age: 26,
  weight: 79,
  height: 170,
  sex: "masculino",
  goal: "hipertrofia",
  level: "intermediario",
  daysPerWeek: 4,
  hoursPerSession: 1,
  selectedMuscles: ["peito", "costas"],
  splitLegs: false,
};

describe("workout generator", () => {
  it("respects the selected muscle groups", () => {
    const plan = generateWorkout(baseProfile);
    expect(plan.days).toHaveLength(4);

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(["Peito", "Costas"]).toContain(exercise.muscle);
      }
    }
  });

  it("keeps the requested number of training days even with restricted selections", () => {
    const plan = generateWorkout({
      ...baseProfile,
      daysPerWeek: 6,
      selectedMuscles: ["biceps", "triceps"],
    });

    expect(plan.days).toHaveLength(6);
    expect(plan.daysPerWeek).toBe(6);

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(["Bíceps", "Tríceps"]).toContain(exercise.muscle);
      }
    }
  });

  it("does not introduce legs when splitLegs is enabled without selecting legs", () => {
    const plan = generateWorkout({
      ...baseProfile,
      daysPerWeek: 5,
      splitLegs: true,
      selectedMuscles: ["peito", "costas", "ombros"],
    });

    for (const day of plan.days) {
      for (const exercise of day.exercises) {
        expect(["Peito", "Costas", "Ombros", "Trapézio"]).toContain(exercise.muscle);
      }
    }
  });


  it("changes prescription according to the training goal", () => {
    const strength = generateWorkout({
      ...baseProfile,
      goal: "forca",
      selectedMuscles: ["peito", "costas"],
    });
    const hypertrophy = generateWorkout({
      ...baseProfile,
      goal: "hipertrofia",
      selectedMuscles: ["peito", "costas"],
    });

    const strengthExercises = strength.days.flatMap(day => day.exercises);
    const hypertrophyExercises = hypertrophy.days.flatMap(day => day.exercises);

    expect(strengthExercises.length).toBeGreaterThan(0);
    expect(hypertrophyExercises.length).toBeGreaterThan(0);
    expect(strengthExercises.every(ex => ["3-6", "6-10"].includes(ex.reps))).toBe(true);
    expect(strengthExercises.some(ex => ex.reps === "3-6")).toBe(true);
    expect(strengthExercises.some(ex => ex.rest === "180s")).toBe(true);
    expect(hypertrophyExercises.some(ex => ex.reps === "10-15")).toBe(true);
    expect(hypertrophyExercises.some(ex => ex.rest === "60s")).toBe(true);
  });

  it("scales volume and exercise count by training level", () => {
    const beginner = generateWorkout({
      ...baseProfile,
      level: "iniciante",
      selectedMuscles: ["peito", "costas"],
    });
    const advanced = generateWorkout({
      ...baseProfile,
      level: "avancado",
      selectedMuscles: ["peito", "costas"],
    });

    const beginnerSets = beginner.days.flatMap(day => day.exercises).reduce((sum, ex) => sum + ex.sets, 0);
    const advancedSets = advanced.days.flatMap(day => day.exercises).reduce((sum, ex) => sum + ex.sets, 0);

    expect(beginnerSets).toBeLessThanOrEqual(advancedSets);
    expect(beginner.days.every(day => day.exercises.length >= 1 && day.exercises.length <= 8)).toBe(true);
  });

  it("keeps short sessions from accumulating excessive exercise volume", () => {
    const plan = generateWorkout({
      ...baseProfile,
      hoursPerSession: 0.5,
      selectedMuscles: ["peito", "costas"],
    });

    expect(plan.days).toHaveLength(4);
    expect(plan.days.every(day => day.exercises.length >= 1 && day.exercises.length <= 8)).toBe(true);
  });

  it("excludes exercises incompatible with declared physical restrictions", () => {
    const plan = generateWorkout({
      ...baseProfile,
      selectedMuscles: ["peito", "ombros"],
      injuries: ["ombro"],
    });
    const names = plan.days.flatMap(day => day.exercises.map(ex => ex.name));

    expect(names.every(name =>
      !["Desenvolvimento com Halteres", "Desenvolvimento Arnold", "Desenvolvimento Militar com Barra", "Elevação Lateral"].some(blocked => name.includes(blocked))
    )).toBe(true);
  });

  it("persists and validates an empty restriction list as a safe default", () => {
    const plan = generateWorkout({
      ...baseProfile,
      injuries: [],
    });

    expect(plan.days).toHaveLength(4);
    expect(plan.days.flatMap(day => day.exercises).length).toBeGreaterThan(0);
  });

  it("rejects invalid profile values before generation", () => {
    const errors = validateUserProfile({
      ...baseProfile,
      weight: 0,
      height: 300,
      daysPerWeek: 1,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
