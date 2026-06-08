"use client";
import { useState } from "react";
import { ManualChordsSection } from "../components/ManualChordsSection";
import { PianoNotesSection } from "../components/PianoNotesSection";
import { HelpModal } from "../components/HelpModal";
import type { PianoSeqItem } from "../lib/types";

export default function HomePage() {
  const [pianoNotes, setPianoNotes] = useState<PianoSeqItem[]>([]);
  const [transpose, setTranspose]   = useState(0);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-left mb-10 relative">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sointukortti PDF</h1>
          <p className="text-gray-500 text-lg">
            Luo värikoodattuja sointukaavioita ja pianon kuvionuottisarjoja
          </p>
          <div className="absolute right-0 top-0">
            <HelpModal />
          </div>
        </header>

        <ManualChordsSection
          pianoNotes={pianoNotes}
          transpose={transpose}
          onTransposeChange={setTranspose}
        />

        <PianoNotesSection
          onNotesChange={setPianoNotes}
          transpose={transpose}
        />
      </div>
    </main>
  );
}
