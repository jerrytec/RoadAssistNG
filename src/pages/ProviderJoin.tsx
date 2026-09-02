import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2, CheckCircle2, Clock, XCircle, Truck, Disc3, Wrench, PackageOpen, type LucideIcon,
} from "lucide-react";
import PageNav from "@/components/PageNav";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { useMyProviderApplication, type ApplicationDraft } from "@/hooks/useProviderApplication";

const TYPES: { value: string; label: string; Icon: LucideIcon; hint: string }[] = [
  { value: "Tow van", label: "Tow van", Icon: Truck, hint: "Recovery and towing" },
  { value: "Vulcanizer", label: "Vulcanizer", Icon: Disc3, hint: "Tyre repairs" },
  { value: "Mobile mechanic", label: "Mobile mechanic", Icon: Wrench, hint: "I come to the car" },
  { value: "Workshop mechanic", label: "Workshop mechanic", Icon: Wrench, hint: "Customers come to me" },
  { value: "Parts seller", label: "Parts seller", Icon: PackageOpen, hint: "I sell spare parts" },
];

const emptyForm = {
  name: "",
  type: "Mobile mechanic",
  location: "",
  operator: "",
  phone: "",
  plate: "",
  shop_type: "",
  services: "",
  specializations: "",
  base_fee: "",
  per_km: "",
  capacity_tonnes: "",
};

const naira = (kobo: number | null) => (kobo == null ? "—" : `₦${(kobo / 100).toLocaleString()}`);

