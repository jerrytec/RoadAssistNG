import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyVendor, useUserRoles } from "@/hooks/useUserRoles";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import ProviderDashboard from "@/components/screens/ProviderDashboard";

type Tab = "overview" | "parts" | "orders" | "settings";

const TECH_ROLE_LABEL: Record<string, string> = {
  tow_operator: "Tow Van Operator",
  vulcanizer: "Vulcanizer",
  mechanic: "Mechanic",
};

const VendorPortal = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { data: roles } = useUserRoles();
  const { data: vendor, isLoading: vLoading, refetch } = useMyVendor();
  const [tab, setTab] = useState<Tab>("overview");

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) { navigate("/"); return null; }

  const isVendor = roles?.includes("vendor");
  const techRole = roles?.find((r) => ["tow_operator", "vulcanizer", "mechanic"].includes(r));

  // Technician portal (tow / vulcanizer / mechanic)
  if (techRole && !isVendor) {
    return (
      <Wrap>
        <header className="px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <div>
            <button onClick={() => navigate("/")} className="text-[11px] text-muted-foreground">← Back to app</button>
            <h1 className="text-sm font-bold">{TECH_ROLE_LABEL[techRole]} portal</h1>
            <span className="text-[10px] font-semibold text-primary">✓ Active</span>
          </div>
          <button onClick={() => signOut().then(() => { sessionStorage.removeItem("portal-redirected"); navigate("/"); })} className="text-[11px] text-muted-foreground">Log out</button>
        </header>
        <ProviderDashboard />
      </Wrap>
    );
  }

  if (!vLoading && !vendor && isVendor === false) {
    return (
      <Wrap>
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">🧰</div>
          <h2 className="text-base font-semibold mb-1">Become a parts seller</h2>
          <p className="text-xs text-muted-foreground mb-4">Apply to list spare parts on RoadAssistNG.</p>
          <ApplyVendorForm onDone={() => refetch()} />
        </div>
      </Wrap>
    );
  }

  if (vLoading || !vendor) return <Wrap><div className="p-10 text-center text-sm text-muted-foreground">Loading vendor profile…</div></Wrap>;

  return (
    <Wrap>
      <header className="px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <div>
          <button onClick={() => navigate("/")} className="text-[11px] text-muted-foreground">← Back to app</button>
          <h1 className="text-sm font-bold">{vendor.business_name}</h1>
          <span className={`text-[10px] font-semibold ${vendor.status === "verified" ? "text-primary" : "text-amber-600"}`}>
            {vendor.status === "verified" ? "✓ Verified vendor" : "⏳ Pending verification"}
          </span>
        </div>
        <button onClick={() => signOut().then(() => { sessionStorage.removeItem("portal-redirected"); navigate("/"); })} className="text-[11px] text-muted-foreground">Log out</button>
      </header>

      <nav className="flex border-b border-border bg-background sticky top-[57px] z-10">
        {(["overview", "parts", "orders", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[12px] font-semibold capitalize ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="p-4">
        {tab === "overview" && <Overview vendorId={vendor.id} />}
        {tab === "parts" && <PartsManager vendorId={vendor.id} />}
        {tab === "orders" && <OrdersInbox vendorId={vendor.id} />}
        {tab === "settings" && <SettingsTab vendor={vendor} onSaved={() => refetch()} />}
      </main>
    </Wrap>
  );
};

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-[700px] mx-auto min-h-screen bg-background">{children}</div>
);

/* ============ Apply ============ */
const ApplyVendorForm = ({ onDone }: { onDone: () => void }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ business_name: "", phone: "", address: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.business_name.trim()) return toast.error("Business name required");
    setBusy(true);
    const { error } = await supabase.from("vendors").insert({
      user_id: user!.id,
      business_name: form.business_name.trim(),
      phone: form.phone || null,
      address: form.address || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Vendor application submitted");
    onDone();
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
      <input placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary" />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary" />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary" />
      <button disabled={busy} onClick={submit} className="py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60">
        {busy ? "Submitting…" : "Apply as vendor"}
      </button>
    </div>
  );
};

/* ============ Overview ============ */
const Overview = ({ vendorId }: { vendorId: string }) => {
  const { data } = useQuery({
    queryKey: ["vendor-overview", vendorId],
    queryFn: async () => {
      const [parts, orderItems] = await Promise.all([
        supabase.from("parts").select("id, status, stock", { count: "exact" }).eq("vendor_id", vendorId),
        supabase.from("parts_order_items").select("unit_price_kobo, qty, vendor_status").eq("vendor_id", vendorId),
      ]);
      const active = parts.data?.filter((p) => p.status === "active").length ?? 0;
      const lowStock = parts.data?.filter((p) => p.stock < 5).length ?? 0;
      const pending = orderItems.data?.filter((o) => ["paid", "accepted", "packed", "shipped"].includes(o.vendor_status)).length ?? 0;
      const revenue = (orderItems.data ?? [])
        .filter((o) => ["delivered", "completed"].includes(o.vendor_status))
        .reduce((s, o) => s + o.unit_price_kobo * o.qty, 0);
      return { activeListings: active, lowStock, pending, revenue, total: parts.count ?? 0 };
    },
  });

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Stat label="Active listings" value={data?.activeListings ?? 0} sub={`${data?.total ?? 0} total`} />
      <Stat label="Pending orders" value={data?.pending ?? 0} sub="Need action" />
      <Stat label="Low stock" value={data?.lowStock ?? 0} sub="Below 5 units" />
      <Stat label="Lifetime revenue" value={formatNaira(data?.revenue ?? 0)} sub="From completed orders" />
    </div>
  );
};
const Stat = ({ label, value, sub }: { label: string; value: any; sub: string }) => (
  <div className="bg-card border border-border rounded-xl p-3">
    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
    <div className="text-lg font-bold mt-1">{value}</div>
    <div className="text-[10px] text-muted-foreground">{sub}</div>
  </div>
);

