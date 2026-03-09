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
      // Temporarily make the card visible for rendering
      const wrapper = cardRef.current.parentElement;
      if (wrapper) {
        wrapper.style.position = "fixed";
        wrapper.style.left = "0";
        wrapper.style.top = "0";
        wrapper.style.zIndex = "-1";
        wrapper.style.opacity = "1";
      }

      // Wait for fonts/layout to settle
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: "#1a1a2e",
        useCORS: true,
        logging: false,
        width: cardRef.current.scrollWidth,
        height: cardRef.current.scrollHeight,
      });

      // Hide it again
      if (wrapper) {
        wrapper.style.position = "fixed";
        wrapper.style.left = "-9999px";
        wrapper.style.top = "0";
        wrapper.style.zIndex = "-1";
        wrapper.style.opacity = "0";
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Falha ao gerar imagem"));
        }, "image/png");
      });

      const file = new File([blob], "meu-treino-fitforge.png", { type: "image/png" });

      // Try native share on mobile
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Meu Treino FitForge",
          text: "Confira meu plano de treino personalizado! 💪",
        });
        toast.success("Treino compartilhado!");
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meu-treino-fitforge.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Imagem do treino baixada! 📥 Envie pelo WhatsApp.");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar treino. Tente novamente.");
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
        title="Baixar imagem do treino"
      >
        {isExporting ? (
          <Share2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </Button>

      {/* Hidden card for capture */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, zIndex: -1, opacity: 0 }}>
        <ShareWorkoutCard ref={cardRef} plan={plan} profile={profile} />
      </div>
    </>
  );
};

export default ExportWorkoutButton;
