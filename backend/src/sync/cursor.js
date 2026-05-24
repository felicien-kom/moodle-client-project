// src/sync/cursor.js
// Identique à ecom-client MAIS prisma est reçu en paramètre.
// Chaque utilisateur a son curseur dans sa propre base.

// Delta pour absorber les décalages d'horloges et résiduels
const SAFE_DELTA = 60; // en secondes

export const getCursor = async (prisma, userId) => {
  const cursor = await prisma.syncCursor.findUnique({
    where: { userId },
  });
  // console.log(cursor?.lastCursor ?? 0);
  return cursor?.lastCursor ?? 0;
};

// Sauvegarde servertime - 60s pour absorber les décalages d'horloge
export const saveCursor = async (prisma, userId, servertime) => {
  const safeTime = servertime - SAFE_DELTA;
  await prisma.syncCursor.upsert({
    where: { userId },
    update: { lastCursor: safeTime },
    create: { userId, lastCursor: safeTime },
  });
  return safeTime;
};