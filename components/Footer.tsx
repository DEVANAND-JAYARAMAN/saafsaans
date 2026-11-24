export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink/60">
      <div className="mx-auto grid w-full max-w-6xl gap-2 px-4 py-8 text-sm text-white/50 md:px-6">
        <p className="font-semibold text-white/70">
          SaafSaans — clean breath for every family.
        </p>
        <p>
          Air data: Open-Meteo (Copernicus CAMS), modelled hourly values shown as indicative CPCB AQI
          estimates. GenAI narration by Google Gemini over a verified deterministic engine.
        </p>
        <p>
          Not medical advice. In a health emergency, follow your doctor and official government
          advisories.
        </p>
      </div>
    </footer>
  );
}
