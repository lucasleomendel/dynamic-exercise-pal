import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const STORAGE_KEY = "fitforge_complete_profile_dismissed";

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
  cpf: z.string().refine(isValidCPF, { message: "CPF inválido" }),
  birthDate: z.string().min(1, "Informe sua data de nascimento"),
  phone: z.string().min(14, "Telefone inválido").max(16),
});

const CompleteProfileDialog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("cpf, birth_date, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const dismissed = localStorage.getItem(`${STORAGE_KEY}_${user.id}`) === "1";
      const incomplete = !data?.cpf || !data?.birth_date || !data?.phone;
      if (incomplete && !dismissed) setOpen(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ cpf, birthDate, phone });
    if (!parsed.success) {
      toast({
        title: "Verifique os dados",
        description: parsed.error.issues[0]?.message ?? "Dados inválidos",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        cpf: cpf.replace(/\D/g, ""),
        birth_date: birthDate,
        phone: phone.replace(/\D/g, ""),
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Perfil completo!", description: "Suas informações foram salvas." });
    setOpen(false);
  };

  const handleSkip = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete seu perfil</DialogTitle>
          <DialogDescription>
            Precisamos de algumas informações adicionais para personalizar sua experiência.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" inputMode="numeric" placeholder="000.000.000-00" value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">Data de nascimento</Label>
            <Input id="birthDate" type="date" value={birthDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" inputMode="tel" placeholder="(11) 99999-9999" value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))} />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={saving}>Depois</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteProfileDialog;
