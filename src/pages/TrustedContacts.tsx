import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { toast } from "sonner";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";
import { useTrustedContacts } from "@/hooks/useSOS";

const TrustedContacts = () => {
  const navigate = useNavigate();
  const { data, add, remove, isLoading } = useTrustedContacts();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return toast.error("Name and phone required");
    try {
      await add.mutateAsync({ name: name.trim(), phone: phone.trim(), relation: relation.trim() || undefined });
      setName(""); setPhone(""); setRelation("");
      toast.success("Contact added");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageNav />
      <header className="gradient-brand px-4 py-3 flex items-center gap-2 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/15 text-primary-foreground flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
        <h1 className="text-base font-bold text-primary-foreground">Trusted contacts</h1>
      </header>
      <div className="container max-w-[640px] px-4 py-4 space-y-4">
        <p className="text-xs text-muted-foreground">These contacts will receive your live SOS trip link the moment you trigger an emergency.</p>

        <form onSubmit={submit} className="bg-card border border-border rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (e.g. 0803…)" className="py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          </div>
          <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation (optional, e.g. Spouse)" className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          <button type="submit" disabled={add.isPending} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
            <UserPlus className="w-4 h-4" /> {add.isPending ? "Adding…" : "Add contact"}
          </button>
        </form>

        <div className="space-y-2">
          {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {!isLoading && (data?.length ?? 0) === 0 && <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">No contacts yet</p>}
          {data?.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">{c.phone}{c.relation ? ` · ${c.relation}` : ""}</p>
              </div>
              <button onClick={() => remove.mutate(c.id)} className="w-8 h-8 rounded-full bg-muted text-destructive flex items-center justify-center" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedContacts;