/* ============ Parts CRUD ============ */
const PartsManager = ({ vendorId }: { vendorId: string }) => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const partsQ = useQuery({
    queryKey: ["vendor-parts", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("*, category:parts_categories(name)")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["vendor-parts", vendorId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">My listings</h3>
        <button onClick={() => setCreating(true)} className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full">+ New listing</button>
      </div>

      {partsQ.isLoading ? (
        <p className="text-center text-xs text-muted-foreground py-10">Loading…</p>
      ) : partsQ.data && partsQ.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {partsQ.data.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex gap-3 items-start">
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" /> : "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">{p.title}</div>
                <div className="text-[11px] text-muted-foreground">{p.category?.name} · {p.condition}</div>
                <div className="text-[12px] font-bold text-primary mt-0.5">{formatNaira(p.price_kobo)} · stock {p.stock}</div>
                <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${p.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(p)} className="text-[11px] text-primary font-semibold">Edit</button>
                <button onClick={() => { if (confirm("Delete this listing?")) del.mutate(p.id); }} className="text-[11px] text-destructive font-semibold">Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <div className="text-3xl mb-2">📦</div>
          <p className="text-xs text-muted-foreground">No listings yet</p>
        </div>
      )}

      {(creating || editing) && (
        <PartFormModal
          vendorId={vendorId}
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); qc.invalidateQueries({ queryKey: ["vendor-parts", vendorId] }); }}
        />
      )}
    </div>
  );
};

