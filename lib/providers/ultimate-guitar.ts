import type { ChordProvider } from "./chord-provider";
import type { Song } from "../types";

export class UltimateGuitarProvider implements ChordProvider {
  canHandle(url: string): boolean {
    return url.includes("ultimate-guitar.com") || url.includes("tabs.ultimate-guitar.com");
  }

  async extract(url: string): Promise<Song> {
    const { chromium } = await import("playwright");

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
      const page = await context.newPage();

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      // UG embeds the tab data in a JSON store inside a <div data-content> or window.UGAPP
      const data = await page.evaluate(() => {
        // Try to grab the store from the page's JS
        const storeEl = document.querySelector(".js-store[data-content]");
        if (storeEl) {
          try {
            return JSON.parse(storeEl.getAttribute("data-content") ?? "{}");
          } catch {}
        }
        // Fallback: look for inline script with store data
        for (const script of Array.from(document.querySelectorAll("script"))) {
          const text = script.textContent ?? "";
          const match = text.match(/window\.UGAPP\s*=\s*(\{.+?\});/s);
          if (match) {
            try { return JSON.parse(match[1]); } catch {}
          }
        }
        return null;
      });

      let title = "Unknown";
      let artist = "Unknown";
      let rawContent = "";

      if (data) {
        const store = data.store ?? data;
        const tabView = store?.page?.data?.tab_view ?? store?.tab_view;
        const tab = store?.page?.data?.tab ?? store?.tab;

        title = tab?.song_name ?? tabView?.tab?.song_name ?? "Unknown";
        artist = tab?.artist_name ?? tabView?.tab?.artist_name ?? "Unknown";
        rawContent = tabView?.wiki_tab?.content ?? tabView?.tab_view?.wiki_tab?.content ?? "";
      }

      if (!rawContent) {
        // Fallback: try to get the raw text content from the page
        rawContent = await page.evaluate(() => {
          const el = document.querySelector(".ugm-tab__content, [class*='tab-content'], pre");
          return el?.textContent ?? document.body.innerText ?? "";
        });
        if (!title || title === "Unknown") {
          title = await page.title();
        }
      }

      const chords = extractChordsFromContent(rawContent);

      return { title, artist, url, chords };
    } finally {
      await browser?.close();
    }
  }
}

// Chord regex: match standard chord names including sharps, flats, and common suffixes
const CHORD_REGEX =
  /\b([A-G][#b]?(?:m(?:aj)?(?:7|9|11|13)?|maj(?:7|9|11|13)?|(?:7|9|11|13)|sus[24]?|add(?:9|11)|dim(?:7)?|aug|°|ø|\/[A-G][#b]?)*)\b/g;

function extractChordsFromContent(content: string): string[] {
  const chords: string[] = [];
  // UG format: chords appear on lines that look like chord lines (not lyric lines)
  const lines = content.split("\n");
  for (const line of lines) {
    // A chord line has mostly spaces and chord names, not long words
    const cleaned = line.replace(/\[ch\]/g, "").replace(/\[\/ch\]/g, "");
    const hasChordTags = line.includes("[ch]");
    if (hasChordTags) {
      const matches = cleaned.match(/\[ch\](.*?)\[\/ch\]/g);
      if (matches) {
        for (const m of matches) {
          const chord = m.replace(/\[ch\]/g, "").replace(/\[\/ch\]/g, "").trim();
          if (chord) chords.push(chord);
        }
        continue;
      }
    }
    // Heuristic chord line detection: line with mostly chord tokens
    if (isChordLine(cleaned)) {
      const matches = cleaned.matchAll(CHORD_REGEX);
      for (const m of matches) {
        if (m[1]) chords.push(m[1]);
      }
    }
  }
  return chords;
}

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 200) return false;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const chordCount = [...trimmed.matchAll(CHORD_REGEX)].length;
  return wordCount > 0 && chordCount / wordCount >= 0.5;
}