const ProviderJoin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { application, loading, submit, submitting } = useMyProviderApplication();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!application) return;
    setForm({
      name: application.name ?? "",
      type: application.type ?? "Mobile mechanic",
      location: application.location ?? "",
      operator: application.operator ?? "",
      phone: application.phone ?? "",
      plate: application.plate ?? "",
      shop_type: application.shop_type ?? "",
      services: (application.services ?? []).join(", "),
      specializations: (application.specializations ?? []).join(", "),
      base_fee: application.base_fee_kobo ? String(application.base_fee_kobo / 100) : "",
      per_km: application.per_km_kobo ? String(application.per_km_kobo / 100) : "",
      capacity_tonnes: application.capacity_tonnes ? String(application.capacity_tonnes) : "",
    });
  }, [application]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isTow = form.type === "Tow van";
  const listed = application?.status === "approved";
  const pending = application?.status === "pending";

  const save = async () => {
    if (form.name.trim().length < 2) return toast.error("Enter your business or shop name");
    if (!form.location.trim()) return toast.error("Enter the area you operate in");
    if (form.phone.trim().length < 7) return toast.error("Enter a contact phone number");

    const toKobo = (v: string) => {
      const n = Number(v.replace(/[^\d.]/g, ""));
      return v.trim() && Number.isFinite(n) ? Math.round(n * 100) : null;
    };
    const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

    const draft: ApplicationDraft = {
      name: form.name.trim(),
      type: form.type,
      location: form.location.trim(),
      operator: form.operator.trim() || null,
      phone: form.phone.trim(),
      plate: isTow ? form.plate.trim() || null : null,
      shop_type: form.shop_type.trim() || null,
      services: list(form.services),
      specializations: list(form.specializations),
      base_fee_kobo: toKobo(form.base_fee),
      per_km_kobo: toKobo(form.per_km),
      capacity_tonnes: form.capacity_tonnes.trim() ? Number(form.capacity_tonnes) : null,
    };

    try {
      await submit(draft);
      setEditing(false);
      toast.success(application ? "Application updated — still under review" : "Application submitted for review");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit your application");
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background">
        <PageNav />
        <section className="max-w-md mx-auto px-4 pt-20 text-center space-y-3">
          <h1 className="text-xl font-bold">Join as a provider</h1>
          <p className="text-sm text-muted-foreground">Create an account or sign in first, then submit your directory listing.</p>
          <button onClick={() => navigate("/")} className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Go to sign in
          </button>
        </section>
      </main>
    );
  }

  const showForm = !application || editing || application.status === "rejected";

  return (
    <main className="min-h-screen bg-background pb-16">
      <PageNav />
      <header className="px-4 pt-16 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <BrandLogo className="w-7 h-7 rounded-md" />
          <span className="text-sm font-bold">RoadAssist<span className="text-primary">NG</span></span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Join the provider directory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tow vans, vulcanizers, mechanics and spare parts sellers can list themselves. Our team reviews every
          application before it goes live to customers.
        </p>
      </header>

      <section className="max-w-2xl mx-auto px-4 space-y-4">
        {application && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <div className="flex items-start gap-3">
              {listed ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                : pending ? <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                : <XCircle className="w-5 h-5 text-destructive mt-0.5" />}
              <div className="flex-1">
                <h2 className="text-sm font-semibold">
                  {listed ? "You're live in the directory" : pending ? "Application under review" : "Application not approved"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {listed
                    ? "Customers can now find you when they search for help nearby."
                    : pending
                      ? "Reviews usually complete within 24 hours. You can still edit your details."
                      : application.review_notes || "Update your details and submit again."}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[11px]">
                  <div><dt className="text-muted-foreground">Listing name</dt><dd className="font-medium">{application.name}</dd></div>
                  <div><dt className="text-muted-foreground">Service</dt><dd className="font-medium">{application.type}</dd></div>
                  <div><dt className="text-muted-foreground">Area</dt><dd className="font-medium">{application.location ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Call-out fee</dt><dd className="font-medium">{naira(application.base_fee_kobo)}</dd></div>
                </dl>
                {!showForm && (
                  <button onClick={() => setEditing(true)} className="mt-3 h-9 px-4 rounded-lg border border-border text-xs font-semibold hover:bg-muted">
                    Edit my listing
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">What do you do?</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TYPES.map((t) => {
                  const active = form.type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("type", t.value)}
                      aria-pressed={active}
                      className={`p-3 rounded-lg border text-left transition-all ${active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:bg-muted"}`}
                    >
                      <t.Icon className="w-4 h-4 mb-1 text-primary" />
                      <span className="block text-xs font-semibold">{t.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{t.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Business / shop name" v={form.name} on={(v) => set("name", v)} placeholder="Sunrise Auto Works" />
              <Field label="Contact person" v={form.operator} on={(v) => set("operator", v)} placeholder="Emeka Okafor" />
              <Field label="Phone number" v={form.phone} on={(v) => set("phone", v)} placeholder="0803 000 0000" />
              <Field label="Area you cover" v={form.location} on={(v) => set("location", v)} placeholder="Ikeja, Lagos" />
              {isTow && <Field label="Vehicle plate" v={form.plate} on={(v) => set("plate", v)} placeholder="LAG-234-XY" />}
              {isTow && <Field label="Towing capacity (tonnes)" v={form.capacity_tonnes} on={(v) => set("capacity_tonnes", v)} placeholder="3.5" />}
              <Field label="Setup type" v={form.shop_type} on={(v) => set("shop_type", v)} placeholder="Mobile / fixed shop" />
              <Field label="Call-out fee (₦)" v={form.base_fee} on={(v) => set("base_fee", v)} placeholder="5000" />
              <Field label="Per km charge (₦)" v={form.per_km} on={(v) => set("per_km", v)} placeholder="350" />
            </div>

            <Field label="Services offered (comma separated)" v={form.services} on={(v) => set("services", v)} placeholder="Battery jump start, Engine diagnostics" />
            <Field label="Specializations (comma separated)" v={form.specializations} on={(v) => set("specializations", v)} placeholder="Toyota, Lexus, Diesel engines" />

            <p className="text-[11px] text-muted-foreground">
              After approval you'll complete identity checks (NIN, BVN and union ID) so customers see a verified badge.
            </p>

            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={submitting}
                className="flex-[2] h-11 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {application ? "Save changes" : "Submit application"}
              </button>
              {application && (
                <button onClick={() => setEditing(false)} className="flex-1 h-11 rounded-lg border border-border text-sm font-semibold hover:bg-muted">
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

const Field = ({ label, v, on, placeholder }: { label: string; v: string; on: (v: string) => void; placeholder?: string }) => (
  <label className="block">
    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    <input
      value={v}
      onChange={(e) => on(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full h-11 px-4 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  </label>
);

export default ProviderJoin;