const PartFormModal = ({ vendorId, initial, onClose, onSaved }: { vendorId: string; initial: any; onClose: () => void; onSaved: () => void }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    brand: initial?.brand ?? "",
    description: initial?.description ?? "",
    price_naira: initial ? String(initial.price_kobo / 100) : "",
    stock: String(initial?.stock ?? 1),
    condition: initial?.condition ?? "new",
    category_id: initial?.category_id ?? "",
    status: initial?.status ?? "active",
    images: (initial?.images ?? []) as string[],
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const catsQ = useQuery({
    queryKey: ["parts-categories"],
    queryFn: async () => (await supabase.from("parts_categories").select("*").order("sort_order")).data ?? [],
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    const { data: u } = await supabase.auth.getUser();
    const path = `${u.user!.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("parts-images").upload(path, file, { cacheControl: "3600" });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("parts-images").getPublicUrl(path);
    setForm((f) => ({ ...f, images: [...f.images, data.publicUrl] }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    if (!form.category_id) return toast.error("Pick a category");
    const price = parseFloat(form.price_naira);
    if (!price || price <= 0) return toast.error("Enter a valid price");
    setBusy(true);
    const payload = {
      vendor_id: vendorId,
      title: form.title.trim(),
      brand: form.brand || null,
      description: form.description || null,
      price_kobo: Math.round(price * 100),
      stock: parseInt(form.stock) || 0,
      condition: form.condition as any,
      category_id: form.category_id,
      status: form.status as any,
      images: form.images,
    };
    const { error } = isEdit
      ? await supabase.from("parts").update(payload).eq("id", initial.id)
      : await supabase.from("parts").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isEdit ? "Listing updated" : "Listing created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex justify-between items-center">
          <h3 className="text-sm font-bold">{isEdit ? "Edit listing" : "New listing"}</h3>
          <button onClick={onClose} className="text-muted-foreground text-lg">✕</button>
        </div>
        <div className="p-4 flex flex-col gap-2.5">
          <input placeholder="Title (e.g. Bosch S4 Battery 70Ah)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary">
            <option value="">Select category…</option>
            {catsQ.data?.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Price (₦)" type="number" value={form.price_naira} onChange={(e) => setForm({ ...form, price_naira: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
            <input placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary">
              <option value="new">New</option>
              <option value="refurbished">Refurbished</option>
              <option value="used">Used</option>
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <textarea placeholder="Description / compatibility notes" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary resize-none" />

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground">Images</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {form.images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-[10px]">✕</button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground cursor-pointer">
                {uploading ? "…" : "+"}
                <input type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            </div>
          </div>

          <button onClick={save} disabled={busy} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold mt-2 disabled:opacity-60">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Publish listing"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============ Orders inbox ============ */
const OrdersInbox = ({ vendorId }: { vendorId: string }) => {
  const qc = useQueryClient();
  const ordersQ = useQuery({
    queryKey: ["vendor-orders", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_order_items")
        .select("*, order:parts_orders(id, created_at, status, delivery_address, delivery_phone, buyer_id)")
        .eq("vendor_id", vendorId)
        .order("id", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const advance = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      const { error } = await supabase.from("parts_order_items").update({ vendor_status: next as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["vendor-orders", vendorId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const nextStep = (s: string): { next: string; label: string } | null => {
    switch (s) {
      case "paid": return { next: "accepted", label: "Accept order" };
      case "accepted": return { next: "packed", label: "Mark packed" };
      case "packed": return { next: "shipped", label: "Mark shipped" };
      case "shipped": return { next: "delivered", label: "Mark delivered" };
      default: return null;
    }
  };

  if (ordersQ.isLoading) return <p className="text-center text-xs text-muted-foreground py-10">Loading…</p>;
  if (!ordersQ.data?.length) return (
    <div className="text-center py-10 border border-dashed border-border rounded-xl">
      <div className="text-3xl mb-2">📭</div>
      <p className="text-xs text-muted-foreground">No orders yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {ordersQ.data.map((it: any) => {
        const step = nextStep(it.vendor_status);
        return (
          <div key={it.id} className="bg-card border border-border rounded-xl p-3">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold truncate">{it.title_snapshot}</div>
                <div className="text-[10px] text-muted-foreground">Qty {it.qty} · {formatNaira(it.unit_price_kobo * it.qty)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">Order #{it.order?.id?.slice(0, 8)} · {it.order?.created_at && new Date(it.order.created_at).toLocaleDateString()}</div>
                {it.order?.delivery_address && <div className="text-[10px] text-muted-foreground mt-0.5">📍 {it.order.delivery_address}</div>}
                {it.order?.delivery_phone && <div className="text-[10px] text-muted-foreground">📞 {it.order.delivery_phone}</div>}
              </div>
              <span className="text-[9px] font-semibold bg-muted px-1.5 py-0.5 rounded uppercase">{it.vendor_status}</span>
            </div>
            {step && (
              <button
                onClick={() => advance.mutate({ id: it.id, next: step.next })}
                className="w-full mt-2 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold"
              >
                {step.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ============ Settings ============ */
const SettingsTab = ({ vendor, onSaved }: { vendor: any; onSaved: () => void }) => {
  const [form, setForm] = useState({
    business_name: vendor.business_name ?? "",
    phone: vendor.phone ?? "",
    address: vendor.address ?? "",
    payout_account: vendor.payout_account ?? "",
  });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("vendors").update(form).eq("id", vendor.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    onSaved();
  };
  return (
    <div className="flex flex-col gap-2.5 max-w-md">
      <input placeholder="Business name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
      <input placeholder="Payout account (bank · acct no)" value={form.payout_account} onChange={(e) => setForm({ ...form, payout_account: e.target.value })} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
      <button onClick={save} disabled={busy} className="py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60">{busy ? "Saving…" : "Save changes"}</button>
    </div>
  );
};

export default VendorPortal;
