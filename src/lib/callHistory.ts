/**
 * Lightweight local call-history log. Stored per-browser so users can
 * review recent in-app calls without a backend round-trip.
 */
export type CallStatus = "completed" | "missed" | "declined" | "failed";

export interface CallRecord {
  id: string;
  peerName: string;
  peerRole?: string;
  status: CallStatus;
  durationSec: number;
  startedAt: string; // ISO
  threadId?: string;
}

const KEY = "ra:call-history";
const MAX = 50;

export const getCallHistory = (threadId?: string): CallRecord[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const all: CallRecord[] = raw ? JSON.parse(raw) : [];
    return threadId ? all.filter((r) => r.threadId === threadId) : all;
  } catch {
    return [];
  }
};

export const logCall = (rec: Omit<CallRecord, "id">): CallRecord => {
  const entry: CallRecord = { ...rec, id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` };
  try {
    const all = getCallHistory();
    all.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)));
  } catch {
    /* ignore quota errors */
  }
  return entry;
};

export const formatDuration = (s: number) => {
  if (s <= 0) return "0s";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}m ${r.toString().padStart(2, "0")}s` : `${r}s`;
};
