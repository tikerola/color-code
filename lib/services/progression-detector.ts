import type { Progression } from "../types";

export class ProgressionDetector {
  static detect(chords: string[]): Progression {
    if (chords.length === 0) return { sequence: [], repeatCount: 0 };
    if (chords.length === 1) return { sequence: chords, repeatCount: 1 };

    const cleaned = this.removeNoise(chords);
    if (cleaned.length === 0) return { sequence: chords.slice(0, 1), repeatCount: 1 };

    const best = this.findBestPattern(cleaned);
    return best;
  }

  private static removeNoise(chords: string[]): string[] {
    const freq: Record<string, number> = {};
    for (const c of chords) freq[c] = (freq[c] ?? 0) + 1;
    const threshold = chords.length * 0.02;
    return chords.filter((c) => freq[c] > threshold);
  }

  private static findBestPattern(chords: string[]): Progression {
    let best: Progression = { sequence: chords, repeatCount: 1 };

    for (let len = 1; len <= Math.floor(chords.length / 2); len++) {
      const candidate = chords.slice(0, len);
      const repeatCount = this.countRepeats(chords, candidate);
      const coverage = (repeatCount * len) / chords.length;

      const bestCoverage = (best.repeatCount * best.sequence.length) / chords.length;
      if (coverage >= 0.7 && (repeatCount > best.repeatCount || (repeatCount === best.repeatCount && coverage > bestCoverage))) {
        best = { sequence: candidate, repeatCount };
      }
    }

    // If no good repeating pattern, deduplicate the chord list preserving order
    if (best.sequence === chords) {
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const c of chords) {
        if (!seen.has(c)) { seen.add(c); unique.push(c); }
      }
      return { sequence: unique, repeatCount: 1 };
    }

    return best;
  }

  private static countRepeats(chords: string[], pattern: string[]): number {
    let count = 0;
    let i = 0;
    while (i + pattern.length <= chords.length) {
      const slice = chords.slice(i, i + pattern.length);
      if (this.arraysMatch(slice, pattern)) {
        count++;
        i += pattern.length;
      } else {
        i++;
      }
    }
    return count;
  }

  private static arraysMatch(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((v, i) => v === b[i]);
  }
}
