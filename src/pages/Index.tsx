import { useState, useEffect } from "react";
import UserProfileForm from "@/components/UserProfileForm";
import WorkoutPlanView from "@/components/WorkoutPlan";
import LoadingScreen from "@/components/LoadingScreen";
import { UserProfile, WorkoutPlan, generateWorkout } from "@/lib/workout-generator";
import { saveProfile, loadProfile, savePlan, loadPlan, clearAll } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type View = "form" | "plan";

const Index = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [view, setView] = useState<View>("form");
  // Logged-in users with an empty local cache wait briefly for the cloud copy
  // instead of seeing the first-time setup form.
  const [waitingCloud, setWaitingCloud] = useState(() => Boolean(user) && !(loadProfile() && loadPlan()));
  const { toast } = useToast();

  useEffect(() => {
    const readLocal = () => {
      const savedProfile = loadProfile();
      const savedPlan = loadPlan();
      if (savedProfile && savedPlan) {
        setProfile(savedProfile);
        setPlan(savedPlan);
        setView("plan");
        return true;
      }
      if (savedProfile) setProfile(savedProfile);
      return false;
    };
    readLocal();
    const onHydrated = () => { readLocal(); setWaitingCloud(false); };
    const giveUp = setTimeout(() => setWaitingCloud(false), 5000);
    const onPlanUpdated = (e: Event) => {
      const next = (e as CustomEvent).detail as WorkoutPlan;
      if (next?.days) {
        setPlan(next);
        savePlan(next);
        setView("plan");
      }
    };
    window.addEventListener("fitforge:plan-updated", onPlanUpdated);
    window.addEventListener("fitforge:hydrated", onHydrated);
    return () => {
      clearTimeout(giveUp);
      window.removeEventListener("fitforge:plan-updated", onPlanUpdated);
      window.removeEventListener("fitforge:hydrated", onHydrated);
    };
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
      const results = await Promise.allSettled([
        supabase.from("profiles").delete().eq("user_id", user.id),
        supabase.from("workout_plans").delete().eq("user_id", user.id),
        supabase.from("exercise_checks").delete().eq("user_id", user.id),
        supabase.from("weight_logs").delete().eq("user_id", user.id),
        supabase.from("workout_history").delete().eq("user_id", user.id),
        supabase.from("body_compositions").delete().eq("user_id", user.id),
        supabase.from("water_logs").delete().eq("user_id", user.id),
        supabase.from("diet_plans").delete().eq("user_id", user.id),
        supabase.from("progression_log").delete().eq("user_id", user.id),
      ]);
      const failures = results.filter((result) =>
        result.status === "rejected" || Boolean(result.value?.error)
      );
      if (failures.length > 0) {
        toast({
          title: "Dados locais limpos, mas a nuvem não foi totalmente limpa",
          description: "Alguns registros não puderam ser removidos. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
    }
  };

  if (waitingCloud && view !== "plan") return <LoadingScreen />;

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
