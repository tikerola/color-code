import { ProgressionDetector } from "../lib/services/progression-detector";

describe("ProgressionDetector", () => {
  it("detects a clean 4-chord repeating progression", () => {
    const chords = ["F", "G", "Am", "Em", "F", "G", "Am", "Em", "F", "G", "Am", "Em"];
    const result = ProgressionDetector.detect(chords);
    expect(result.sequence).toEqual(["F", "G", "Am", "Em"]);
    expect(result.repeatCount).toBe(3);
  });

  it("returns unique chords for non-repeating input", () => {
    const chords = ["C", "F", "G", "Am", "Dm", "E7"];
    const result = ProgressionDetector.detect(chords);
    expect(result.sequence).toEqual(["C", "F", "G", "Am", "Dm", "E7"]);
  });

  it("handles a 2-chord repeating progression", () => {
    const chords = ["Am", "G", "Am", "G", "Am", "G", "Am", "G"];
    const result = ProgressionDetector.detect(chords);
    expect(result.sequence).toEqual(["Am", "G"]);
    expect(result.repeatCount).toBe(4);
  });

  it("handles empty input", () => {
    const result = ProgressionDetector.detect([]);
    expect(result.sequence).toEqual([]);
    expect(result.repeatCount).toBe(0);
  });

  it("handles single chord", () => {
    const result = ProgressionDetector.detect(["C"]);
    expect(result.sequence).toEqual(["C"]);
    expect(result.repeatCount).toBe(1);
  });

  it("ignores rare noise chords", () => {
    const chords = [
      "F", "G", "Am", "Em",
      "F", "G", "Am", "Em",
      "F", "G", "Am", "Em",
      "F", "G", "Am", "Em",
      "Xxx", // noise chord appears once
    ];
    const result = ProgressionDetector.detect(chords);
    expect(result.sequence).toEqual(["F", "G", "Am", "Em"]);
  });
});
