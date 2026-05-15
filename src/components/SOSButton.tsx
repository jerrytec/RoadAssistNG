import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTriggerSOS } from "@/hooks/useSOS";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  variant?: "hero" | "fab";
}

const SOSButton = ({ variant = "hero" }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const trigger = useTriggerSOS();
  const [arming, setArming] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const cancel = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setArming(null);
  };

  const fire = async () => {
    cancel();
    if (!user) { toast.error("Please sign in to trigger SOS"); return; }
    try {
      const res = await trigger.mutateAsync(undefined);
      if (res.existing) toast("You already have an active SOS — opening it");
      navigate(`/sos/${res.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not send SOS");
    }
  };

  const start = () => {
    if (arming !== null || trigger.isPending) return;
    setArming(3);
    timerRef.current = window.setInterval(() => {
      setArming((v) => {
        if (v === null) return null;
        if (v <= 1) { fire(); return null; }
        return v - 1;
      });
    }, 1000);
  };

  if (variant === "fab") {
    return (
      <button
        onClick={arming !== null ? cancel : start}
        aria-label="Emergency SOS"
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-destructive text-destructive-foreground font-extrabold text-xs flex items-center justify-center shadow-lg border-2 border-card ${arming !== null ? "animate-pulse" : ""}`}
        style={{ boxShadow: "0 8px 24px hsl(var(--destructive) / 0.4)" }}
      >
        {arming !== null ? arming : "SOS"}
      </button>
    );
  }

  const armed = arming !== null;
  return (
    <div className="text-center py-5">
      <button
        onClick={armed ? cancel : start}
        disabled={trigger.isPending}
        className={`w-[130px] h-[130px] rounded-full border-none text-destructive-foreground font-extrabold cursor-pointer inline-flex items-center justify-center flex-col tracking-wider transition-transform active:scale-[0.97] ${armed ? "bg-destructive animate-pulse text-3xl" : "bg-destructive text-[24px] hover:scale-[1.04]"}`}
        style={{ boxShadow: "var(--shadow-sos)" }}
        aria-label="Trigger SOS emergency"
      >
        {armed ? arming : "SOS"}
        <span className="text-[10px] opacity-90 mt-0.5 tracking-normal font-normal">
          {armed ? "Tap to cancel" : trigger.isPending ? "Sending…" : "Tap to alert"}
        </span>
      </button>
      <p className="text-[11px] text-muted-foreground mt-2">
        {armed ? "Hold tight — dispatching in seconds" : "Broadcasts your live location to nearby operators"}
      </p>
    </div>
  );
};

export default SOSButton;
