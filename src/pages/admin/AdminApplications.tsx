import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useProviderApplications } from "@/hooks/useProviderApplication";

const AdminApplications = () => {
  const { applications, loading, review, reviewing } = useProviderApplications();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const act = async (id: string, status: "approved" | "rejected") => {
    try {
      await review({ id, status, notes: notes[id] });
      toast.success(status === "approved" ? "Provider published to the directory" : "Application rejected");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update the application");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Provider applications</h1>
        <p className="text-xs text-muted-foreground">
          Self sign-ups from tow vans, vulcanizers, mechanics and parts sellers. Approving publishes the provider into the public directory.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading queue…</div>
      )}

      {!loading && applications.length === 0 && (
        <p className="text-xs text-muted-foreground">No applications yet.</p>
      )}

      <div className="grid gap-3">
        {applications.map((a) => (
          <article key={a.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{a.name}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {a.type} · {a.location ?? "no area"} · {a.phone ?? "no phone"}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                a.status === "approved" ? "bg-green-500/10 text-green-600"
                : a.status === "rejected" ? "bg-destructive/10 text-destructive"
                : "bg-amber-500/10 text-amber-600"}`}>
                {a.status}
              </span>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div><dt className="text-muted-foreground">Contact</dt><dd>{a.operator ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Call-out</dt><dd>{a.base_fee_kobo ? `₦${(a.base_fee_kobo / 100).toLocaleString()}` : "—"}</dd></div>
              <div><dt className="text-muted-foreground">Per km</dt><dd>{a.per_km_kobo ? `₦${(a.per_km_kobo / 100).toLocaleString()}` : "—"}</dd></div>
              <div><dt className="text-muted-foreground">Plate</dt><dd>{a.plate ?? "—"}</dd></div>
            </dl>

            {a.services?.length > 0 && (
              <p className="text-[11px] text-muted-foreground">Services: {a.services.join(", ")}</p>
            )}

            <input
              value={notes[a.id] ?? a.review_notes ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [a.id]: e.target.value }))}
              placeholder="Review note (shown to the applicant)"
              className="w-full h-9 px-3 border border-border rounded-lg text-xs bg-background outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <button
                onClick={() => act(a.id, "approved")}
                disabled={reviewing || a.status === "approved"}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; publish
              </button>
              <button
                onClick={() => act(a.id, "rejected")}
                disabled={reviewing || a.status === "rejected"}
                className="h-9 px-3 rounded-lg border border-border text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminApplications;
