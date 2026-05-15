import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useUserRoles, useMyVendor } from "@/hooks/useUserRoles";
import { useAvailability } from "@/hooks/useAvailability";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Step { id: string; title: string; description: string; }

const ALL_VENDOR_STEPS: Step[] = [
  { id: "business", title: "Business info", description: "Your shop or business name and contact" },
  { id: "payout", title: "Bank details", description: "Where we send your sales" },
  { id: "kyc", title: "Identity (KYC)", description: "NIN / BVN to keep the marketplace safe" },
  { id: "first-listing", title: "First listing", description: "Add your first part to start selling" },
];

const ALL_TECH_STEPS: Step[] = [
  { id: "profile", title: "Profile", description: "Confirm your name and phone" },
  { id: "kyc", title: "Identity (KYC)", description: "NIN, BVN and union ID — required for verification" },
  { id: "documents", title: "Documents", description: "Driver's licence / trade ID" },
  { id: "service-area", title: "Service area", description: "Where you accept jobs" },
  { id: "availability", title: "Availability", description: "Your weekly hours" },
];

const OnboardingWizard = ({ onDone }: { onDone: () => void }) => {
  const { user } = useAuth();
  const { data: roles } = useUserRoles();
  const { data: vendor, refetch: refetchVendor } = useMyVendor();
  const { state, save } = useOnboarding();
  const { availability, update: updateAvail } = useAvailability();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const isVendor = roles?.includes("vendor");

  // Skip steps already satisfied by signup data
  const steps = useMemo<Step[]>(() => {
    if (isVendor) {
      return ALL_VENDOR_STEPS.filter((s) => {
        if (s.id === "business") return !vendor?.business_name?.trim();
        if (s.id === "payout") return !(vendor?.bank_name?.trim() && vendor?.payout_account?.trim());
        if (s.id === "kyc") return !(vendor?.bvn?.trim() && vendor?.nin?.trim() && (vendor as any)?.union_id?.trim());
        return true;
      });
    }
    return ALL_TECH_STEPS.filter((s) => {
      if (s.id === "profile") return !(profile?.full_name?.trim() && profile?.phone?.trim());
      if (s.id === "service-area") return !availability?.base_location?.trim();
      return true;
    });
  }, [isVendor, vendor, profile, availability]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (steps.length === 0 && state && !state.completed) {
      save({ step: 0, completed: true, payload: state.payload ?? {} }).then(onDone);
    }
  }, [steps.length, state, save, onDone]);

  useEffect(() => { if (state) setIdx(Math.min(state.step, Math.max(steps.length - 1, 0))); }, [state, steps.length]);

  const [form, setForm] = useState({
    full_name: "", phone: "",
    business_name: vendor?.business_name ?? "", address: vendor?.address ?? "",
    payout_account: vendor?.payout_account ?? "", bank_name: vendor?.bank_name ?? "",
    nin: "", bvn: "", union_id: "", union_name: "", licence: "",
    base_location: availability?.base_location ?? "",
  });

  useEffect(() => {
    if (vendor) setForm((f) => ({ ...f, business_name: vendor.business_name ?? "", address: vendor.address ?? "", payout_account: vendor.payout_account ?? "", bank_name: vendor.bank_name ?? "" }));
  }, [vendor]);
  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, full_name: f.full_name || profile.full_name || "", phone: f.phone || profile.phone || "" }));
  }, [profile]);
  useEffect(() => {
    if (availability) setForm((f) => ({ ...f, base_location: availability.base_location ?? "" }));
  }, [availability]);

  const persistStep = async (newIdx: number, completed = false) => {
    await save({ step: newIdx, completed, payload: { ...(state?.payload ?? {}), ...form } });
  };

  const runIdentityVerification = async () => {
    const { data, error } = await supabase.functions.invoke("verify-identity", {
      body: {
        nin: form.nin.trim(),
        bvn: form.bvn.trim(),
        union_id: form.union_id.trim(),
        union_name: form.union_name.trim(),
      },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    if ((data as any)?.mock) {
      toast("KYC saved as pending — verification API not yet configured");
    } else if ((data as any)?.status === "approved") {
      toast.success("Identity verified");
    } else {
      toast("KYC submitted — pending review");
    }
  };

  const next = async () => {
    try {
      const current = steps[idx].id;
      if (!form.phone.trim()) return toast.error("Phone number is required");
      if (isVendor) {
        if (current === "business") {
          if (!form.business_name.trim()) return toast.error("Business name required");
          await supabase.from("vendors").update({ business_name: form.business_name, address: form.address || null, phone: form.phone }).eq("user_id", user!.id);
          await refetchVendor();
        } else if (current === "payout") {
          if (!form.bank_name.trim()) return toast.error("Bank name is required");
          if (form.bank_name.trim().length < 2) return toast.error("Bank name is too short");
          if (!/^[A-Za-z\s]+$/.test(form.bank_name.trim())) return toast.error("Bank name should only contain letters");
          if (!form.payout_account.trim()) return toast.error("Account number is required");
          if (!/^\d{10}$/.test(form.payout_account.trim())) return toast.error("Account number must be exactly 10 digits");
          await supabase.from("vendors").update({ bank_name: form.bank_name.trim(), payout_account: form.payout_account.trim() }).eq("user_id", user!.id);
          await refetchVendor();
        } else if (current === "kyc") {
          if (!/^\d{11}$/.test(form.nin.trim())) return toast.error("NIN must be 11 digits");
          if (!/^\d{11}$/.test(form.bvn.trim())) return toast.error("BVN must be 11 digits");
          if (!form.union_id.trim()) return toast.error("Union / association ID is required");
          await runIdentityVerification();
          await refetchVendor();
        }
      } else {
        if (current === "profile") {
          if (!form.full_name.trim()) return toast.error("Full name required");
          await supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone }).eq("id", user!.id);
        } else if (current === "kyc") {
          if (!/^\d{11}$/.test(form.nin.trim())) return toast.error("NIN must be 11 digits");
          if (!/^\d{11}$/.test(form.bvn.trim())) return toast.error("BVN must be 11 digits");
          if (!form.union_id.trim()) return toast.error("Union / association ID is required");
          await runIdentityVerification();
        } else if (current === "documents") {
          if (!form.licence.trim()) return toast.error("Driver's licence / trade ID required");
        } else if (current === "service-area") {
          await updateAvail({ base_location: form.base_location || null });
        } else if (current === "availability") {
          // schedule already set in availability hook default
        }
      }

      const newIdx = idx + 1;
      if (newIdx >= steps.length) {
        await persistStep(steps.length - 1, true);
        toast.success("Onboarding complete");
        onDone();
      } else {
        setIdx(newIdx);
        await persistStep(newIdx);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const skip = async () => {
    await persistStep(steps.length - 1, true);
    toast("Skipped onboarding — you can finish later from Settings");
    onDone();
  };

  const step = steps[idx];
  if (!step) return <div className="p-6 text-center text-xs text-muted-foreground">Finishing setup…</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex gap-1 mb-3">
        {steps.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mb-1">Step {idx + 1} of {steps.length}</p>
      <h2 className="text-lg font-bold mb-1">{step.title}</h2>
      <p className="text-xs text-muted-foreground mb-4">{step.description}</p>

      <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
        {step.id === "business" && (
          <>
            <Field label="Business name" v={form.business_name} on={(v) => setForm({ ...form, business_name: v })} />
            <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
            <Field label="Address" v={form.address} on={(v) => setForm({ ...form, address: v })} />
          </>
        )}
        {step.id === "payout" && (
          <>
            <Field label="Bank name" v={form.bank_name} on={(v) => setForm({ ...form, bank_name: v })} placeholder="GTBank" />
            <Field label="Account number" v={form.payout_account} on={(v) => setForm({ ...form, payout_account: v })} placeholder="0123456789" />
          </>
        )}
        {step.id === "kyc" && (
          <>
            <Field label="NIN (National ID)" v={form.nin} on={(v) => setForm({ ...form, nin: v })} placeholder="11-digit NIN" />
            <Field label="BVN (Bank Verification Number)" v={form.bvn} on={(v) => setForm({ ...form, bvn: v })} placeholder="11-digit BVN" />
            <Field label="Union / association name" v={form.union_name} on={(v) => setForm({ ...form, union_name: v })} placeholder="e.g. NURTW, RTEAN, NATA" />
            <Field label="Union / association registration ID" v={form.union_id} on={(v) => setForm({ ...form, union_id: v })} placeholder="Membership / registration number" />
            <p className="text-[10px] text-muted-foreground">We verify your <b>BVN</b> with NIBSS and your <b>NIN</b> with NIMC instantly via our KYC partner. Union ID is logged for compliance.</p>
          </>
        )}
        {step.id === "first-listing" && (
          <p className="text-xs text-muted-foreground">Click finish, then add your first listing from the <b>Parts</b> tab in your portal.</p>
        )}
        {step.id === "profile" && (
          <>
            <Field label="Full name" v={form.full_name} on={(v) => setForm({ ...form, full_name: v })} />
            <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} placeholder="e.g. 0803 000 0000" />
          </>
        )}
        {step.id === "documents" && (
          <>
            <Field label="Driver's licence / trade ID #" v={form.licence} on={(v) => setForm({ ...form, licence: v })} placeholder="FRSC licence or trade certificate number" />
          </>
        )}
        {step.id === "service-area" && (
          <Field label="Base location" v={form.base_location} on={(v) => setForm({ ...form, base_location: v })} placeholder="Ikeja, Lagos" />
        )}
        {step.id === "availability" && (
          <p className="text-xs text-muted-foreground">Default hours (Mon–Sat) have been set. You can fine-tune them later under <b>My schedule</b>.</p>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {idx > 0 && (
          <button onClick={() => setIdx(idx - 1)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold">Back</button>
        )}
        <button onClick={next} className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
          {idx === steps.length - 1 ? "Finish" : "Continue"}
        </button>
      </div>
      <button onClick={skip} className="w-full mt-2 text-[11px] text-muted-foreground">Skip for now</button>
    </div>
  );
};

const Field = ({ label, v, on, placeholder }: { label: string; v: string; on: (v: string) => void; placeholder?: string }) => (
  <div>
    <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
    <input value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
  </div>
);

export default OnboardingWizard;
