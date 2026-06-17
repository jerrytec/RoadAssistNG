import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  peerName?: string;
  peerRole?: string;
}

type CallState = "connecting" | "ringing" | "in-call" | "ended";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
};

/**
 * In-app voice call dialog.
 * Uses the browser's microphone (getUserMedia) so the call works without
 * leaving the app. Signalling to a real peer would be wired through a
 * backend WebRTC service; here we simulate the remote side answering.
 */
const CallDialog = ({ open, onClose, peerName = "Provider", peerRole }: Props) => {
  const [state, setState] = useState<CallState>("connecting");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const ringTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setState("connecting");
    setSeconds(0);
    setMuted(false);
    setError(null);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setState("ringing");
        ringTimerRef.current = window.setTimeout(() => {
          setState("in-call");
          timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
        }, 1800);
      } catch (e: any) {
        setError(e?.message ?? "Microphone access denied");
        setState("ended");
      }
    })();

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (ringTimerRef.current) window.clearTimeout(ringTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };

  const endCall = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (ringTimerRef.current) window.clearTimeout(ringTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState("ended");
    setTimeout(onClose, 600);
  };

  if (!open) return null;

  const status =
    state === "connecting" ? "Connecting…" :
    state === "ringing" ? "Ringing…" :
    state === "in-call" ? formatTime(seconds) :
    "Call ended";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 animate-fade-in" onClick={endCall}>
      <div
        className="w-[320px] max-w-[92vw] rounded-2xl bg-card text-card-foreground shadow-premium overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hero-gradient px-5 py-6 text-center text-primary-foreground">
          <div className="w-20 h-20 mx-auto rounded-full bg-card/20 backdrop-blur flex items-center justify-center text-3xl font-bold mb-3">
            {peerName.charAt(0).toUpperCase()}
          </div>
          <p className="text-base font-bold">{peerName}</p>
          {peerRole && <p className="text-[11px] opacity-80">{peerRole}</p>}
          <p className="text-xs mt-2 opacity-90">
            {state === "ringing" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />}
            {status}
          </p>
        </div>

        {error && (
          <p className="text-[11px] text-destructive text-center px-4 pt-3">{error}</p>
        )}

        <div className="flex items-center justify-around p-5">
          <button
            onClick={toggleMute}
            disabled={state !== "in-call"}
            className="flex flex-col items-center gap-1 disabled:opacity-40"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <span className={`w-12 h-12 rounded-full flex items-center justify-center ${muted ? "bg-muted" : "bg-primary-light text-primary"}`}>
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </span>
            <span className="text-[10px] text-muted-foreground">{muted ? "Muted" : "Mute"}</span>
          </button>

          <button
            onClick={endCall}
            className="flex flex-col items-center gap-1"
            aria-label="End call"
          >
            <span className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-card">
              <PhoneOff className="w-6 h-6" />
            </span>
            <span className="text-[10px] text-muted-foreground">End</span>
          </button>

          <button
            onClick={() => setSpeaker((s) => !s)}
            disabled={state !== "in-call"}
            className="flex flex-col items-center gap-1 disabled:opacity-40"
            aria-label={speaker ? "Speaker off" : "Speaker on"}
          >
            <span className={`w-12 h-12 rounded-full flex items-center justify-center ${speaker ? "bg-primary-light text-primary" : "bg-muted"}`}>
              {speaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </span>
            <span className="text-[10px] text-muted-foreground">Speaker</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallDialog;
export { CallDialog };

/** Reusable trigger button — green pill matching chat button style. */
export const CallButton = ({
  onClick,
  className = "",
  label = "Call",
}: { onClick: () => void; className?: string; label?: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-success text-success-foreground text-xs font-semibold cursor-pointer hover:opacity-90 ${className}`}
  >
    <Phone className="w-3.5 h-3.5" />
    {label}
  </button>
);
