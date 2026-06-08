"use client";
import { useState } from "react";

const SECTIONS = [
  {
    title: "Sointukortti",
    content: [
      {
        heading: "Sointujen syöttäminen",
        text: "Kirjoita sointujen nimet kenttään välilyönneillä, pilkuilla tai pystypalkeilla erotettuina. Esim. C Am F G tai C | Am | F | G. Sekä B- että H-notaatio käy (Hm = Bm).",
      },
      {
        heading: "Otsikko ja alaotsikko",
        text: "Voit lisätä kappaleen otsikon ja tekijätiedot — ne näkyvät PDF:n yläreunassa.",
      },
      {
        heading: "Instrumenttien valinta",
        text: "Valitse haluamasi instrumentit Kitara, Ukulele, Piano tai Basso painikkeilla. Valitut instrumentit näkyvät sekä esikatselu- että PDF-näkymässä.",
      },
      {
        heading: "Transponointi",
        text: "Siirrä sointukiertoa puolisävelaskel kerrallaan + ja − painikkeilla. Sekä sointukaaviot että kuvionuottimelodia transponoituvat automaattisesti.",
      },
      {
        heading: "PDF:n lataaminen",
        text: "Paina Lataa PDF -painiketta ladataksesi valmiin sointukortin. PDF sisältää kaikki valitut instrumenttikaaviot sekä kuvionuottimelodia-osion.",
      },
    ],
  },
  {
    title: "Kuvionuottimelodia",
    content: [
      {
        heading: "Nauhoitustila",
        text: "Nauhoitus-painike näyttää tilan. Kun Nauhoitus päällä on aktiivinen (punainen), kaikki kosketukset tallentuvat nuottisarjaan. Nauhoitus pois -tilassa voit soittaa vapaasti ilman tallennusta.",
      },
      {
        heading: "Syöttötavat",
        text: "Voit syöttää nuotteja kolmella tavalla: Piano (c–c2-alue), Kitara (kaikki kuusi kieltä) ja Ukulele (GCEA-viritys). Vaihda tapa yläpalkista.",
      },
      {
        heading: "Kuvionuottisymbolit",
        text: "Symbolin muoto kertoo oktaavin:\n× risti = hyvin matalat äänet (alle c)\n■ neliö = matala oktaavi (c–h)\n● ympyrä = keski-C-oktaavi (c1–h1)\n▲ kolmio = korkea oktaavi (c2–h2)\n◆ timantti = hyvin korkeat äänet (c3 ja yli)\nVäri kertoo nuotin nimen (C=punainen, D=oranssi jne.).",
      },
      {
        heading: "Oktaavinotaatio",
        text: "Sovellus käyttää klassista notaatiota: C D E F G A H (iso-C-oktaavi), c d e f g a h (pieni-c-oktaavi), c1–h1 (keski-C-oktaavi), c2–h2 jne. Keski-C on c1.",
      },
      {
        heading: "Nuotin korvaaminen",
        text: "Paina nuottisarjassa olevaa nuottia valitaksesi sen (sininen kehys). Paina seuraavaksi haluamaasi koskettinta tai nauhaa — valittu nuotti korvautuu uudella.",
      },
      {
        heading: "Nuotin soittaminen",
        text: "Paina mitä tahansa nuottia nuottisarjassa kuullaksesi sen äänen.",
      },
      {
        heading: "Otsikot",
        text: "Lisää osioiden nimiä (esim. Intro, Säkeistö) kirjoittamalla teksti Otsikko-kenttään ja painamalla Lisää otsikko. Otsikko aloittaa uuden rivin nuottisarjaan.",
      },
      {
        heading: "Tahtiviivat ja toistot",
        text: "| lisää tahtiviivan. Toista-painike lisää toistokerran (esim. ×2) viimeisimmän tahtiviivan jälkeen.",
      },
      {
        heading: "Rivinvaihto ja kumoa",
        text: "↵-painike lisää rivinvaihdon nuottisarjaan. Ctrl+Z tai Kumoa-painike peruu viimeisen muutoksen.",
      },
    ],
  },
];

export function HelpModal() {
  const [open, setOpen]         = useState(false);
  const [section, setSection]   = useState(0);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Ohjeet"
        className="w-9 h-9 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 font-bold text-lg flex items-center justify-center transition-colors shadow-sm"
        aria-label="Avaa ohje"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">Ohjeet</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center text-xl transition-colors"
                aria-label="Sulje"
              >
                ×
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <nav className="w-44 shrink-0 border-r border-gray-100 py-3 flex flex-col gap-1 px-2">
                {SECTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSection(i)}
                    className={`text-left text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                      section === i
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </nav>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {SECTIONS[section].content.map((item, i) => (
                  <div key={i}>
                    <h3 className="text-sm font-bold text-gray-800 mb-1 uppercase tracking-wide">{item.heading}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
