import "./expoGameButton.css";

function EraController({ era }: { era: number }) {
  if (era === 1970) return <svg viewBox="0 0 64 64" className="expo-controller-art" aria-hidden="true">
    <path d="M9 46 16 40h32l7 6v8H9z" fill="#795337" stroke="#e2c291" strokeWidth="2" />
    <path d="M13 46h38v5H13z" fill="#33231d" /><path d="M19 43h25" stroke="#d6ae6e" strokeWidth="2" />
    <path d="M29 41 25 17" stroke="#d6d7ce" strokeWidth="4" strokeLinecap="round" /><circle cx="24" cy="15" r="8" fill="#bd382d" stroke="#f19a70" strokeWidth="2" />
    <circle cx="44" cy="44" r="4" fill="#d14b34" stroke="#ffc585" strokeWidth="1.5" /><path d="M15 55h34" stroke="#3a2119" strokeWidth="2" />
  </svg>;
  if (era === 1980) return <svg viewBox="0 0 64 64" className="expo-controller-art" aria-hidden="true">
    <path d="m8 42 8-11h33l7 11-4 11H12z" fill="#2a183b" stroke="#f070d0" strokeWidth="2" />
    <path d="M14 43h36" stroke="#70fff1" strokeWidth="1.5" /><path d="M24 40 21 20" stroke="#bfc8ce" strokeWidth="4" strokeLinecap="round" />
    <circle cx="20" cy="18" r="7" fill="#f44dac" stroke="#ffc5eb" strokeWidth="2" /><circle cx="39" cy="37" r="4.5" fill="#73f9ee" /><circle cx="47" cy="39" r="4" fill="#ffba77" />
    <path d="M18 52h28" stroke="#77518f" strokeWidth="2" />
  </svg>;
  if (era === 1990) return <svg viewBox="0 0 64 64" className="expo-controller-art" aria-hidden="true">
    <path d="M8 39q-2-12 10-15 14-5 28 0 12 3 10 15-2 10-10 10-6 0-10-6H28q-4 6-10 6-8 0-10-10Z" fill="#34363c" stroke="#a6a7aa" strokeWidth="2" />
    <path d="M18 30v13m-6-7h12" stroke="#dedfe0" strokeWidth="3" strokeLinecap="round" /><circle cx="38" cy="35" r="3.2" fill="#dc404a" /><circle cx="45" cy="32" r="3.2" fill="#d3b34c" /><circle cx="49" cy="39" r="3.2" fill="#69a1cb" />
    <path d="M27 30h8" stroke="#72757b" strokeWidth="2" /><circle cx="32" cy="38" r="2" fill="#9b9da3" />
  </svg>;
  if (era === 2000) return <svg viewBox="0 0 64 64" className="expo-controller-art" aria-hidden="true">
    <path d="m9 34 7-9q4-4 11-2h10q7-2 11 2l7 9 2 11q0 7-7 8-5 1-10-8l-4-3h-8l-4 3q-5 9-10 8-7-1-7-8z" fill="#d9dbe4" stroke="#f6f8ff" strokeWidth="2" />
    <path d="M18 28v13m-6-7h12" stroke="#454652" strokeWidth="2.7" /><circle cx="25" cy="42" r="3.6" fill="#41444d" /><circle cx="39" cy="42" r="3.6" fill="#41444d" />
    <path d="m45 28 3 3-3 3-3-3z" fill="#8e83c4" /><circle cx="51" cy="36" r="2.5" fill="#e38d9a" /><path d="m43 37 3 4m3-4-3 4" stroke="#86b3d4" strokeWidth="1.8" />
    <path d="M28 29h8" stroke="#868896" strokeWidth="2" />
  </svg>;
  if (era === 2010) return <svg viewBox="0 0 64 64" className="expo-controller-art" aria-hidden="true">
    <path d="M9 25q0-5 5-5h36q5 0 5 5v24q0 4-5 4H14q-5 0-5-4z" fill="#eef0ee" stroke="#7c9aa0" strokeWidth="2" />
    <rect x="19" y="23" width="26" height="23" rx="1.5" fill="#30516a" stroke="#a1d2d8" strokeWidth="1.5" /><path d="M22 26h20v17H22z" fill="#77b6c0" opacity=".6" />
    <path d="M14 29v11m-5-5h10" stroke="#486a70" strokeWidth="2" /><circle cx="49" cy="31" r="2" fill="#de7d66" /><circle cx="50" cy="39" r="2" fill="#84c890" /><circle cx="14" cy="46" r="2" fill="#67828c" />
  </svg>;
  return <svg viewBox="0 0 64 64" className="expo-controller-art" aria-hidden="true">
    <path d="m8 37 6-9 11-4h14l11 4 6 9-2 12q-2 6-8 3l-10-7H28l-10 7q-6 3-8-3z" fill="#f0f2f3" stroke="#99b9ba" strokeWidth="2" />
    <path d="M12 37h15l4 8h-6l-9 6q-5 3-7-3zM52 37H37l-4 8h6l9 6q5 3 7-3z" fill="#202c35" /><path d="M19 31v9m-5-4h10" stroke="#d9f3ed" strokeWidth="2.5" />
    <circle cx="27" cy="44" r="3" fill="#5d7180" /><circle cx="38" cy="44" r="3" fill="#5d7180" /><circle cx="45" cy="32" r="2" fill="#64e5cc" /><circle cx="50" cy="36" r="2" fill="#a280df" />
    <path d="M27 27h10" stroke="#8ae9dc" strokeWidth="2" />
  </svg>;
}

export default function ExpoGameButton({ decade, onClick }: { decade: number; onClick: () => void }) {
  const era = decade === 1970 || decade === 1980 || decade === 1990 || decade === 2000 || decade === 2010 || decade === 2020 ? decade : 2020;

  return (
    <button className="expo-game-button" data-era={era} type="button" onClick={onClick} aria-label="Abrir juego especial Expo 2026" title="Juego especial · Expo 2026">
      <svg className="expo-game-ring" viewBox="0 0 100 100" aria-hidden="true">
        <defs><path id="expo-game-orbit" d="M 50,50 m -39,0 a 39,39 0 1,1 78,0 a 39,39 0 1,1 -78,0" /></defs>
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="1" strokeDasharray="2 4" />
        <text><textPath href="#expo-game-orbit" startOffset="0%">✦ EXPO 2026 ✦ JUGÁ ENTRE ÉPOCAS ✦</textPath></text>
      </svg>
      <span className="expo-game-device" aria-hidden="true">
        <EraController era={era} />
      </span>
    </button>
  );
}
