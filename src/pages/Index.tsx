import { useState, useEffect } from "react";
import UserProfileForm from "@/components/UserProfileForm";
import WorkoutPlanView from "@/components/WorkoutPlan";
import { UserProfile, WorkoutPlan, generateWorkout } from "@/lib/workout-generator";
import { saveProfile, loadProfile, savePlan, loadPlan, clearAll } from "@/lib/storage";

type View = "form" | "plan";

const Index = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [view, setView] = useState<View>("form");

  useEffect(() => {
    const savedProfile = loadProfile();
    const savedPlan = loadPlan();
    if (savedProfile && savedPlan) {
      setProfile(savedProfile);
      setPlan(savedPlan);
      setView("plan");
    }
  }, []);

  const handleSubmit = (p: UserProfile) => {
    const newPlan = generateWorkout(p);
    setProfile(p);
    setPlan(newPlan);
    saveProfile(p);
    savePlan(newPlan);
    setView("plan");
  };

  const handleEdit = () => {
    setView("form");
  };

  const handleClear = () => {
    clearAll();
    setProfile(null);
    setPlan(null);
    setView("form");
  };

  if (view === "plan" && plan && profile) {
    return <WorkoutPlanView plan={plan} profile={profile} onEdit={handleEdit} onClear={handleClear} />;
  }

  return <UserProfileForm onSubmit={handleSubmit} initialProfile={profile || undefined} />;
};

export default Index;
