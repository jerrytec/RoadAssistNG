import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { logCall, type CallStatus } from "@/lib/callHistory";

interface Props {
  open: boolean;
  onClose: () => void;
  peerName?: string;
  peerRole?: string;
  /** Optional: associate the call with a chat thread for history filtering. */
  threadId?: string;
  /** Fired when the call session ends (after permission flow). */
  onEnded?: (info: { status: CallStatus; durationSec: number }) => void;
}

type CallState = "permission" | "permission-denied" | "connecting" | "ringing" | "in-call" | "ended";

const formatTime = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
};

/**
 * In-app voice call dialog. Requests microphone permission up-front, surfaces
 * a clear "permission denied" state with a retry, and logs every session to
 * local call history.
 */
const CallDialog = ({ open, onClose, peerName = "Provider", peerRole, threadId, onEnded }: Props) => {
  const [state, setState] = useState<CallState>("permission");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const ringTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<string>("");
  const loggedRef = useRef(false);

  const cleanup = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (ringTimerRef.current) window.clearTimeout(ringTimerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    timerRef.current = null;
    ringTimerRef.current = null;
  };

  const finish = (status: CallStatus, durationSec: number) => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    logCall({
      peerName,
      peerRole,
      status,
      durationSec,
      startedAt: startedAtRef.current || new Date().toISOString(),
      threadId,
    });
    onEnded?.({ status, durationSec });
  };

  const requestMic = async () => {
    setError(null);
    setState("connecting");
    try {
      // Best-effort pre-check (not supported everywhere).
      if (navigator.permissions && (navigator.permissions as any).query) {
        try {
          const p = await (navigator.permissions as any).query({ name: "microphone" as PermissionName });
          if (p.state === "denied") {
            setError("Microphone access is blocked. Enable it in your browser site settings and try again.");
            setState("permission-denied");
            finish("failed", 0);
            return;
          }
        } catch { /* ignore unsupported permission name */ }
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Voice calls aren't supported in this browser.");
        setState("permission-denied");
        finish("failed", 0);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startedAtRef.current = new Date().toISOString();
      setState("ringing");
      ringTimerRef.current = window.setTimeout(() => {
        setState("in-call");
        timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      }, 1800);
    } catch (e: any) {
      const denied = e?.name === "NotAllowedError" || e?.name === "SecurityError";
      setError(denied
        ? "You denied microphone access. Allow it in your browser to make a call."
        : (e?.message ?? "Unable to access microphone."));
      setState("permission-denied");
      finish("failed", 0);
    }
  };

  useEffect(() => {
    if (!open) return;
    setState("permission");
    setSeconds(0);
    setMuted(false);
    setError(null);
    loggedRef.current = false;
    startedAtRef.current = "";
    // Auto-request immediately; user can retry from the denied state.
    requestMic();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };

  const endCall = () => {
    const wasInCall = state === "in-call";
    const wasRinging = state === "ringing";
    const dur = wasInCall ? seconds : 0;
    cleanup();
    setState("ended");
    if (wasInCall) finish("completed", dur);
    else if (wasRinging) finish("missed", 0);
    setTimeout(onClose, 600);
  };

  const closeDenied = () => {
    cleanup();
    onClose();
  };

  if (!open) return null;

  const status =
    state === "permission" ? "Requesting microphone…" :
    state === "permission-denied" ? "Microphone blocked" :
    state === "connecting" ? "Connecting…" :
    state === "ringing" ? "Ringing…" :
    state === "in-call" ? formatTime(seconds) :
    "Call ended";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 animate-fade-in" onClick={state === "permission-denied" ? closeDenied : endCall}>
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
          <p className="text-xs mt-2 opacity-90 flex items-center justify-center gap-1.5">
            {state === "ringing" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />}
            {state === "in-call" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />}
            {muted && state === "in-call" && <MicOff className="w-3 h-3" />}
            {status}
          </p>
        </div>

        {state === "permission-denied" ? (
          <div className="p-5 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-warning mx-auto" />
            <p className="text-xs text-muted-foreground">{error}</p>
            <div className="flex gap-2 justify-center pt-1">
              <button onClick={closeDenied} className="px-3 py-2 rounded-md bg-muted text-xs">Close</button>
              <button onClick={() => { loggedRef.current = false; requestMic(); }} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold">Try again</button>
            </div>
          </div>
        ) : (
          <>
            {error && <p className="text-[11px] text-destructive text-center px-4 pt-3">{error}</p>}
            <div className="flex items-center justify-around p-5">
              <button onClick={toggleMute} disabled={state !== "in-call"} className="flex flex-col items-center gap-1 disabled:opacity-40" aria-label={muted ? "Unmute" : "Mute"}>
                <span className={`w-12 h-12 rounded-full flex items-center justify-center ${muted ? "bg-muted" : "bg-primary-light text-primary"}`}>
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </span>
                <span className="text-[10px] text-muted-foreground">{muted ? "Muted" : "Mute"}</span>
              </button>

              <button onClick={endCall} className="flex flex-col items-center gap-1" aria-label="End call">
                <span className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-card">
                  <PhoneOff className="w-6 h-6" />
                </span>
                <span className="text-[10px] text-muted-foreground">End</span>
              </button>

              <button onClick={() => setSpeaker((s) => !s)} disabled={state !== "in-call"} className="flex flex-col items-center gap-1 disabled:opacity-40" aria-label={speaker ? "Speaker off" : "Speaker on"}>
                <span className={`w-12 h-12 rounded-full flex items-center justify-center ${speaker ? "bg-primary-light text-primary" : "bg-muted"}`}>
                  {speaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </span>
                <span className="text-[10px] text-muted-foreground">Speaker</span>
              </button>
            </div>
          </>
        )}
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
