import { describe, it, expect } from "vitest";
import { buildPageWindow } from "@/components/Pager";

describe("buildPageWindow", () => {
  it("shows pages 1–5 when on page 1 of many", () => {
    expect(buildPageWindow(1, 25)).toEqual([1, 2, 3, 4, 5]);
  });

  it("centers the window on the active page", () => {
    expect(buildPageWindow(12, 25)).toEqual([10, 11, 12, 13, 14]);
  });

  it("clamps the window at the end", () => {
    expect(buildPageWindow(25, 25)).toEqual([21, 22, 23, 24, 25]);
  });

  it("returns all pages when there are 5 or fewer", () => {
    expect(buildPageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("handles a single page", () => {
    expect(buildPageWindow(1, 1)).toEqual([1]);
  });
});
