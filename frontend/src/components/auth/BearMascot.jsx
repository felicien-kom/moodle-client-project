import React, { useEffect, useState } from 'react';

export function BearMascot({ state = "idle", lookAngle = 0 }) {
  // state peut être: "idle", "password", "peek"
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (state !== "idle") return; // Si les mains couvrent, pas besoin de suivre la souris
    
    const handleMouseMove = (e) => {
      // Normaliser la position de la souris de -1 à 1 par rapport à la fenêtre
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [state]);

  // Constantes de mouvement
  const PUPIL_MOVE = 4;
  const FACE_MOVE = 2;

  // Calculs pour "idle"
  const pupilX = state === "idle" ? mousePos.x * PUPIL_MOVE : 0;
  const pupilY = state === "idle" ? mousePos.y * PUPIL_MOVE : 0;
  const faceX = state === "idle" ? mousePos.x * FACE_MOVE : 0;
  const faceY = state === "idle" ? mousePos.y * FACE_MOVE : 0;

  // État des bras (pattes)
  // cover: remonte pour cacher les yeux
  // peek: l'un cache, l'autre baisse un peu
  // idle: croisées en bas
  
  const isCover = state === "password" || state === "peek";
  const isPeek = state === "peek";

  return (
    <div className="relative w-40 h-40 mx-auto overflow-visible select-none">
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
        
        {/* GROUPE TÊTE QUI BOUGE LEGEREMENT */}
        <g style={{ transform: `translate(${faceX}px, ${faceY}px)`, transition: 'transform 0.1s ease-out' }}>
          
          {/* Oreilles */}
          <circle cx="50" cy="50" r="20" fill="#4B5563" />
          <circle cx="50" cy="50" r="12" fill="#9CA3AF" />
          
          <circle cx="150" cy="50" r="20" fill="#4B5563" />
          <circle cx="150" cy="50" r="12" fill="#9CA3AF" />

          {/* Visage Principal */}
          <circle cx="100" cy="100" r="70" fill="#6B7280" />
          <ellipse cx="100" cy="120" rx="40" ry="30" fill="#F3F4F6" />
          
          {/* Nez et Bouche */}
          <ellipse cx="100" cy="110" rx="12" ry="8" fill="#111827" />
          <path d="M 100 118 Q 100 130 90 130" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 100 118 Q 100 130 110 130" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Yeux */}
          {/* Oeil Gauche */}
          <g>
            <circle cx="70" cy="80" r="14" fill="white" />
            {(state === "idle" || state === "peek") ? (
               <circle cx="70" cy="80" r="6" fill="#111827" style={{ transform: `translate(${pupilX}px, ${pupilY}px)`, transition: 'transform 0.1s ease-out' }} />
            ) : (
               <path d="M 60 80 Q 70 70 80 80" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </g>

          {/* Oeil Droit */}
          <g>
            <circle cx="130" cy="80" r="14" fill="white" />
            {state === "idle" ? (
               <circle cx="130" cy="80" r="6" fill="#111827" style={{ transform: `translate(${pupilX}px, ${pupilY}px)`, transition: 'transform 0.1s ease-out' }} />
            ) : (
               <path d="M 120 80 Q 130 70 140 80" stroke="#111827" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </g>
        </g>

        {/* CORPS (caché en bas) */}
        <path d="M 40 200 Q 100 130 160 200" fill="#4B5563" />
        
        {/* BRAS / PATTES */}
        {/* Patte Gauche */}
        <g 
          style={{ 
            transformOrigin: '40px 180px',
            transform: isCover ? 'rotate(50deg) translate(30px, -70px)' : 'rotate(0deg) translate(0, 0)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          <ellipse cx="40" cy="180" rx="20" ry="30" fill="#4B5563" />
          <ellipse cx="40" cy="165" rx="12" ry="15" fill="#9CA3AF" />
        </g>

        {/* Patte Droite (Peek = on la baisse un peu) */}
        <g 
          style={{ 
            transformOrigin: '160px 180px',
            transform: isCover 
                        ? (isPeek ? 'rotate(-30deg) translate(-10px, -20px)' : 'rotate(-50deg) translate(-30px, -70px)') 
                        : 'rotate(0deg) translate(0, 0)',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          <ellipse cx="160" cy="180" rx="20" ry="30" fill="#4B5563" />
          <ellipse cx="160" cy="165" rx="12" ry="15" fill="#9CA3AF" />
        </g>
      </svg>
    </div>
  );
}
