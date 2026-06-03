import { getChordColor } from "../lib/services/chord-colors";

describe("getChordColor", () => {
  it("returns a hex color string", () => {
    const color = getChordColor("Am");
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("returns the same color for the same chord name (deterministic)", () => {
    expect(getChordColor("F")).toBe(getChordColor("F"));
    expect(getChordColor("Am")).toBe(getChordColor("Am"));
  });

  it("returns different colors for different chords", () => {
    const colors = ["F", "G", "Am", "Em", "C", "D"].map(getChordColor);
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThan(3);
  });
});
