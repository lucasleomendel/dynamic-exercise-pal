import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutPlan, UserProfile } from "@/lib/workout-generator";
import { toast } from "sonner";
import { generateWorkoutPDF } from "@/lib/pdf-generator";

interface Props {
  plan: WorkoutPlan;
  profile: UserProfile;
}

const ExportWorkoutButton = ({ plan, profile }: Props) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generateWorkoutPDF(plan, profile);
      toast.success("PDF do treino baixado com sucesso! 📥");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleExport}
      disabled={isExporting}
      className="h-9 w-9"
      title="Baixar PDF do treino"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
    </Button>
  );
};

export default ExportWorkoutButton;
