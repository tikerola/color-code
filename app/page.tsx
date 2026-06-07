"use client";
import { useState } from "react";
import { ManualChordsSection } from "../components/ManualChordsSection";
import { PianoNotesSection } from "../components/PianoNotesSection";
import type { PianoSeqItem } from "../lib/types";

export default function HomePage() {
  const [pianoNotes, setPianoNotes] = useState<PianoSeqItem[]>([]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chord Sheet PDF</h1>
          <p className="text-gray-500 text-lg">
            Build colour-coded chord charts and figurenote piano sequences
          </p>
        </header>

        <ManualChordsSection pianoNotes={pianoNotes} />

        <PianoNotesSection onNotesChange={setPianoNotes} />
      </div>
    </main>
  );
}
