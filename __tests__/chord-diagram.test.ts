import { getChordDiagram } from "../lib/services/chord-diagram";

describe("getChordDiagram", () => {
  it("returns a guitar SVG for a known chord", () => {
    const d = getChordDiagram("Am", "guitar");
    expect(d.chord).toBe("Am");
    expect(d.instrument).toBe("guitar");
    expect(d.svg).toContain("<svg");
    expect(d.svg).toContain("Am");
  });

  it("returns a ukulele SVG for a known chord", () => {
    const d = getChordDiagram("C", "ukulele");
    expect(d.instrument).toBe("ukulele");
    expect(d.svg).toContain("<svg");
  });

  it("returns a piano SVG", () => {
    const d = getChordDiagram("F", "piano");
    expect(d.instrument).toBe("piano");
    expect(d.svg).toContain("<svg");
  });

  it("falls back gracefully for unknown chord names", () => {
    const d = getChordDiagram("Xyz", "guitar");
    expect(d.svg).toContain("<svg");
  });

  it("generates diagrams for all progression chords", () => {
    const progression = ["F", "G", "Am", "Em"];
    for (const chord of progression) {
      for (const inst of ["guitar", "ukulele", "piano"] as const) {
        const d = getChordDiagram(chord, inst);
        expect(d.svg).toContain("<svg");
      }
    }
  });
});
