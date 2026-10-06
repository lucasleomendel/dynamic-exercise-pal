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
