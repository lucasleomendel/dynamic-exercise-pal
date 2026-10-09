import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IdCard, Loader2, Save } from "lucide-react";
import { z } from "zod";

const isValidCPF = (cpf: string): boolean => {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
};

const formatCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const formatPhone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo").max(100),
  cpf: z.string().refine(isValidCPF, { message: "CPF inválido" }),
  phone: z.string().min(14, "Telefone inválido").max(16),
  birthDate: z.string().min(1, "Informe sua data de nascimento"),
});

/** Dados pessoais persistidos no banco, vinculados ao login do aluno. */
const PersonalDataCard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, cpf, phone, birth_date")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setName(data?.name ?? "");
      setCpf(data?.cpf ? formatCPF(data.cpf) : "");
      setPhone(data?.phone ? formatPhone(data.phone) : "");
      setBirthDate(data?.birth_date ?? "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ name, cpf, phone, birthDate });
    if (!parsed.success) {
      toast({
        title: "Verifique os dados",
        description: parsed.error.issues[0]?.message ?? "Dados inválidos",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      email: user.email,
      name: name.trim(),
      cpf: cpf.replace(/\D/g, ""),
      phone: phone.replace(/\D/g, ""),
      birth_date: birthDate,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Dados salvos", description: "Suas informações ficaram vinculadas à sua conta." });
  };

  if (!user) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <IdCard className="w-4 h-4 text-primary" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
          Dados pessoais
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando...
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="pd-name" className="text-xs">Nome completo</Label>
            <Input id="pd-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pd-cpf" className="text-xs">CPF</Label>
              <Input id="pd-cpf" inputMode="numeric" value={cpf} placeholder="000.000.000-00"
                onChange={(e) => setCpf(formatCPF(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pd-phone" className="text-xs">Telefone</Label>
              <Input id="pd-phone" inputMode="tel" value={phone} placeholder="(11) 99999-9999"
                onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pd-birth" className="text-xs">Data de nascimento</Label>
            <Input id="pd-birth" type="date" value={birthDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar dados"}
          </Button>
        </>
      )}
    </div>
  );
};

export default PersonalDataCard;
