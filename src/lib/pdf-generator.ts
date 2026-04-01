import jsPDF from "jspdf";
import { WorkoutPlan, UserProfile } from "./workout-generator";

export async function generateWorkoutPDF(plan: WorkoutPlan, profile: UserProfile) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const orange = [237, 137, 36] as [number, number, number];
  const dark = [26, 26, 46] as [number, number, number];
  const gray = [120, 120, 140] as [number, number, number];
  const white = [255, 255, 255] as [number, number, number];
  const lightBg = [240, 240, 245] as [number, number, number];

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageH - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // === HEADER ===
  doc.setFillColor(...dark);
  doc.rect(0, 0, pageW, 45, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...orange);
  doc.text("FitForge", margin, 20);

  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text("Seu treino personalizado", margin, 28);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 200);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, margin, 36);

  y = 55;

  // === TITLE ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.text(plan.title, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  const descLines = doc.splitTextToSize(plan.description, contentW);
  doc.text(descLines, margin, y);
  y += descLines.length * 5 + 6;

  // === PROFILE STATS ===
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
  const stats = [
    { label: "Nome", value: profile.name },
    { label: "Idade", value: `${profile.age} anos` },
    { label: "Peso", value: `${profile.weight} kg` },
    { label: "Altura", value: `${profile.height} cm` },
    { label: "IMC", value: bmi },
    { label: "Dias/sem", value: `${plan.daysPerWeek}x` },
    { label: "Sessão", value: profile.hoursPerSession < 1 ? `${Math.round(profile.hoursPerSession * 60)} min` : `${profile.hoursPerSession}h` },
    { label: "Nível", value: profile.level.charAt(0).toUpperCase() + profile.level.slice(1) },
    { label: "Objetivo", value: profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1) },
  ];

  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");
  y += 5;

  const colW = contentW / 5;
  stats.forEach((stat, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const x = margin + col * colW + colW / 2;
    const sy = y + row * 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...orange);
    doc.text(stat.value, x, sy, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(stat.label, x, sy + 4, { align: "center" });
  });

  y += 32;

  // === WORKOUT DAYS ===
  plan.days.forEach((day, dayIdx) => {
    // Check space for header + at least 2 exercises
    checkPageBreak(40);

    // Day header
    doc.setFillColor(...orange);
    doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...white);
    doc.text(`${day.day} — ${day.focus}`, margin + 4, y + 7);
    doc.setFontSize(8);
    doc.text(`${day.exercises.length} exercícios`, pageW - margin - 4, y + 7, { align: "right" });
    y += 14;

    // Table header
    doc.setFillColor(230, 230, 235);
    doc.rect(margin, y, contentW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...dark);

    const cols = [margin + 3, margin + 8, margin + 75, margin + 110, margin + 135, margin + 155];
    doc.text("#", cols[0], y + 5);
    doc.text("Exercício", cols[1], y + 5);
    doc.text("Músculo", cols[2], y + 5);
    doc.text("Séries x Reps", cols[3], y + 5);
    doc.text("Descanso", cols[4], y + 5);
    doc.text("Carga", cols[5], y + 5);
    y += 9;

    // Exercises
    day.exercises.forEach((ex, exIdx) => {
      checkPageBreak(8);

      if (exIdx % 2 === 0) {
        doc.setFillColor(248, 248, 250);
        doc.rect(margin, y - 1, contentW, 7, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...dark);

      doc.text(String(exIdx + 1).padStart(2, "0"), cols[0], y + 4);

      const nameLines = doc.splitTextToSize(ex.name, 62);
      doc.setFont("helvetica", "bold");
      doc.text(nameLines[0], cols[1], y + 4);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      doc.text(ex.muscle, cols[2], y + 4);

      doc.setTextColor(...dark);
      doc.text(`${ex.sets} x ${ex.reps}`, cols[3], y + 4);
      doc.text(ex.rest, cols[4], y + 4);

      doc.setTextColor(...gray);
      doc.text("_____ kg", cols[5], y + 4);

      y += nameLines.length > 1 ? 10 : 7;
    });

    y += 6;
  });

  // === FOOTER ===
  checkPageBreak(25);
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("⚠️ Este treino é uma sugestão gerada automaticamente. Consulte um profissional de Educação Física.", margin, y);
  y += 5;
  doc.text("Gerado por FitForge — Seu treino personalizado", margin, y);

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 8, { align: "right" });
    doc.text("FitForge", margin, pageH - 8);
  }

  doc.save(`treino-fitforge-${profile.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
