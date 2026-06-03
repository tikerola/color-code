import type { Song } from "../types";

export interface ChordProvider {
  canHandle(url: string): boolean;
  extract(url: string): Promise<Song>;
}
