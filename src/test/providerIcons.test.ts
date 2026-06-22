import { describe, it, expect } from "vitest";
import { Truck, Disc3, Wrench, PackageOpen } from "lucide-react";
import { getProviderIcon } from "@/lib/providerIcons";

describe("getProviderIcon", () => {
  it("maps tow-related labels to Truck", () => {
    expect(getProviderIcon("Tow van")).toBe(Truck);
    expect(getProviderIcon("Heavy-duty TOW")).toBe(Truck);
    expect(getProviderIcon("Tow operator")).toBe(Truck);
  });

  it("maps tyre / vulcanizer labels to Disc3", () => {
    expect(getProviderIcon("Vulcanizer")).toBe(Disc3);
    expect(getProviderIcon("Mobile vulcanizer")).toBe(Disc3);
    expect(getProviderIcon("Tyre shop")).toBe(Disc3);
    expect(getProviderIcon("Tire repair")).toBe(Disc3);
  });

  it("maps mechanic labels to Wrench", () => {
    expect(getProviderIcon("Mechanic")).toBe(Wrench);
    expect(getProviderIcon("Mobile mechanic")).toBe(Wrench);
  });

  it("falls back to PackageOpen for unknown types", () => {
    expect(getProviderIcon("Spare parts")).toBe(PackageOpen);
    expect(getProviderIcon("")).toBe(PackageOpen);
  });

  it("never returns null/undefined", () => {
    const samples = ["", "?", "random", "Tow", "Vulcanizer", "Mechanic"];
    for (const s of samples) {
      const Icon = getProviderIcon(s);
      expect(Icon).toBeTruthy();
      expect(typeof Icon).toBe("object"); // forwardRef component
    }
  });
});
