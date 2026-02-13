import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Ruler, Calculator } from "lucide-react";

interface Measurements {
  triceps?: number;
  subscapular?: number;
  suprailiac?: number;
  abdominal?: number;
  thigh?: number;
  chest?: number;
  axilla?: number;
}

interface Result {
  bodyFat: number;
  fatMass: number;
  leanMass: number;
  classification: string;
}

const classifyMale = (bf: number, age: number): string => {
  if (age <= 29) {
    if (bf < 11) return "Excelente";
    if (bf < 16) return "Bom";
    if (bf < 21) return "Acima da média";
    if (bf < 26) return "Ruim";
    return "Muito ruim";
  }
  if (age <= 39) {
    if (bf < 13) return "Excelente";
    if (bf < 18) return "Bom";
    if (bf < 22) return "Acima da média";
    if (bf < 27) return "Ruim";
    return "Muito ruim";
  }
  if (bf < 15) return "Excelente";
  if (bf < 20) return "Bom";
  if (bf < 24) return "Acima da média";
  if (bf < 29) return "Ruim";
  return "Muito ruim";
};

const classifyFemale = (bf: number, age: number): string => {
  if (age <= 29) {
    if (bf < 16) return "Excelente";
    if (bf < 20) return "Bom";
    if (bf < 24) return "Acima da média";
    if (bf < 29) return "Ruim";
    return "Muito ruim";
  }
  if (age <= 39) {
    if (bf < 18) return "Excelente";
    if (bf < 22) return "Bom";
    if (bf < 26) return "Acima da média";
    if (bf < 31) return "Ruim";
    return "Muito ruim";
  }
  if (bf < 20) return "Excelente";
  if (bf < 24) return "Bom";
  if (bf < 28) return "Acima da média";
  if (bf < 33) return "Ruim";
  return "Muito ruim";
};

interface Props {
  sex: 'masculino' | 'feminino';
  age: number;
  weight: number;
}

const BodyCompositionSheet = ({ sex, age, weight }: Props) => {
  const [measurements, setMeasurements] = useState<Measurements>({});
  const [result, setResult] = useState<Result | null>(null);

  const update = (key: keyof Measurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [key]: value ? parseFloat(value) : undefined }));
  };

  // Jackson-Pollock 7-site formula
  const calculate = () => {
    const { triceps, subscapular, suprailiac, abdominal, thigh, chest, axilla } = measurements;
    if (!triceps || !subscapular || !suprailiac || !abdominal || !thigh || !chest || !axilla) return;

    const sum = triceps + subscapular + suprailiac + abdominal + thigh + chest + axilla;

    let density: number;
    if (sex === 'masculino') {
      density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age);
    } else {
      density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age);
    }

    const bodyFat = parseFloat(((495 / density) - 450).toFixed(1));
    const fatMass = parseFloat((weight * bodyFat / 100).toFixed(1));
    const leanMass = parseFloat((weight - fatMass).toFixed(1));
    const classification = sex === 'masculino' ? classifyMale(bodyFat, age) : classifyFemale(bodyFat, age);

    setResult({ bodyFat, fatMass, leanMass, classification });
  };

  const fields: { key: keyof Measurements; label: string }[] = [
    { key: 'chest', label: 'Peitoral (mm)' },
    { key: 'axilla', label: 'Axilar Média (mm)' },
    { key: 'triceps', label: 'Tríceps (mm)' },
    { key: 'subscapular', label: 'Subescapular (mm)' },
    { key: 'suprailiac', label: 'Suprailíaca (mm)' },
    { key: 'abdominal', label: 'Abdominal (mm)' },
    { key: 'thigh', label: 'Coxa (mm)' },
  ];

  const classColor = result ? (
    result.classification === 'Excelente' ? 'text-primary' :
    result.classification === 'Bom' ? 'text-primary/80' :
    result.classification === 'Acima da média' ? 'text-yellow-400' :
    result.classification === 'Ruim' ? 'text-orange-400' : 'text-destructive'
  ) : '';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors">
          <Ruler className="w-4 h-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Composição Corporal
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <p className="text-xs text-muted-foreground">
            Protocolo Jackson-Pollock 7 dobras. Preencha as dobras cutâneas em milímetros (opcional).
          </p>

          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <input
                  type="number"
                  placeholder="0"
                  value={measurements[f.key] || ""}
                  onChange={e => update(f.key, e.target.value)}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>
            ))}
          </div>

          <button
            onClick={calculate}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
          >
            <Calculator className="w-4 h-4" />
            Calcular
          </button>

          {result && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <span className="text-xs text-muted-foreground block mb-1">% de Gordura</span>
                <span className="text-3xl font-bold text-foreground">{result.bodyFat}%</span>
                <span className={`text-sm font-semibold block mt-1 ${classColor}`}>
                  {result.classification}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <span className="text-xs text-muted-foreground block mb-1">Massa Gorda</span>
                  <span className="font-bold text-foreground">{result.fatMass} kg</span>
                </div>
                <div className="rounded-xl bg-secondary/50 p-3 text-center">
                  <span className="text-xs text-muted-foreground block mb-1">Massa Magra</span>
                  <span className="font-bold text-foreground">{result.leanMass} kg</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BodyCompositionSheet;
