import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler, Calculator, AlertCircle, Check } from "lucide-react";
import { saveBodyComp, loadBodyComp } from "@/lib/storage";

interface Skinfolds {
  triceps?: number;
  subscapular?: number;
  suprailiac?: number;
  abdominal?: number;
  thigh?: number;
  chest?: number;
  axilla?: number;
}

interface BodyMeasurements {
  neck?: number;
  shoulder?: number;
  chestCirc?: number;
  waist?: number;
  hip?: number;
  armRelaxed?: number;
  armFlexed?: number;
  forearm?: number;
  thighCirc?: number;
  calf?: number;
}

interface Result {
  bodyFat: number;
  fatMass: number;
  leanMass: number;
  classification: string;
  method: string;
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
  height: number;
}

const BodyCompositionSheet = ({ sex, age, weight, height }: Props) => {
  const [skinfolds, setSkinfolds] = useState<Skinfolds>({});
  const [measurements, setMeasurements] = useState<BodyMeasurements>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const data = loadBodyComp();
    if (data) {
      setSkinfolds(data.skinfolds as Skinfolds);
      setMeasurements(data.measurements as BodyMeasurements);
      if (data.result) setResult(data.result);
    }
  }, []);

  const updateSkin = (key: keyof Skinfolds, value: string) => {
    const parsed = value === "" ? undefined : parseFloat(value);
    setSkinfolds(prev => ({ ...prev, [key]: parsed }));
    setError("");
  };

  const updateMeas = (key: keyof BodyMeasurements, value: string) => {
    const parsed = value === "" ? undefined : parseFloat(value);
    setMeasurements(prev => ({ ...prev, [key]: parsed }));
    setError("");
  };

  const getInputValue = (val: number | undefined): string => {
    return val !== undefined && val !== null ? String(val) : "";
  };

  const calculate = () => {
    setError("");
    setSaved(false);

    const { triceps, subscapular, suprailiac, abdominal, thigh, chest, axilla } = skinfolds;
    const { neck, waist, hip } = measurements;

    // Check if any data was provided
    const hasAnySkin = Object.values(skinfolds).some(v => v !== undefined && v !== null && v > 0);
    const hasAnyMeas = neck || waist || hip;

    if (!hasAnySkin && !hasAnyMeas) {
      setError("Preencha ao menos as dobras (3 ou 7) ou as medidas de pescoço + cintura para calcular.");
      return;
    }

    // Try Jackson-Pollock 7-site first
    const has7folds = triceps && subscapular && suprailiac && abdominal && thigh && chest && axilla;
    // Try 3-site
    const has3foldsMale = chest && abdominal && thigh;
    const has3foldsFemale = triceps && suprailiac && thigh;
    // Try US Navy method (circumferences)
    const hasNavyMale = neck && waist && (waist > neck);
    const hasNavyFemale = neck && waist && hip;

    let bodyFat: number | null = null;
    let method = "";

    if (has7folds) {
      const sum = triceps! + subscapular! + suprailiac! + abdominal! + thigh! + chest! + axilla!;
      let density: number;
      if (sex === 'masculino') {
        density = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * age);
      } else {
        density = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * age);
      }
      bodyFat = parseFloat(((495 / density) - 450).toFixed(1));
      method = "Jackson-Pollock 7 dobras";
    } else if (sex === 'masculino' && has3foldsMale) {
      const sum = chest! + abdominal! + thigh!;
      const density = 1.10938 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age);
      bodyFat = parseFloat(((495 / density) - 450).toFixed(1));
      method = "Jackson-Pollock 3 dobras";
    } else if (sex === 'feminino' && has3foldsFemale) {
      const sum = triceps! + suprailiac! + thigh!;
      const density = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age);
      bodyFat = parseFloat(((495 / density) - 450).toFixed(1));
      method = "Jackson-Pollock 3 dobras";
    } else if (sex === 'masculino' && hasNavyMale) {
      const heightCm = height;
      bodyFat = parseFloat((86.010 * Math.log10(waist! - neck!) - 70.041 * Math.log10(heightCm) + 36.76).toFixed(1));
      method = "US Navy (circunferências)";
    } else if (sex === 'feminino' && hasNavyFemale) {
      const heightCm = height;
      bodyFat = parseFloat((163.205 * Math.log10(waist! + hip! - neck!) - 97.684 * Math.log10(heightCm) - 78.387).toFixed(1));
      method = "US Navy (circunferências)";
    }

    if (bodyFat === null) {
      if (sex === 'masculino') {
        setError("Para masculino, preencha: Peitoral + Abdominal + Coxa (dobras) ou Pescoço + Cintura (medidas).");
      } else {
        setError("Para feminino, preencha: Tríceps + Suprailíaca + Coxa (dobras) ou Pescoço + Cintura + Quadril (medidas).");
      }
      return;
    }

    if (isNaN(bodyFat) || bodyFat < 2 || bodyFat > 60) {
      setError("Resultado fora do intervalo válido. Verifique os valores inseridos.");
      return;
    }

    const fatMass = parseFloat((weight * bodyFat / 100).toFixed(1));
    const leanMass = parseFloat((weight - fatMass).toFixed(1));
    const classification = sex === 'masculino' ? classifyMale(bodyFat, age) : classifyFemale(bodyFat, age);

    const newResult = { bodyFat, fatMass, leanMass, classification, method };
    setResult(newResult);

    // Save to localStorage
    saveBodyComp({
      skinfolds: skinfolds as Record<string, number | undefined>,
      measurements: measurements as Record<string, number | undefined>,
      result: newResult,
      date: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const skinfoldFields: { key: keyof Skinfolds; label: string }[] = [
    { key: 'chest', label: 'Peitoral (mm)' },
    { key: 'axilla', label: 'Axilar Média (mm)' },
    { key: 'triceps', label: 'Tríceps (mm)' },
    { key: 'subscapular', label: 'Subescapular (mm)' },
    { key: 'suprailiac', label: 'Suprailíaca (mm)' },
    { key: 'abdominal', label: 'Abdominal (mm)' },
    { key: 'thigh', label: 'Coxa (mm)' },
  ];

  const measurementFields: { key: keyof BodyMeasurements; label: string }[] = [
    { key: 'neck', label: 'Pescoço (cm)' },
    { key: 'shoulder', label: 'Ombro (cm)' },
    { key: 'chestCirc', label: 'Peitoral (cm)' },
    { key: 'waist', label: 'Cintura (cm)' },
    { key: 'hip', label: 'Quadril (cm)' },
    { key: 'armRelaxed', label: 'Braço relaxado (cm)' },
    { key: 'armFlexed', label: 'Braço contraído (cm)' },
    { key: 'forearm', label: 'Antebraço (cm)' },
    { key: 'thighCirc', label: 'Coxa (cm)' },
    { key: 'calf', label: 'Panturrilha (cm)' },
  ];

  const classColor = result ? (
    result.classification === 'Excelente' ? 'text-primary' :
    result.classification === 'Bom' ? 'text-primary/80' :
    result.classification === 'Acima da média' ? 'text-yellow-400' :
    result.classification === 'Ruim' ? 'text-orange-400' : 'text-destructive'
  ) : '';

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

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
          <Tabs defaultValue="skinfolds" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="skinfolds" className="flex-1 text-xs">Dobras</TabsTrigger>
              <TabsTrigger value="measurements" className="flex-1 text-xs">Medidas</TabsTrigger>
            </TabsList>

            <TabsContent value="skinfolds" className="space-y-3 mt-4">
              <p className="text-xs text-muted-foreground">
                Dobras cutâneas em milímetros. Preencha 7 para máxima precisão, ou 3 para cálculo simplificado
                {sex === 'masculino' ? ' (Peitoral, Abdominal, Coxa)' : ' (Tríceps, Suprailíaca, Coxa)'}.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {skinfoldFields.map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={getInputValue(skinfolds[f.key])}
                      onChange={e => updateSkin(f.key, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="measurements" className="space-y-3 mt-4">
              <p className="text-xs text-muted-foreground">
                Circunferências em centímetros. Com pescoço + cintura{sex === 'feminino' ? ' + quadril' : ''} calcula pelo método US Navy.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {measurementFields.map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={getInputValue(measurements[f.key])}
                      onChange={e => updateMeas(f.key, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={calculate}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]"
          >
            {saved ? <Check className="w-4 h-4" /> : <Calculator className="w-4 h-4" />}
            {saved ? "Salvo!" : "Calcular e Salvar"}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Todos os campos são opcionais. O sistema usa o melhor método disponível com os dados fornecidos.
          </p>

          {result && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="rounded-xl bg-secondary/50 p-4 text-center">
                <span className="text-xs text-muted-foreground block mb-1">% de Gordura</span>
                <span className="text-3xl font-bold text-foreground">{result.bodyFat}%</span>
                <span className={`text-sm font-semibold block mt-1 ${classColor}`}>
                  {result.classification}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  Método: {result.method}
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

              {/* Show filled skinfolds summary */}
              {Object.values(skinfolds).some(v => v !== undefined && v > 0) && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <span className="text-xs text-muted-foreground block mb-2">Dobras registradas</span>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {skinfoldFields.filter(f => skinfolds[f.key] !== undefined && skinfolds[f.key]! > 0).map(f => (
                      <div key={f.key} className="flex justify-between">
                        <span className="text-muted-foreground">{f.label.replace(' (mm)', '')}</span>
                        <span className="text-foreground font-medium">{skinfolds[f.key]} mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show filled measurements summary */}
              {Object.values(measurements).some(v => v !== undefined && v > 0) && (
                <div className="rounded-xl bg-secondary/50 p-3">
                  <span className="text-xs text-muted-foreground block mb-2">Medidas registradas</span>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {measurementFields.filter(f => measurements[f.key] !== undefined && measurements[f.key]! > 0).map(f => (
                      <div key={f.key} className="flex justify-between">
                        <span className="text-muted-foreground">{f.label.replace(' (cm)', '')}</span>
                        <span className="text-foreground font-medium">{measurements[f.key]} cm</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BodyCompositionSheet;
