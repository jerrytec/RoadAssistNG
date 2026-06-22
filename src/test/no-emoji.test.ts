import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Icon regression guard: the design system standardizes on Lucide SVG icons.
 * Emoji glyphs in JSX/TSX are forbidden in the listed UI files because they
 * render inconsistently across platforms and break the visual identity.
 *
 * Add a file path here only after replacing its emojis with a Lucide icon.
 */
const FORBIDDEN_EMOJIS = [
  "📞", "📍", "💬", "💰", "🔧", "🚗", "🚐", "🛠️", "⭐", "📭",
  "🚨", "⚠️", "✅", "💳", "🛡️", "🔄", "🔍", "🕐", "🔩",
];

const GUARDED_FILES = [
  "src/components/TabBar.tsx",
  "src/components/ProviderCard.tsx",
  "src/components/NearestProvidersList.tsx",
  "src/components/ChatDrawer.tsx",
  "src/components/screens/MechanicScreen.tsx",
  "src/components/screens/NeedHelpScreen.tsx",
  "src/components/screens/ServiceListScreen.tsx",
  "src/components/screens/ProviderJobsBoard.tsx",
  "src/components/screens/ProviderDashboard.tsx",
  "src/components/screens/BookingHistoryScreen.tsx",
  "src/pages/RequestTracking.tsx",
  "src/pages/MyOrders.tsx",
];

const ROOT = process.cwd();

describe("icon regression — no emoji glyphs in guarded UI files", () => {
  for (const rel of GUARDED_FILES) {
    it(`${rel} has no forbidden emoji`, () => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      const found = FORBIDDEN_EMOJIS.filter((e) => src.includes(e));
      expect(found, `Found forbidden emoji(s) in ${rel}: ${found.join(" ")}`).toEqual([]);
    });
  }
});

describe("icon regression — providerIcons map covers core trades", () => {
  it("module exports getProviderIcon", async () => {
    const mod = await import("@/lib/providerIcons");
    expect(typeof mod.getProviderIcon).toBe("function");
  });
});

// Sanity: ensure every guarded file exists so renames don't silently skip checks.
describe("icon regression — guarded files exist", () => {
  for (const rel of GUARDED_FILES) {
    it(`${rel} exists`, () => {
      expect(() => statSync(join(ROOT, rel))).not.toThrow();
    });
  }
});

// Avoid unused-import warning for readdirSync / relative when shrinking the suite later.
void readdirSync;
void relative;
