import { useState, useEffect } from "react";
import UserProfileForm from "@/components/UserProfileForm";
import WorkoutPlanView from "@/components/WorkoutPlan";
import Lobby from "@/components/Lobby";
import { UserProfile, WorkoutPlan, generateWorkout } from "@/lib/workout-generator";
import { saveProfile, loadProfile, savePlan, loadPlan, clearAll } from "@/lib/storage";

type View = "form" | "lobby" | "plan";

const Index = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [view, setView] = useState<View>("form");

  // Load saved data on mount
  useEffect(() => {
    const savedProfile = loadProfile();
    const savedPlan = loadPlan();
    if (savedProfile && savedPlan) {
      setProfile(savedProfile);
      setPlan(savedPlan);
      setView("lobby");
    }
  }, []);

  const handleSubmit = (p: UserProfile) => {
    const newPlan = generateWorkout(p);
    setProfile(p);
    setPlan(newPlan);
    saveProfile(p);
    savePlan(newPlan);
    setView("lobby");
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

  const handleViewPlan = () => {
    setView("plan");
  };

  const handleBackToLobby = () => {
    setView("lobby");
  };

  if (view === "plan" && plan && profile) {
    return <WorkoutPlanView plan={plan} profile={profile} onReset={handleBackToLobby} />;
  }

  if (view === "lobby" && profile && plan) {
    return (
      <Lobby
        profile={profile}
        plan={plan}
        onEdit={handleEdit}
        onViewPlan={handleViewPlan}
        onClear={handleClear}
      />
    );
  }

  return <UserProfileForm onSubmit={handleSubmit} initialProfile={profile || undefined} />;
};

export default Index;
