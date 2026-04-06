// src/server.js
import os from "os";
import app from "./app.js";
import { env } from "./config/env.js";
import { disconnectAll } from "./config/db.js";
import fs from "fs";

// Assurer que le dossier data/ existe au démarrage
if (!fs.existsSync(env.DATABASE_DIR)) {
  fs.mkdirSync(env.DATABASE_DIR, { recursive: true });
}

const host = env.HOST ? "0.0.0.0" : "127.0.0.1";

const server = app.listen(env.CLIENT_PORT, host, () => {
  console.log(`\n🎓 Moodle Client`);
  console.log(`   Local:   http://localhost:${env.CLIENT_PORT}`);

  // Si exposé sur toutes les interfaces, afficher aussi l'IP réseau (WiFi / Ethernet)
  if (host === "0.0.0.0") {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === "IPv4" && !net.internal) {
          console.log(`   Network: http://${net.address}:${env.CLIENT_PORT}`);
        }
      }
    }
  }

  console.log(`\n   ENV      : ${env.NODE_ENV}`);
  console.log(`   MOODLE   : ${env.MOODLE_URL}`);
  console.log(`   SERVICE  : ${env.MOODLE_SERVICE}`);
  console.log(`   DATA DIR : ${env.RELATIVE_DATABASE_DIR}`);
  console.log(`   CORS     : ${env.CORS_ORIGIN.join(", ")}\n`);
});

// Arrêt propre — déconnecter toutes les bases SQLite
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down...`);
  server.close(async () => {
    await disconnectAll();
    console.log("All database connections closed.\n");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));