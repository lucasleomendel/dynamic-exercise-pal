import { useState, useEffect } from "react";
import UserProfileForm from "@/components/UserProfileForm";
import WorkoutPlanView from "@/components/WorkoutPlan";
import { UserProfile, WorkoutPlan, generateWorkout } from "@/lib/workout-generator";
import { saveProfile, loadProfile, savePlan, loadPlan, clearAll } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

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
    const onPlanUpdated = (e: Event) => {
      const next = (e as CustomEvent).detail as WorkoutPlan;
      if (next?.days) {
        setPlan(next);
        savePlan(next);
        setView("plan");
      }
    };
    window.addEventListener("fitforge:plan-updated", onPlanUpdated);
    return () => window.removeEventListener("fitforge:plan-updated", onPlanUpdated);
  }, []);

  const handleSubmit = (p: UserProfile) => {
    const newPlan = generateWorkout(p);
    setProfile(p);
    setPlan(newPlan);
    saveProfile(p);
    savePlan(newPlan);
    setView("plan");
    // saveProfile/savePlan já fazem sync em background
  };

  const handleEdit = () => {
    setView("form");
  };

  const handleClear = async () => {
    clearAll();
    setProfile(null);
    setPlan(null);
    setView("form");
    // Limpa também no banco
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await Promise.allSettled([
        supabase.from("workout_plans").delete().eq("user_id", user.id),
        supabase.from("exercise_checks").delete().eq("user_id", user.id),
        supabase.from("weight_logs").delete().eq("user_id", user.id),
        supabase.from("workout_history").delete().eq("user_id", user.id),
        supabase.from("body_compositions").delete().eq("user_id", user.id),
      ]);
    }
  };

  if (view === "plan" && plan && profile) {
    return (
      <WorkoutPlanView
        plan={plan}
        profile={profile}
        onEdit={handleEdit}
        onClear={handleClear}
        onPlanUpdate={(updatedPlan) => {
          setPlan(updatedPlan);
          savePlan(updatedPlan);
        }}
      />
    );
  }

  return <UserProfileForm onSubmit={handleSubmit} initialProfile={profile || undefined} />;
};

export default Index;
