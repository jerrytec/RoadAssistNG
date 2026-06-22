import { Truck, Disc3, Wrench, PackageOpen, type LucideIcon } from "lucide-react";

/**
 * Maps a provider's `type` string to a Lucide icon that matches the
 * primary navigation (TabBar) so the same trade is always represented
 * by the same glyph across the app.
 */
export const getProviderIcon = (type: string): LucideIcon => {
  const t = type.toLowerCase();
  if (t.includes("tow")) return Truck;
  if (t.includes("vulcanizer") || t.includes("tyre") || t.includes("tire")) return Disc3;
  if (t.includes("mechanic")) return Wrench;
  return PackageOpen;
};
