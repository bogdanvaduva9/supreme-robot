"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../../hooks/useGame";
import type { Language } from "../../lib/types/game";

const LABELS = {
  en: {
    title: "Create Your",
    titleAccent: "Life",
    name: "Name",
    namePlaceholder: "Enter your character's name",
    gender: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderNonBinary: "Non-binary",
    birthYear: "Birth Year",
    location: "Birth Location",
    locationPlaceholder: "City, Country (e.g. Bucharest, Romania)",
    language: "Game Language",
    startingAge: "Starting Age",
    startingAgeHint: "0 = start from birth. Any higher age and the AI will generate your backstory.",
    submit: "Begin Life",
    submitting: "Creating your life...",
  },
  ro: {
    title: "Creează-ți",
    titleAccent: "Viața",
    name: "Nume",
    namePlaceholder: "Introdu numele personajului tău",
    gender: "Gen",
    genderMale: "Masculin",
    genderFemale: "Feminin",
    genderNonBinary: "Non-binar",
    birthYear: "Anul nașterii",
    location: "Locul nașterii",
    locationPlaceholder: "Oraș, Țară (ex. București, România)",
    language: "Limba jocului",
    startingAge: "Vârsta de start",
    startingAgeHint: "0 = începe de la naștere. Orice altă vârstă și AI-ul va genera povestea vieții tale.",
    submit: "Începe Viața",
    submitting: "Se creează viața ta...",
  },
} satisfies Record<Language, Record<string, string>>;

export default function NewGamePage() {
  const router = useRouter();
  const { startGame, isLoading, error } = useGame();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("male");
  const [birthYear, setBirthYear] = useState(2026);
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [startingAge, setStartingAge] = useState(0);

  const t = LABELS[language];

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !location.trim()) return;
    await startGame(name.trim(), gender, birthYear, location.trim(), language, startingAge);
    router.push("/game");
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">
          {t.title} <span className="text-accent">{t.titleAccent}</span>
        </h1>

        <form onSubmit={handleStart} className="space-y-5">
          {/* Language selector first — affects all other labels */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">
              {t.language}
            </label>
            <div className="flex gap-2">
              {(["en", "ro"] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    language === lang
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border hover:border-muted text-muted"
                  }`}
                >
                  {lang === "en" ? "🇬🇧 English" : "🇷🇴 Română"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted mb-2">
              {t.name}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-foreground placeholder:text-muted"
              required
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-muted mb-2">
              {t.gender}
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-foreground"
            >
              <option value="male">{t.genderMale}</option>
              <option value="female">{t.genderFemale}</option>
              <option value="non-binary">{t.genderNonBinary}</option>
            </select>
          </div>

          <div>
            <label htmlFor="birthYear" className="block text-sm font-medium text-muted mb-2">
              {t.birthYear}
            </label>
            <input
              id="birthYear"
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              min={1900}
              max={2100}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-foreground"
            />
          </div>

          <div>
            <label htmlFor="startingAge" className="block text-sm font-medium text-muted mb-2">
              {t.startingAge}
            </label>
            <input
              id="startingAge"
              type="number"
              value={startingAge}
              onChange={(e) => setStartingAge(Math.max(0, Math.min(80, Number(e.target.value))))}
              min={0}
              max={80}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-foreground"
            />
            <p className="mt-1.5 text-xs text-muted">{t.startingAgeHint}</p>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-muted mb-2">
              {t.location}
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t.locationPlaceholder}
              className="w-full px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent text-foreground placeholder:text-muted"
              required
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading || !name.trim() || !location.trim()}
            className="w-full px-4 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t.submitting : t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}
