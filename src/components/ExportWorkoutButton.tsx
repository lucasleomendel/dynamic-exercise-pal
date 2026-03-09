import { useState, useRef, useCallback } from "react";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutPlan, UserProfile } from "@/lib/workout-generator";
import ShareWorkoutCard from "./ShareWorkoutCard";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface Props {
  plan: WorkoutPlan;
  profile: UserProfile;
}

const ExportWorkoutButton = ({ plan, profile }: Props) => {
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Falha ao gerar imagem"));
        }, "image/png");
      });

      const file = new File([blob], "meu-treino-fitforge.png", { type: "image/png" });

      // Try Web Share API (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Meu Treino FitForge",
          text: "Confira meu plano de treino personalizado! 💪",
        });
        toast.success("Treino compartilhado!");
      } else {
        // Fallback: download + open WhatsApp
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meu-treino-fitforge.png";
        a.click();
        URL.revokeObjectURL(url);

        // Open WhatsApp with message
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          "Confira meu plano de treino personalizado! 💪 Gerado pelo FitForge"
        )}`;
        window.open(whatsappUrl, "_blank");

        toast.success("Imagem baixada! Anexe no WhatsApp.");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar treino");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExport}
        disabled={isExporting}
        className="h-9 w-9"
        title="Compartilhar treino"
      >
        <Share2 className={`w-4 h-4 ${isExporting ? "animate-pulse" : ""}`} />
      </Button>

      {/* Hidden card for capture */}
      <div className="fixed -left-[9999px] top-0">
        <ShareWorkoutCard ref={cardRef} plan={plan} profile={profile} />
      </div>
    </>
  );
};

export default ExportWorkoutButton;
