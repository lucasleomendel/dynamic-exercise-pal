import { useState } from "react";
import UserProfileForm from "@/components/UserProfileForm";
import WorkoutPlanView from "@/components/WorkoutPlan";
import { UserProfile, WorkoutPlan, generateWorkout } from "@/lib/workout-generator";

const Index = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);

  const handleSubmit = (p: UserProfile) => {
    setProfile(p);
    setPlan(generateWorkout(p));
  };

  const handleReset = () => {
    setProfile(null);
    setPlan(null);
  };

  if (plan && profile) {
    return <WorkoutPlanView plan={plan} profile={profile} onReset={handleReset} />;
  }

  return <UserProfileForm onSubmit={handleSubmit} />;
};

export default Index;
