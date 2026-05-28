import React, { useEffect, useState } from 'react';

export function MonsterMascots({ state = "idle" }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (state === "password") return; // Si mot de passe, ils regardent ailleurs, pas la souris
    
    const handleMouseMove = (e) => {
      // Pourcentage de l'écran (-1 à 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state]);

  const isPwd = state === "password";
  const isPeek = state === "peek";

  // Mouvements des pupilles (bridés selon l'état)
  const px = isPwd ? -15 : (isPeek ? -8 : mousePos.x * 8);
  const py = isPwd ? -15 : (isPeek ? -2 : mousePos.y * 8);

  // Mouvement spécifique pour chaque monstre quand c'est le mot de passe
  const bluePx = isPwd ? -12 : mousePos.x * 10;
  const bluePy = isPwd ? -6 : mousePos.y * 10;

  const pinkBlobPx = isPwd ? 0 : mousePos.x * 12;
  const pinkBlobPy = isPwd ? -18 : mousePos.y * 12;

  const greenPx = isPwd ? -10 : mousePos.x * 8;
  const greenPy = isPwd ? -10 : mousePos.y * 8;

  const topPx = isPwd ? 10 : mousePos.x * 5;
  const topPy = isPwd ? -10 : mousePos.y * 5;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden pb-10">
      {/* SVG Container viewBox 0 0 400 400 pour bien centrer le groupe */}
      <svg viewBox="0 0 400 400" className="w-[120%] max-w-[500px] h-auto drop-shadow-sm transition-transform duration-300">
        
        {/* =======================================
            GROS MONSTRE ROSE (PINK BLOB)
        ======================================= */}
        <g id="pink-blob" transform="translate(180, 120)">
          {/* Corps */}
          <path d="M 0 300 L 0 100 Q 0 0 80 0 Q 160 0 160 100 L 160 300 Z" fill="#FFAEDB" />
          
          {/* Oeil unique */}
          <circle cx="60" cy="80" r="30" fill="white" />
          {/* Pupille */}
          <circle 
            cx="60" cy="80" r="14" fill="#333333" 
            style={{ transform: `translate(${pinkBlobPx}px, ${pinkBlobPy}px)`, transition: 'transform 0.2s ease-out' }} 
          />
          {/* Reflet pupille */}
          <circle 
            cx="55" cy="75" r="4" fill="white" 
            style={{ transform: `translate(${pinkBlobPx}px, ${pinkBlobPy}px)`, transition: 'transform 0.2s ease-out' }} 
          />

          {/* Bouche ouverte */}
          <path d="M 90 150 Q 80 180 110 180 Q 140 180 130 150 Z" fill="#B36B82" />
          {/* Dents (2) */}
          <path d="M 95 150 L 95 160 Q 100 165 105 160 L 105 150 Z" fill="white" />
          <path d="M 115 150 L 115 160 Q 120 165 125 160 L 125 150 Z" fill="white" />
        </g>

        {/* =======================================
            MONSTRE VERT NUAGE (GREEN FLUFF)
        ======================================= */}
        <g id="green-fluff" transform="translate(60, 160)">
          {/* Jambes */}
          <rect x="50" y="80" width="16" height="150" fill="#75CDD8" />
          <rect x="90" y="80" width="16" height="150" fill="#75CDD8" />
          
          {/* Nuage corps (bricolage avec plein de cercles) */}
          <g fill="#7CD9E4">
            <circle cx="80" cy="60" r="50" />
            <circle cx="40" cy="50" r="25" />
            <circle cx="120" cy="50" r="25" />
            <circle cx="30" cy="80" r="25" />
            <circle cx="130" cy="80" r="25" />
            <circle cx="50" cy="110" r="30" />
            <circle cx="110" cy="110" r="30" />
            <circle cx="80" cy="120" r="35" />
          </g>

          {/* Yeux */}
          <circle cx="60" cy="50" r="18" fill="white" />
          <circle cx="100" cy="50" r="18" fill="white" />
          
          {/* Pupilles */}
          <g style={{ transform: `translate(${greenPx}px, ${greenPy}px)`, transition: 'transform 0.2s ease-out' }}>
            <circle cx="60" cy="50" r="8" fill="#333333" />
            <circle cx="100" cy="50" r="8" fill="#333333" />
          </g>

          {/* Bouche rectangle */}
          <rect x="65" y="85" width="30" height="12" rx="4" fill="#2E7E86" />
        </g>

        {/* =======================================
            RECTANGLE ROUGE (TOP)
        ======================================= */}
        <g id="red-rect" transform="translate(40, 80)">
          {/* Corps / Jambes invisibles mais liées */}
          <path d="M 60 40 L 90 200" stroke="#F15278" strokeWidth="16" strokeLinecap="round" />
          <path d="M 120 40 L 140 200" stroke="#F15278" strokeWidth="16" strokeLinecap="round" />

          {/* Yeux au dessus qui flottent */}
          <circle cx="60" cy="-20" r="16" fill="white" />
          <circle cx="100" cy="-20" r="16" fill="white" />
          <g style={{ transform: `translate(${topPx}px, ${topPy}px)`, transition: 'transform 0.2s ease-out' }}>
            <circle cx="60" cy="-20" r="7" fill="#333333" />
            <circle cx="100" cy="-20" r="7" fill="#333333" />
          </g>

          {/* Grande bouche dentée (le rectangle rouge contour) */}
          <rect x="0" y="0" width="180" height="40" rx="20" fill="white" stroke="#F15278" strokeWidth="14" />
          {/* Lignes pour les dents */}
          <line x1="30" y1="0" x2="30" y2="40" stroke="#F15278" strokeWidth="4" />
          <line x1="60" y1="0" x2="60" y2="40" stroke="#F15278" strokeWidth="4" />
          <line x1="90" y1="0" x2="90" y2="40" stroke="#F15278" strokeWidth="4" />
          <line x1="120" y1="0" x2="120" y2="40" stroke="#F15278" strokeWidth="4" />
          <line x1="150" y1="0" x2="150" y2="40" stroke="#F15278" strokeWidth="4" />
          <line x1="0" y1="20" x2="180" y2="20" stroke="#F15278" strokeWidth="4" />
        </g>

        {/* =======================================
            PETIT MONSTRE BLEU (BLUE CIRCLE)
        ======================================= */}
        <g id="blue-circle" transform="translate(140, 240)">
          {/* Jambes */}
          <rect x="30" y="60" width="16" height="120" fill="#3B82F6" />
          <rect x="70" y="60" width="16" height="120" fill="#3B82F6" />
          
          {/* Corps rond */}
          <circle cx="58" cy="40" r="50" fill="#3699FF" />

          {/* Yeux */}
          <circle cx="35" cy="30" r="14" fill="white" />
          <circle cx="75" cy="25" r="18" fill="white" />
          
          {/* Pupilles */}
          <g style={{ transform: `translate(${bluePx}px, ${bluePy}px)`, transition: 'transform 0.2s ease-out' }}>
            <circle cx="35" cy="30" r="6" fill="#111827" />
            <circle cx="75" cy="25" r="8" fill="#111827" />
          </g>

          {/* Petite bouche (qui change quand isPwd) */}
          {isPwd ? (
            <circle cx="58" cy="65" r="8" fill="#1E3A8A" />
          ) : (
            <path d="M 50 60 Q 58 70 66 60 Z" fill="#1E3A8A" />
          )}
          {/* Dents du bleu */}
          {isPwd ? (
             <rect x="55" y="58" width="6" height="4" fill="white" />
          ) : (
             <rect x="54" y="60" width="8" height="3" fill="white" />
          )}
        </g>

      </svg>
    </div>
  );
}
